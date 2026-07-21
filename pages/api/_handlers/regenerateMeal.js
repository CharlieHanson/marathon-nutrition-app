/**
 * Shared handler: regenerate a single meal from user feedback.
 */

import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../../shared/lib/validateIngredients.js';
import { completeJSON, isHighDemandError, OPENAI_MEAL_MODEL } from '../lib/aiCompletion.js';
import { parseAIJson } from '../lib/parseAIJson.js';
import { checkAndIncrementUsage } from '../lib/rateLimiter.js';
import {
  buildMealSlots,
  toInternalMealType,
  resolveMealToggles,
  getInactiveMealTypeError,
} from '../../../shared/lib/mealSlots.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AI_CONFIG = {
  gemini: { geminiModel: 'gemini-2.5-flash', temperature: 0.7, maxTokens: 5000 },
  openai: { openaiModel: OPENAI_MEAL_MODEL, temperature: 0.7, maxTokens: 800 },
};

function toMealString(mealName, macros) {
  if (!macros) return mealName;
  return `${mealName} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
}

export function createRegenerateMealHandler(provider) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const {
        userId,
        userProfile,
        foodPreferences,
        trainingPlan,
        day,
        mealType,
        reason,
        currentMeal,
        includeSnacks,
        includeDessert,
      } = req.body;

      if (!userProfile || !mealType || !day) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const limitCheck = await checkAndIncrementUsage(supabase, userId, 'meal_generation');
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Daily limit reached.',
          limitReached: true,
          limit: limitCheck.limit,
        });
      }

      const inactiveError = getInactiveMealTypeError(mealType, { includeSnacks, includeDessert });
      if (inactiveError) return res.status(400).json({ success: false, error: inactiveError });

      const { includeSnacks: iS, includeDessert: iD } = resolveMealToggles({ includeSnacks, includeDessert });
      const mealSlots = buildMealSlots({ includeSnacks: iS, includeDessert: iD });

      const dislikes = foodPreferences?.dislikes || '';
      const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

      const dayWorkouts = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;
      const timingMap = { Morning: 'am', Afternoon: 'pm', Evening: 'pm' };

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayWorkouts,
        workoutTiming: timingMap[dayTiming] || null,
        mealSlots,
      });

      const budgetKey = toInternalMealType(mealType);
      const budget = nutrition.mealBudgets[budgetKey];

      if (!budget) {
        return res.status(400).json({ success: false, error: `No budget for meal type: ${mealType}` });
      }

      const currentMealDesc = (currentMeal || '').replace(/\(Cal:.*?\).*$/, '').trim();
      const dayIndex = DAYS.indexOf(day);
      const tomorrowDay = DAYS[(dayIndex + 1) % 7];

      const prompt = buildSingleMealPrompt({
        mealType: budgetKey,
        macroBudget: budget,
        foodPreferences,
        dietaryRestrictions,
        todayTraining: formatTrainingDay(dayWorkouts),
        tomorrowTraining: formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []),
        reason,
        currentMeal: currentMealDesc,
      });

      console.log(`🔄 Regenerating ${mealType} for ${day} (${provider}): "${reason}"`);

      const rawText = await completeJSON(provider, { prompt, ...AI_CONFIG[provider] });

      let mealData;
      try {
        mealData = parseAIJson(rawText);
      } catch (parseError) {
        console.error(`Failed to parse ${provider} response. Raw text:`, rawText);
        throw parseError;
      }

      let ingredients = (mealData.ingredients || [])
        .filter((ing) => ing.name && ing.type && ing.grams > 0)
        .map((ing) => ({
          name: String(ing.name).trim(),
          type: String(ing.type).trim().toLowerCase(),
          grams: Math.round(parseFloat(ing.grams) || 0),
        }));

      ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

      if (ingredients.length === 0) {
        return res.status(200).json({
          success: true,
          meal: mealData.meal_name || 'Generated meal',
          provider,
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

      res.status(200).json({
        success: true,
        meal: toMealString(mealName, macros),
        meal_v2: {
          meal_name: mealName,
          ingredients: result.ingredients,
          macros,
          budget,
          scaled: result.scaled,
          scaleFactors: result.scaleFactors,
        },
        provider,
      });
    } catch (error) {
      console.error(`regenerate-meal (${provider}) error:`, error);
      if (isHighDemandError(error.message)) {
        return res.status(503).json({
          error: 'Our AI is experiencing high demand right now. Please try again in a moment.',
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
