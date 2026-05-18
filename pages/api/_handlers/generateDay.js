/**
 * Shared handler: fill empty meal slots for one day (SSE).
 * One LLM call for all empty meals, then validate + density per meal.
 */

import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../../shared/lib/macroEstimator.js';
import { buildDayPrompt, formatTrainingDay } from '../../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../../shared/lib/validateIngredients.js';
import { completeJSON, isHighDemandError, OPENAI_MEAL_MODEL } from '../lib/aiCompletion.js';
import { parseAIJson } from '../lib/parseAIJson.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AI_CONFIG = {
  gemini: { geminiModel: 'gemini-2.5-flash', temperature: 0.8, maxTokens: 50000 },
  openai: { openaiModel: OPENAI_MEAL_MODEL, temperature: 0.8, maxTokens: 16000 },
};

const toOutputKey = (k) => (k === 'snack' ? 'snacks' : k);

function toMealString(name, macros) {
  if (!macros) return name;
  return `${name} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
}

export function createGenerateDayHandler(provider) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      userId,
      day,
      userProfile,
      foodPreferences,
      trainingPlan,
      weekStarting,
      existingMeals,
      ragContext,
      debug = false,
      forceRegenerate = false,
    } = req.body;

    if (!userProfile || !day) {
      return res.status(400).json({ success: false, error: 'Missing userProfile or day' });
    }

    const dislikes = foodPreferences?.dislikes || '';
    const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      let weekMeals = {};

      if (existingMeals) {
        if (typeof existingMeals === 'object' && (existingMeals.monday || existingMeals.tuesday)) {
          weekMeals = existingMeals;
        } else {
          weekMeals = { [day]: existingMeals };
        }
      } else if (userId) {
        try {
          let query = supabase
            .from('meal_plans')
            .select('meals')
            .eq('user_id', userId);

          if (weekStarting) {
            query = query.eq('week_starting', weekStarting);
          } else {
            query = query.order('updated_at', { ascending: false }).limit(1);
          }

          const { data } = await query.maybeSingle();
          if (data?.meals) weekMeals = data.meals;
        } catch (e) {
          console.warn('Could not load existing meals:', e.message);
        }
      }

      const dayMeals = weekMeals[day] || {};
      const emptySlots = [];

      if (forceRegenerate) {
        emptySlots.push(...MEAL_TYPES);
      } else {
        for (const mt of MEAL_TYPES) {
          const outKey = toOutputKey(mt);
          const val = dayMeals[outKey] || dayMeals[mt];
          if (val && typeof val === 'string' && val.trim()) {
            /* filled */
          } else {
            emptySlots.push(mt);
          }
        }

        if (emptySlots.length === 0) {
          send('done', { success: true, day, meals: {}, message: 'All slots already filled' });
          return res.end();
        }
      }

      const dayWorkouts = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;
      const timingMap = { Morning: 'am', Afternoon: 'pm', Evening: 'pm' };

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayWorkouts,
        workoutTiming: timingMap[dayTiming] || null,
      });

      send('nutrition', {
        dailyMacros: nutrition.dailyMacros,
        mealBudgets: nutrition.mealBudgets,
        bmr: nutrition.bmr,
        tdee: nutrition.tdee,
        adjustedTdee: nutrition.adjustedTdee,
        trainingMultiplier: nutrition.parsed?.trainingMultiplier || 1.0,
      });

      const previousDayMealNames = [];
      const dayIndex = DAYS.indexOf(day);
      const recentDayIndices = [(dayIndex - 1 + 7) % 7, (dayIndex - 2 + 7) % 7];
      for (const di of recentDayIndices) {
        const d = DAYS[di];
        const meals = weekMeals[d];
        if (!meals || typeof meals !== 'object') continue;
        for (const [key, val] of Object.entries(meals)) {
          if (!val || typeof val !== 'string' || key.includes('_rating')) continue;
          const name = val.replace(/\(Cal:.*?\).*$/, '').trim();
          if (name && !previousDayMealNames.includes(name)) {
            previousDayMealNames.push(name);
          }
        }
      }

      const tomorrowDay = DAYS[(dayIndex + 1) % 7];
      const todayTraining = formatTrainingDay(dayWorkouts);
      const tomorrowTraining = formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []);

      const budgetsToGenerate = {};
      for (const mt of emptySlots) {
        budgetsToGenerate[mt] = nutrition.mealBudgets[mt];
      }

      for (const mt of MEAL_TYPES) {
        if (!emptySlots.includes(mt)) {
          send('status', { mealType: toOutputKey(mt), status: 'skipped' });
        }
      }

      send('status', { message: `Generating ${emptySlots.length} meals for ${day}...` });

      const prompt = buildDayPrompt({
        mealBudgets: budgetsToGenerate,
        foodPreferences,
        dietaryRestrictions,
        todayTraining,
        tomorrowTraining,
        avoidIngredients: [],
        previousDayMealNames,
        ragContext: ragContext || null,
      });

      let rawResponse;
      try {
        rawResponse = await completeJSON(provider, { prompt, ...AI_CONFIG[provider] });
      } catch (aiError) {
        send('error', { message: aiError.message });
        return res.end();
      }

      let dayMealData;
      try {
        dayMealData = parseAIJson(rawResponse);
      } catch {
        console.error(`Failed to parse ${provider} response. Raw text:`, rawResponse);
        send('error', { message: 'Failed to parse AI response' });
        return res.end();
      }

      if (debug) {
        send('debug', { prompt, rawResponse, provider });
      }

      const generatedMealsObj = {};
      const dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      for (const mealType of emptySlots) {
        const outKey = toOutputKey(mealType);
        send('status', { mealType: outKey, status: 'processing' });

        const mealData = dayMealData[mealType] || dayMealData[outKey];

        if (!mealData || !mealData.ingredients || !Array.isArray(mealData.ingredients)) {
          send('meal', { mealType: outKey, error: 'No data returned for this meal', day });
          continue;
        }

        let ingredients = mealData.ingredients
          .filter((ing) => ing.name && ing.type && ing.grams > 0)
          .map((ing) => ({
            name: String(ing.name).trim(),
            type: String(ing.type).trim().toLowerCase(),
            grams: Math.round(parseFloat(ing.grams) || 0),
          }));

        ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

        if (ingredients.length === 0) {
          const fallback = mealData.meal_name || `Generated ${mealType}`;
          generatedMealsObj[outKey] = fallback;
          send('meal', { mealType: outKey, meal: fallback, day });
          continue;
        }

        const budget = budgetsToGenerate[mealType];
        const result = estimateAndAdjust(ingredients, budget);
        const macros = {
          calories: Math.round(result.macros.calories),
          protein: Math.round(result.macros.protein),
          carbs: Math.round(result.macros.carbs),
          fat: Math.round(result.macros.fat),
        };

        dailyTotals.calories += macros.calories;
        dailyTotals.protein += macros.protein;
        dailyTotals.carbs += macros.carbs;
        dailyTotals.fat += macros.fat;

        const mealName = mealData.meal_name || `${mealType} meal`;
        const mealString = toMealString(mealName, macros);

        generatedMealsObj[outKey] = mealString;
        send('meal', { mealType: outKey, meal: mealString, day });
      }

      if (userId && weekStarting) {
        try {
          const updatedDayMeals = { ...dayMeals, ...generatedMealsObj };
          const updatedWeekMeals = { ...weekMeals, [day]: updatedDayMeals };

          await supabase.from('meal_plans').upsert(
            {
              user_id: userId,
              week_starting: weekStarting,
              meals: updatedWeekMeals,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,week_starting' }
          );
        } catch (e) {
          console.warn('Failed to save meals to DB:', e.message);
        }
      }

      send('done', {
        success: true,
        day,
        meals: generatedMealsObj,
        dailyTotals,
        dailyTargets: nutrition.dailyMacros,
        provider,
      });
    } catch (err) {
      console.error(`generate-day (${provider}) error:`, err);
      if (isHighDemandError(err.message)) {
        send('error', {
          message: 'Our AI is experiencing high demand right now. Please try again in a moment.',
        });
      } else {
        send('error', { message: err.message });
      }
    } finally {
      res.end();
    }
  };
}
