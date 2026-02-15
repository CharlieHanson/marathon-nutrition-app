/**
 * TEST ENDPOINT: generate-day-web.js
 * pages/api/generate-day-web.js
 *
 * Generates one day's meals, streaming each meal to the frontend via SSE.
 * Uses the full new pipeline: TDEE → budgets → OpenAI (per meal) → density → scaler
 *
 * Body: { userProfile, foodPreferences, trainingPlan, day }
 *   day = "monday" | "tuesday" | ... | "sunday"
 */

import OpenAI from 'openai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userProfile, foodPreferences, trainingPlan, day } = req.body;

  if (!userProfile || !day) {
    return res.status(400).json({ success: false, error: 'Missing userProfile or day' });
  }

  // ── SSE setup ──
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // ── Step 1: TDEE + meal budgets ──
    const dayWorkouts = trainingPlan?.[day]?.workouts || [];
    const dayTiming = trainingPlan?.[day]?.timing || null;

    const nutrition = computeNutritionTargets({
      userProfile,
      todayWorkouts: dayWorkouts,
      workoutTiming: dayTiming,
    });

    send('nutrition', {
      dailyMacros: nutrition.dailyMacros,
      mealBudgets: nutrition.mealBudgets,
      parsed: nutrition.parsed,
      bmr: nutrition.bmr,
      tdee: nutrition.tdee,
      adjustedTdee: nutrition.adjustedTdee,
    });

    // ── Step 2: Generate each meal sequentially ──
    const generatedMeals = [];

    // Determine today/tomorrow training for prompt context
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(day);
    const tomorrowDay = days[(dayIndex + 1) % 7];
    const todayTraining = formatTrainingDay(dayWorkouts);
    const tomorrowTraining = formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []);

    for (const mealType of MEAL_TYPES) {
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
          dietaryRestrictions: userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '',
          todayTraining,
          tomorrowTraining,
          avoidIngredients: [],
          alreadyGeneratedToday: generatedMeals.map((m) => m.meal_name),
        });

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const mealData = parseJSON(response.choices[0].message.content);

        // Validate ingredients
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

        // Density lookup + scaler
        const result = estimateAndAdjust(ingredients, budget);

        const meal = {
          meal_name: mealData.meal_name || `${mealType} meal`,
          ingredients: result.ingredients,
          macros: {
            calories: Math.round(result.macros.calories),
            protein: Math.round(result.macros.protein),
            carbs: Math.round(result.macros.carbs),
            fat: Math.round(result.macros.fat),
          },
          budget,
          scaled: result.scaled,
          scaleFactors: result.scaleFactors,
        };

        generatedMeals.push(meal);
        send('meal', { mealType, meal });
      } catch (err) {
        console.error(`Error generating ${mealType}:`, err.message);
        send('meal', { mealType, error: err.message });
      }
    }

    // ── Step 3: Send daily totals ──
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
    });
  } catch (err) {
    console.error('generate-day-web error:', err);
    send('error', { message: err.message });
  } finally {
    res.end();
  }
}