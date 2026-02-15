/**
 * generate-day.js (Mobile + Web — Single Day, SSE)
 * pages/api/generate-day.js
 *
 * Fills EMPTY meal slots for one day. Skips meals that already exist.
 * Streams each meal as it's generated via SSE.
 *
 * NEW PIPELINE: TDEE → budget → OpenAI (per meal) → density → scaler
 *
 * Body: { userId, day, userProfile, foodPreferences, trainingPlan,
 *         weekStarting?, existingMeals?, ragContext? }
 *
 * SSE events:
 *   status  → { mealType, status: "generating"|"skipped" }
 *   meal    → { mealType, meal: "Name (Cal: X, P: Xg, C: Xg, F: Xg)", day }
 *   done    → { success, day, meals: [...], dailyTotals, dailyTargets }
 *   error   → { message }
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Map frontend keys to internal keys and back
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

/**
 * Extract protein ingredient names from a meal string for variety tracking.
 * e.g., "Grilled Salmon with Quinoa (Cal: 500, ...)" → ["salmon"]
 */
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

  const {
    userId,
    day,
    userProfile,
    foodPreferences,
    trainingPlan,
    weekStarting,
    existingMeals,  // optional: { breakfast: "...", lunch: "", dinner: "...", ... }
    ragContext,      // optional: string from RAG pipeline
  } = req.body;

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
    // ── Step 1: Load existing meals for the week (for variety) ──
    let weekMeals = existingMeals ? { [day]: existingMeals } : {};

    if (userId && weekStarting && !existingMeals) {
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

    const dayMeals = weekMeals[day] || {};

    // Determine which slots are empty
    const emptySlots = MEAL_TYPES.filter((mt) => {
      const key = toOutputKey(mt);
      const val = dayMeals[key] || dayMeals[mt];
      return !val || (typeof val === 'string' && val.trim() === '');
    });

    if (emptySlots.length === 0) {
      send('done', { success: true, day, meals: [], message: 'All slots already filled' });
      return res.end();
    }

    // ── Step 2: TDEE + meal budgets ──
    const dayWorkouts = trainingPlan?.[day]?.workouts || [];
    const dayTiming = trainingPlan?.[day]?.timing || null;
    const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

    const nutrition = computeNutritionTargets({
      userProfile,
      todayWorkouts: dayWorkouts,
      workoutTiming: timingMap[dayTiming] || null,
    });

    send('status', { message: `Generating ${emptySlots.length} meals for ${day}`, dailyMacros: nutrition.dailyMacros });

    // ── Step 3: Build avoid list from existing meals (variety) ──
    const usedProteins = [];
    for (const [d, meals] of Object.entries(weekMeals)) {
      if (typeof meals !== 'object') continue;
      for (const val of Object.values(meals)) {
        usedProteins.push(...extractProteins(val));
      }
    }
    const avoidIngredients = [...new Set(usedProteins)];

    // Training context
    const dayIndex = DAYS.indexOf(day);
    const tomorrowDay = DAYS[(dayIndex + 1) % 7];
    const todayTraining = formatTrainingDay(dayWorkouts);
    const tomorrowTraining = formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []);

    // ── Step 4: Generate each empty meal ──
    const generatedMeals = [];
    const alreadyGeneratedToday = [];

    // Include existing meals in the "already generated" list for variety
    for (const mt of MEAL_TYPES) {
      const key = toOutputKey(mt);
      const existing = dayMeals[key] || dayMeals[mt];
      if (existing && typeof existing === 'string' && existing.trim()) {
        alreadyGeneratedToday.push(existing.replace(/\(Cal:.*?\)/g, '').trim());
      }
    }

    for (const mealType of MEAL_TYPES) {
      const outKey = toOutputKey(mealType);

      // Skip if slot is already filled
      if (!emptySlots.includes(mealType)) {
        send('status', { mealType: outKey, status: 'skipped' });
        continue;
      }

      send('status', { mealType: outKey, status: 'generating' });

      const budget = nutrition.mealBudgets[mealType];
      if (!budget) {
        send('meal', { mealType: outKey, error: 'No budget', day });
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
          avoidIngredients,
          alreadyGeneratedToday,
          ragContext: ragContext || null,
        });

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const mealData = parseJSON(response.choices[0].message.content);
        const ingredients = (mealData.ingredients || [])
          .filter((ing) => ing.name && ing.type && ing.grams > 0)
          .map((ing) => ({
            name: String(ing.name).trim(),
            type: String(ing.type).trim().toLowerCase(),
            grams: Math.round(parseFloat(ing.grams) || 0),
          }));

        let mealString;
        if (ingredients.length > 0) {
          const result = estimateAndAdjust(ingredients, budget);
          const macros = {
            calories: Math.round(result.macros.calories),
            protein: Math.round(result.macros.protein),
            carbs: Math.round(result.macros.carbs),
            fat: Math.round(result.macros.fat),
          };
          mealString = toMealString(mealData.meal_name || mealType, macros);
        } else {
          mealString = mealData.meal_name || `Generated ${mealType}`;
        }

        generatedMeals.push({ mealType: outKey, meal: mealString });
        alreadyGeneratedToday.push(mealData.meal_name || '');

        send('meal', { mealType: outKey, meal: mealString, day });
      } catch (err) {
        console.error(`Error generating ${mealType}:`, err.message);
        send('meal', { mealType: outKey, error: err.message, day });
      }
    }

    // ── Step 5: Optionally save to DB ──
    if (userId && weekStarting) {
      try {
        const updatedDayMeals = { ...dayMeals };
        for (const { mealType, meal } of generatedMeals) {
          updatedDayMeals[mealType] = meal;
        }
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

    // ── Step 6: Done ──
    send('done', {
      success: true,
      day,
      meals: generatedMeals,
      dailyTargets: nutrition.dailyMacros,
    });
  } catch (err) {
    console.error('generate-day error:', err);
    send('error', { message: err.message });
  } finally {
    res.end();
  }
}