/**
 * generate-meals.js (Web — Full Week)
 * pages/api/generate-meals.js
 *
 * NEW ARCHITECTURE:
 *   1. TDEE + meal budgets (deterministic)
 *   2. OpenAI generates meals with structured ingredients + grams
 *   3. Density lookup computes actual macros
 *   4. Algebraic scaler adjusts portions to close gaps
 *
 * BACKWARD COMPATIBLE: Returns the same response shape the frontend expects:
 *   { success: true, meals: { monday: { breakfast: "Meal name (Cal: X, P: Xg, C: Xg, F: Xg)", ... } } }
 *
 * Also includes the new structured data in a separate field for when you
 * migrate the frontend: meals_v2, dailyTotals, dailyTargets
 */

import OpenAI from 'openai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildWeekPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAIResponse(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();
  try {
    return JSON.parse(s);
  } catch (e) {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }
}

function processMeal(mealData, macroBudget) {
  if (!mealData || !mealData.ingredients || !Array.isArray(mealData.ingredients)) {
    return null;
  }

  const validIngredients = mealData.ingredients
    .filter((ing) => ing.name && ing.type && ing.grams > 0)
    .map((ing) => ({
      name: String(ing.name).trim(),
      type: String(ing.type).trim().toLowerCase(),
      grams: Math.round(parseFloat(ing.grams) || 0),
    }));

  if (validIngredients.length === 0) return null;

  const result = estimateAndAdjust(validIngredients, macroBudget);

  return {
    meal_name: mealData.meal_name || 'Unnamed meal',
    ingredients: result.ingredients,
    macros: {
      calories: Math.round(result.macros.calories),
      protein: Math.round(result.macros.protein),
      carbs: Math.round(result.macros.carbs),
      fat: Math.round(result.macros.fat),
    },
    scaled: result.scaled,
    scaleFactors: result.scaleFactors,
  };
}

/**
 * Convert structured meal data to the old string format:
 * "Grilled Salmon with Quinoa (Cal: 550, P: 42g, C: 48g, F: 18g)"
 */
function toMealString(processed) {
  if (!processed || !processed.macros) {
    return processed?.meal_name || '';
  }
  const m = processed.macros;
  return `${processed.meal_name} (Cal: ${m.calories}, P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, trainingPlan } = req.body;

    if (!userProfile) {
      return res.status(400).json({ success: false, error: 'Missing user profile' });
    }

    // ── Step 1: Compute per-day nutrition targets ────────────────────────
    console.log('📊 Computing weekly nutrition targets...');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekMealBudgets = {};
    const weekNutrition = {};

    for (const day of days) {
      const dayTraining = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;

      // Map timing display values to tdeeCalc values
      const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };
      const workoutTiming = timingMap[dayTiming] || null;

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayTraining,
        workoutTiming,
      });

      weekNutrition[day] = nutrition;
      weekMealBudgets[day] = nutrition.mealBudgets;
    }

    // Format training schedule for the prompt
    const trainingSchedule = days
      .map((day) => {
        const workouts = trainingPlan?.[day]?.workouts || [];
        return `${day}: ${formatTrainingDay(workouts)}`;
      })
      .join('\n');

    // ── Step 2: Generate meals with OpenAI ───────────────────────────────
    console.log('🤖 Generating structured meal plan with OpenAI...');

    const prompt = buildWeekPrompt({
      weekMealBudgets,
      foodPreferences,
      dietaryRestrictions: userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '',
      trainingSchedule,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiText = response.choices[0].message.content;
    const weekMeals = parseAIResponse(aiText);

    // ── Step 3: Process each meal ────────────────────────────────────────
    console.log('⚖️ Computing macros and adjusting portions...');

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
    const normalizeKey = (key) => {
      if (key === 'snacks') return 'snack';
      return key;
    };
    // For old format output, use the keys the frontend expects
    const outputKey = (mealType) => {
      if (mealType === 'snack') return 'snacks';
      return mealType;
    };

    // Old format (backward compat): { monday: { breakfast: "string", ... } }
    const mealsOldFormat = {};
    // New structured format
    const mealsStructured = {};
    const weekTotals = {};

    for (const day of days) {
      mealsOldFormat[day] = {};
      mealsStructured[day] = {};
      weekTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      const dayMeals = weekMeals[day];
      if (!dayMeals) {
        console.warn(`No meals returned for ${day}`);
        continue;
      }

      for (const rawKey of Object.keys(dayMeals)) {
        const mealType = normalizeKey(rawKey);
        if (!mealTypes.includes(mealType)) continue;

        const budget = weekMealBudgets[day]?.[mealType];
        const processed = processMeal(dayMeals[rawKey], budget);
        const outKey = outputKey(mealType);

        if (processed) {
          mealsOldFormat[day][outKey] = toMealString(processed);
          mealsStructured[day][outKey] = processed;

          weekTotals[day].calories += processed.macros.calories;
          weekTotals[day].protein += processed.macros.protein;
          weekTotals[day].carbs += processed.macros.carbs;
          weekTotals[day].fat += processed.macros.fat;
        } else {
          // Fallback: use meal_name without macros
          const name = dayMeals[rawKey]?.meal_name || '';
          mealsOldFormat[day][outKey] = name;
          mealsStructured[day][outKey] = { meal_name: name, ingredients: [], macros: null };
        }
      }
    }

    // ── Step 4: Return response ──────────────────────────────────────────
    console.log('✅ Meal plan complete');

    // Log accuracy summary
    for (const day of days) {
      const target = weekNutrition[day].dailyMacros;
      const actual = weekTotals[day];
      const calDrift = Math.abs(actual.calories - target.calories);
      const pctDrift = target.calories > 0 ? ((calDrift / target.calories) * 100).toFixed(1) : '0';
      console.log(`  ${day}: ${actual.calories} / ${target.calories} kcal (${pctDrift}% drift)`);
    }

    res.status(200).json({
      success: true,
      // Old format — what the frontend currently reads
      meals: mealsOldFormat,
      // New structured data — use when you migrate the frontend
      meals_v2: mealsStructured,
      dailyTotals: weekTotals,
      dailyTargets: Object.fromEntries(
        days.map((day) => [day, weekNutrition[day].dailyMacros])
      ),
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}