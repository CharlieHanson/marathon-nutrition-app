/**
 * regenerate-meal.js
 * pages/api/regenerate-meal.js
 *
 * Regenerates a single meal based on user feedback.
 * Uses the new pipeline: TDEE budget → OpenAI (structured) → density → scaler
 *
 * BACKWARD COMPATIBLE: Returns { success, meal: "Name (Cal: X, P: Xg, C: Xg, F: Xg)" }
 */

import OpenAI from 'openai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseJSON(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
    throw new Error('Failed to parse AI JSON');
  }
}

function toMealString(mealName, macros) {
  if (!macros) return mealName;
  return `${mealName} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userProfile,
      foodPreferences,
      trainingPlan,
      day,
      mealType,
      reason,
      currentMeal,
    } = req.body;

    if (!userProfile || !mealType || !day) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // ── Step 1: Compute this meal's macro budget ─────────────────────────
    const dayWorkouts = trainingPlan?.[day]?.workouts || [];
    const dayTiming = trainingPlan?.[day]?.timing || null;
    const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

    const nutrition = computeNutritionTargets({
      userProfile,
      todayWorkouts: dayWorkouts,
      workoutTiming: timingMap[dayTiming] || null,
    });

    // Normalize mealType for budget lookup (frontend sends 'snacks', budget uses 'snack')
    const budgetKey = mealType === 'snacks' ? 'snack' : mealType;
    const budget = nutrition.mealBudgets[budgetKey];

    if (!budget) {
      return res.status(400).json({ success: false, error: `No budget for meal type: ${mealType}` });
    }

    // ── Step 2: Build prompt with feedback context ───────────────────────
    const currentMealDesc = (currentMeal || '').replace(/\(Cal:.*?\).*$/, '').trim();

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(day);
    const tomorrowDay = days[(dayIndex + 1) % 7];

    const prompt = buildSingleMealPrompt({
      mealType: budgetKey,
      macroBudget: budget,
      foodPreferences,
      dietaryRestrictions: userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '',
      todayTraining: formatTrainingDay(dayWorkouts),
      tomorrowTraining: formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []),
      reason,
      currentMeal: currentMealDesc,
    });

    // ── Step 3: Call OpenAI ──────────────────────────────────────────────
    console.log(`🔄 Regenerating ${mealType} for ${day}: "${reason}"`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const mealData = parseJSON(response.choices[0].message.content);

    // ── Step 4: Density lookup + scaler ──────────────────────────────────
    const ingredients = (mealData.ingredients || [])
      .filter((ing) => ing.name && ing.type && ing.grams > 0)
      .map((ing) => ({
        name: String(ing.name).trim(),
        type: String(ing.type).trim().toLowerCase(),
        grams: Math.round(parseFloat(ing.grams) || 0),
      }));

    if (ingredients.length === 0) {
      // Fallback: return just the meal name without macros
      return res.status(200).json({
        success: true,
        meal: mealData.meal_name || 'Generated meal',
      });
    }

    const result = estimateAndAdjust(ingredients, budget);
    const macros = {
      calories: Math.round(result.macros.calories),
      protein: Math.round(result.macros.protein),
      carbs: Math.round(result.macros.carbs),
      fat: Math.round(result.macros.fat),
    };

    const mealName = mealData.meal_name || 'Regenerated meal';

    console.log(`✅ ${mealName}: ${macros.calories} kcal (target: ${budget.calories}), scaled: ${result.scaled}`);

    // ── Step 5: Return backward-compatible response ──────────────────────
    res.status(200).json({
      success: true,
      // Old format — what useMealPlan.js reads
      meal: toMealString(mealName, macros),
      // New structured data — available when frontend migrates
      meal_v2: {
        meal_name: mealName,
        ingredients: result.ingredients,
        macros,
        budget,
        scaled: result.scaled,
        scaleFactors: result.scaleFactors,
      },
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}