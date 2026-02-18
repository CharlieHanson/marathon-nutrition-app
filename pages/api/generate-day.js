/**
 * generate-day.js (Single Day, SSE)
 * pages/api/generate-day.js
 *
 * Fills EMPTY meal slots for one day using ONE OpenAI call for all 5 meals.
 * Streams each meal from the parsed response via SSE.
 *
 * ARCHITECTURE: TDEE → budgets → OpenAI (single call, all meals) → density + scaler per meal
 *
 * Body: { userId, day, userProfile, foodPreferences, trainingPlan,
 *         weekStarting?, existingMeals?, ragContext?, debug? }
 *
 * SSE events:
 *   debug     → { prompt, rawResponse } (only if debug=true in body)
 *   nutrition → { dailyMacros, mealBudgets, bmr, tdee, adjustedTdee }
 *   status    → { mealType, status: "generating"|"skipped"|"processing" }
 *   meal      → { mealType, meal: "Name (Cal: X, P: Xg, C: Xg, F: Xg)", day }
 *   done      → { success, day, meals: [...], dailyTotals, dailyTargets }
 *   error     → { message }
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildDayPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const toOutputKey = (k) => (k === 'snack' ? 'snacks' : k);
const toInternalKey = (k) => (k === 'snacks' ? 'snack' : k);

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
 * Extract key protein names from previous days' meals for cross-day variety.
 * Keeps the avoid list SHORT (just proteins) so the model doesn't get overwhelmed.
 */
function extractProteinsFromWeek(weekMeals, currentDay) {
  const proteins = [
    'chicken', 'salmon', 'tuna', 'beef', 'pork', 'turkey', 'shrimp',
    'tofu', 'tempeh', 'eggs', 'egg', 'cod', 'tilapia', 'lentil', 'chickpea',
    'lamb', 'duck', 'sausage', 'bacon', 'ham', 'prawn',
  ];
  const found = new Set();

  for (const [day, meals] of Object.entries(weekMeals)) {
    if (day === currentDay || typeof meals !== 'object') continue;
    for (const val of Object.values(meals)) {
      if (!val || typeof val !== 'string') continue;
      const desc = val.replace(/\(Cal:.*?\)/g, '').toLowerCase();
      for (const p of proteins) {
        if (desc.includes(p)) found.add(p);
      }
    }
  }
  return [...found];
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
    existingMeals,
    ragContext,
    debug = false,
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
    // ── Step 1: Load existing meals for cross-day variety ──
    let weekMeals = existingMeals ? { [day]: existingMeals } : {};

    if (userId && !existingMeals) {
      try {
        let query = supabase
          .from('meal_plans')
          .select('meals')
          .eq('user_id', userId);

        if (weekStarting) {
          query = query.eq('week_starting', weekStarting);
        } else {
          // No weekStarting provided — grab the most recent meal plan
          query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data } = await query.maybeSingle();
        if (data?.meals) weekMeals = data.meals;
      } catch (e) {
        console.warn('Could not load existing meals:', e.message);
      }
    }

    // Check which slots are already filled for this day
    const dayMeals = weekMeals[day] || {};
    const filledSlots = {};
    const emptySlots = [];

    for (const mt of MEAL_TYPES) {
      const outKey = toOutputKey(mt);
      const val = dayMeals[outKey] || dayMeals[mt];
      if (val && typeof val === 'string' && val.trim()) {
        filledSlots[mt] = val;
      } else {
        emptySlots.push(mt);
      }
    }

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

    send('nutrition', {
      dailyMacros: nutrition.dailyMacros,
      mealBudgets: nutrition.mealBudgets,
      bmr: nutrition.bmr,
      tdee: nutrition.tdee,
      adjustedTdee: nutrition.adjustedTdee,
    });

    // ── Step 3: Build cross-day variety from previous 2 days' dish names ──
    const previousDayMealNames = [];
    const dayIndex = DAYS.indexOf(day);
    // Get the 2 days before current day (wraps around: Monday looks at Sat/Sun)
    const recentDayIndices = [
      (dayIndex - 1 + 7) % 7,
      (dayIndex - 2 + 7) % 7,
    ];
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

    // Training context
    const tomorrowDay = DAYS[(dayIndex + 1) % 7];
    const todayTraining = formatTrainingDay(dayWorkouts);
    const tomorrowTraining = formatTrainingDay(trainingPlan?.[tomorrowDay]?.workouts || []);

    // ── Step 4: Build budgets for empty slots only ──
    const budgetsToGenerate = {};
    for (const mt of emptySlots) {
      budgetsToGenerate[mt] = nutrition.mealBudgets[mt];
    }

    // Mark filled slots as skipped
    for (const mt of MEAL_TYPES) {
      if (!emptySlots.includes(mt)) {
        send('status', { mealType: toOutputKey(mt), status: 'skipped' });
      }
    }

    // ── Step 5: ONE OpenAI call for all empty meals ──
    send('status', { message: `Generating ${emptySlots.length} meals for ${day}...` });

    const prompt = buildDayPrompt({
      mealBudgets: budgetsToGenerate,
      foodPreferences,
      dietaryRestrictions: userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '',
      todayTraining,
      tomorrowTraining,
      avoidIngredients: [],  // dish names handle cross-day variety now
      previousDayMealNames,
      ragContext: ragContext || null,
    });

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const rawResponse = aiResponse.choices[0].message.content;
    const dayMealData = parseJSON(rawResponse);

    // ── Send debug info if requested ──
    if (debug) {
      send('debug', { prompt, rawResponse });
    }

    // ── Step 6: Process each meal (density + scaler) and stream ──
    const generatedMeals = [];
    const dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (const mealType of emptySlots) {
      const outKey = toOutputKey(mealType);
      send('status', { mealType: outKey, status: 'processing' });

      // AI might return 'snack' or 'snacks' — check both
      const mealData = dayMealData[mealType] || dayMealData[toOutputKey(mealType)];

      if (!mealData || !mealData.ingredients || !Array.isArray(mealData.ingredients)) {
        send('meal', { mealType: outKey, error: 'No data returned for this meal', day });
        continue;
      }

      const ingredients = mealData.ingredients
        .filter((ing) => ing.name && ing.type && ing.grams > 0)
        .map((ing) => ({
          name: String(ing.name).trim(),
          type: String(ing.type).trim().toLowerCase(),
          grams: Math.round(parseFloat(ing.grams) || 0),
        }));

      // ── Validation A: Remove disliked foods that slipped through ──
      const dislikedList = (
        userProfile.dietary_restrictions || userProfile.dietaryRestrictions || ''
      ).toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

      const dislikesRaw = foodPreferences?.dislikes || '';
      const dislikedFoods = dislikesRaw.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      const allBanned = [...dislikedList, ...dislikedFoods];

      const cleanedIngredients = ingredients.filter((ing) => {
        const nameLower = ing.name.toLowerCase();
        const isBanned = allBanned.some((banned) =>
          nameLower.includes(banned) || banned.includes(nameLower)
        );
        if (isBanned) {
          console.warn(`⚠️ Removed disliked ingredient: "${ing.name}" from ${mealType}`);
        }
        return !isBanned;
      });

      // ── Validation B: Fix common type misclassifications ──
      const TYPE_CORRECTIONS = {
        // Sauces labeled as "fat" that are really carb/negligible
        'teriyaki sauce': 'carb',
        'soy sauce': 'carb',
        'hoisin sauce': 'carb',
        'bbq sauce': 'carb',
        'ketchup': 'carb',
        'honey': 'carb',
        'maple syrup': 'carb',
        'sugar': 'carb',
        'sriracha': 'carb',
        'hot sauce': 'carb',
        'salsa': 'vegetable',
        // Foods sometimes mistyped
        'avocado': 'fat',
        'cheese': 'protein',
        'mozzarella': 'protein',
        'hummus': 'protein',
        'beans': 'protein',
        'black beans': 'protein',
        'chia seeds': 'fat',
      };

      for (const ing of cleanedIngredients) {
        const key = ing.name.toLowerCase();
        for (const [pattern, correctType] of Object.entries(TYPE_CORRECTIONS)) {
          if (key.includes(pattern) && ing.type !== correctType) {
            console.log(`🔧 Type fix: "${ing.name}" ${ing.type} → ${correctType}`);
            ing.type = correctType;
            break;
          }
        }
      }

      if (cleanedIngredients.length === 0) {
        const fallback = mealData.meal_name || `Generated ${mealType}`;
        generatedMeals.push({ mealType: outKey, meal: fallback });
        send('meal', { mealType: outKey, meal: fallback, day });
        continue;
      }

      const budget = budgetsToGenerate[mealType];
      const result = estimateAndAdjust(cleanedIngredients, budget);
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

      generatedMeals.push({ mealType: outKey, meal: mealString });
      send('meal', { mealType: outKey, meal: mealString, day });
    }

    // ── Step 7: Optionally save to DB ──
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

    // ── Step 8: Done ──
    send('done', {
      success: true,
      day,
      meals: generatedMeals,
      dailyTotals,
      dailyTargets: nutrition.dailyMacros,
    });
  } catch (err) {
    console.error('generate-day error:', err);
    send('error', { message: err.message });
  } finally {
    res.end();
  }
}