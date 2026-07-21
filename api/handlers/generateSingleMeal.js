/**
 * Shared handler: generate ONE meal for a specific slot.
 */

import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../shared/lib/validateIngredients.js';
import { completeJSON, isHighDemandError, OPENAI_MEAL_MODEL } from '../lib/aiCompletion.js';
import { parseAIJson } from '../lib/parseAIJson.js';
import { checkAndIncrementUsage } from '../lib/rateLimiter.js';
import { getRequestUserId } from '../lib/requestUser.js';
import {
  buildMealSlots,
  toInternalMealType,
  toUiMealType,
  resolveMealToggles,
  getInactiveMealTypeError,
} from '../../shared/lib/mealSlots.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AI_CONFIG = {
  gemini: { geminiModel: 'gemini-2.5-pro', temperature: 0.7, maxTokens: 5000 },
  openai: { openaiModel: OPENAI_MEAL_MODEL, temperature: 0.7, maxTokens: 800 },
};


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

export function createGenerateSingleMealHandler(provider) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const userId = getRequestUserId(req);
      const {
        day,
        mealType: rawMealType,
        userProfile,
        foodPreferences,
        trainingPlan,
        weekStarting,
        userPrompt,
        ragContext,
        includeSnacks,
        includeDessert,
      } = req.body;

      if (!userProfile || !day || !rawMealType) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

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

      const inactiveError = getInactiveMealTypeError(rawMealType, { includeSnacks, includeDessert });
      if (inactiveError) return res.status(400).json({ success: false, error: inactiveError });

      const { includeSnacks: iS, includeDessert: iD } = resolveMealToggles({ includeSnacks, includeDessert });
      const mealSlots = buildMealSlots({ includeSnacks: iS, includeDessert: iD });

      const mealType = toInternalMealType(rawMealType);
      const outKey = toUiMealType(mealType);
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

      const budget = nutrition.mealBudgets[mealType];
      if (!budget) {
        return res.status(400).json({ success: false, error: `No budget for meal type: ${rawMealType}` });
      }

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

      console.log(`🍽️ Generating ${rawMealType} for ${day} (${provider})${userPrompt ? ` (hint: "${userPrompt}")` : ''}`);

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
        provider,
      });
    } catch (error) {
      console.error(`generate-single-meal (${provider}) error:`, error);
      if (isHighDemandError(error.message)) {
        return res.status(503).json({
          error: 'Our AI is experiencing high demand right now. Please try again in a moment.',
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
