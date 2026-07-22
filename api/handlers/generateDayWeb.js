/**
 * Shared handler: generate one day's meals (SSE), one LLM call per meal.
 */

import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';
import { completeJSON, isHighDemandError, OPENAI_MEAL_MODEL } from '../lib/aiCompletion.js';
import { parseAIJson } from '../lib/parseAIJson.js';
import { createClient } from '@supabase/supabase-js';
import { checkAndIncrementUsage } from '../lib/rateLimiter.js';
import { getRequestUserId } from '../lib/requestUser.js';
import { buildMealSlots, resolveMealToggles } from '../../shared/lib/mealSlots.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AI_CONFIG = {
  gemini: { geminiModel: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 800 },
  openai: { openaiModel: OPENAI_MEAL_MODEL, temperature: 0.7, maxTokens: 8000 },
};

export function createGenerateDayWebHandler(provider) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = getRequestUserId(req);
    const { userProfile, foodPreferences, trainingPlan, day, includeSnacks, includeDessert } = req.body;

    if (!userProfile || !day) {
      return res.status(400).json({ success: false, error: 'Missing userProfile or day' });
    }

    const { includeSnacks: iS, includeDessert: iD } = resolveMealToggles({ includeSnacks, includeDessert });
    const mealSlots = buildMealSlots({ includeSnacks: iS, includeDessert: iD });

    const limitCheck = await checkAndIncrementUsage(supabase, userId, 'meal_generation');
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.reason === 'daily_limit_reached' ? 'Daily limit reached.' : 'Unable to verify daily limit.',
        limitReached: true,
        limit: limitCheck.limit,
        reason: limitCheck.reason,
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    // Express does not flush headers implicitly the way Next.js Pages API does.
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const dayWorkouts = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayWorkouts,
        workoutTiming: dayTiming,
        mealSlots,
      });

      send('nutrition', {
        dailyMacros: nutrition.dailyMacros,
        mealBudgets: nutrition.mealBudgets,
        parsed: nutrition.parsed,
        bmr: nutrition.bmr,
        tdee: nutrition.tdee,
        adjustedTdee: nutrition.adjustedTdee,
        provider,
      });

      const generatedMeals = [];
      const dayIndex = DAYS.indexOf(day);
      const tomorrowDay = DAYS[(dayIndex + 1) % 7];
      const todayTraining = formatTrainingDay(dayWorkouts);
      const tomorrowTraining = formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []);

      for (const mealType of mealSlots) {
        send('status', { mealType, status: 'generating' });

        const budget = nutrition.mealBudgets[mealType];
        if (!budget) {
          send('meal', { mealType, error: 'No budget for this meal type' });
          continue;
        }

        try {
          const prompt = buildSingleMealPrompt({
            mealType,
            macroBudget: budget,
            foodPreferences,
            dietaryRestrictions:
              userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '',
            todayTraining,
            tomorrowTraining,
            avoidIngredients: [],
            alreadyGeneratedToday: generatedMeals.map((m) => m.meal_name),
          });

          const text = await completeJSON(provider, { prompt, ...AI_CONFIG[provider] });
          const mealData = parseAIJson(text);

          const ingredients = (mealData.ingredients || [])
            .filter((ing) => ing.name && ing.type && ing.grams > 0)
            .map((ing) => ({
              name: String(ing.name).trim(),
              type: String(ing.type).trim().toLowerCase(),
              grams: Math.round(parseFloat(ing.grams) || 0),
            }));

          if (ingredients.length === 0) {
            send('meal', { mealType, error: 'No valid ingredients returned' });
            continue;
          }

          const adjusted = estimateAndAdjust(ingredients, budget);

          const meal = {
            meal_name: mealData.meal_name || `${mealType} meal`,
            ingredients: adjusted.ingredients,
            macros: {
              calories: Math.round(adjusted.macros.calories),
              protein: Math.round(adjusted.macros.protein),
              carbs: Math.round(adjusted.macros.carbs),
              fat: Math.round(adjusted.macros.fat),
            },
            budget,
            scaled: adjusted.scaled,
            scaleFactors: adjusted.scaleFactors,
          };

          generatedMeals.push(meal);
          send('meal', { mealType, meal });
        } catch (err) {
          console.error(`Error generating ${mealType} (${provider}):`, err.message);
          send('meal', { mealType, error: err.message });
        }
      }

      const totals = generatedMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.macros.calories,
          protein: acc.protein + m.macros.protein,
          carbs: acc.carbs + m.macros.carbs,
          fat: acc.fat + m.macros.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      send('complete', {
        dailyTotals: totals,
        dailyTargets: nutrition.dailyMacros,
        mealsGenerated: generatedMeals.length,
        provider,
      });
    } catch (err) {
      console.error(`generate-day-web (${provider}) error:`, err);
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
