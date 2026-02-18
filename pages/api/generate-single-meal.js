/**
 * generate-single-meal.js
 * pages/api/generate-single-meal.js
 *
 * Generate ONE meal for a specific slot. Supports optional userPrompt hint.
 * PIPELINE: TDEE → budget → OpenAI → validate → density → scaler
 *
 * Body: { userId, day, mealType, userProfile, foodPreferences, trainingPlan,
 *         weekStarting?, userPrompt?, ragContext? }
 *
 * Returns: { success, meal: "Name (Cal: X, ...)", day, mealType, meal_v2: {...} }
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../shared/lib/validateIngredients.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const toInternalKey = (k) => (k === 'snacks' ? 'snack' : k);
const toOutputKey = (k) => (k === 'snack' ? 'snacks' : k);

function parseJSON(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();
  try { return JSON.parse(s); } catch {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
    throw new Error('Failed to parse AI JSON');
  }
}

function toMealString(name, macros) {
  if (!macros) return name;
  return `${name} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
}

function extractProteins(mealStr) {
  if (!mealStr || typeof mealStr !== 'string') return [];
  const desc = mealStr.replace(/\(Cal:.*?\)/g, '').toLowerCase();
  const proteins = [
    'chicken', 'salmon', 'tuna', 'beef', 'pork', 'turkey', 'shrimp',
    'tofu', 'tempeh', 'eggs', 'egg', 'cod', 'tilapia', 'lentil', 'chickpea',
  ];
  return proteins.filter((p) => desc.includes(p));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      day,
      mealType: rawMealType,
      userProfile,
      foodPreferences,
      trainingPlan,
      weekStarting,
      userPrompt,
      ragContext,
    } = req.body;

    if (!userProfile || !day || !rawMealType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const mealType = toInternalKey(rawMealType);
    const outKey = toOutputKey(mealType);
    const dislikes = foodPreferences?.dislikes || '';
    const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

    // ── Step 1: TDEE + budget for this meal ──
    const dayWorkouts = trainingPlan?.[day]?.workouts || [];
    const dayTiming = trainingPlan?.[day]?.timing || null;
    const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

    const nutrition = computeNutritionTargets({
      userProfile,
      todayWorkouts: dayWorkouts,
      workoutTiming: timingMap[dayTiming] || null,
    });

    const budget = nutrition.mealBudgets[mealType];
    if (!budget) {
      return res.status(400).json({ success: false, error: `No budget for meal type: ${rawMealType}` });
    }

    // ── Step 2: Load existing week meals for variety ──
    let weekMeals = {};
    if (userId && weekStarting) {
      try {
        const { data } = await supabase
          .from('meal_plans')
          .select('meals')
          .eq('user_id', userId)
          .eq('week_starting', weekStarting)
          .maybeSingle();
        if (data?.meals) weekMeals = data.meals;
      } catch (e) {
        console.warn('Could not load existing meals:', e.message);
      }
    }

    const usedProteins = [];
    const alreadyToday = [];
    for (const [d, meals] of Object.entries(weekMeals)) {
      if (typeof meals !== 'object') continue;
      for (const val of Object.values(meals)) {
        if (!val || typeof val !== 'string') continue;
        usedProteins.push(...extractProteins(val));
        if (d === day) {
          alreadyToday.push(val.replace(/\(Cal:.*?\)/g, '').trim());
        }
      }
    }

    const dayIndex = DAYS.indexOf(day);
    const tomorrowDay = DAYS[(dayIndex + 1) % 7];

    // ── Step 3: Build prompt ──
    const enhancedPreferences = userPrompt
      ? { ...foodPreferences, likes: [foodPreferences?.likes, userPrompt].filter(Boolean).join(', ') }
      : foodPreferences;

    const prompt = buildSingleMealPrompt({
      mealType,
      macroBudget: budget,
      foodPreferences: enhancedPreferences,
      dietaryRestrictions,
      todayTraining: formatTrainingDay(dayWorkouts),
      tomorrowTraining: formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []),
      avoidIngredients: [...new Set(usedProteins)],
      alreadyGeneratedToday: alreadyToday,
      ragContext: ragContext || null,
    });

    // ── Step 4: Call OpenAI ──
    console.log(`🍽️ Generating ${rawMealType} for ${day}${userPrompt ? ` (hint: "${userPrompt}")` : ''}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const mealData = parseJSON(response.choices[0].message.content);

    // ── Step 5: Validate + Density + Scaler ──
    let ingredients = (mealData.ingredients || [])
      .filter((ing) => ing.name && ing.type && ing.grams > 0)
      .map((ing) => ({
        name: String(ing.name).trim(),
        type: String(ing.type).trim().toLowerCase(),
        grams: Math.round(parseFloat(ing.grams) || 0),
      }));

    // Remove disliked foods + fix type misclassifications
    ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

    let mealString;
    let mealV2 = null;

    if (ingredients.length > 0) {
      const result = estimateAndAdjust(ingredients, budget);
      const macros = {
        calories: Math.round(result.macros.calories),
        protein: Math.round(result.macros.protein),
        carbs: Math.round(result.macros.carbs),
        fat: Math.round(result.macros.fat),
      };
      const mealName = mealData.meal_name || `Generated ${rawMealType}`;
      mealString = toMealString(mealName, macros);
      mealV2 = {
        meal_name: mealName,
        ingredients: result.ingredients,
        macros,
        budget,
        scaled: result.scaled,
        scaleFactors: result.scaleFactors,
      };
    } else {
      mealString = mealData.meal_name || `Generated ${rawMealType}`;
    }

    // ── Step 6: Optionally save to DB ──
    if (userId && weekStarting) {
      try {
        const dayMeals = weekMeals[day] || {};
        dayMeals[outKey] = mealString;
        weekMeals[day] = dayMeals;

        await supabase.from('meal_plans').upsert(
          {
            user_id: userId,
            week_starting: weekStarting,
            meals: weekMeals,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,week_starting' }
        );
      } catch (e) {
        console.warn('Failed to save meal to DB:', e.message);
      }
    }

    console.log(`✅ ${mealString}`);

    res.status(200).json({
      success: true,
      meal: mealString,
      day,
      mealType: outKey,
      meal_v2: mealV2,
    });
  } catch (error) {
    console.error('generate-single-meal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}