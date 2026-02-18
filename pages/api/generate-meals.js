/**
 * generate-meals.js (Web — Full Week)
 * pages/api/generate-meals.js
 *
 * ARCHITECTURE:
 *   1. TDEE + meal budgets (deterministic)
 *   2. OpenAI generates meals with structured ingredients + grams
 *   3. Validate: remove disliked foods, fix type misclassifications
 *   4. Density lookup computes actual macros
 *   5. Algebraic scaler adjusts portions to close gaps
 *
 * BACKWARD COMPATIBLE: Returns the same response shape the frontend expects:
 *   { success: true, meals: { monday: { breakfast: "Meal name (Cal: X, P: Xg, C: Xg, F: Xg)", ... } } }
 */

// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { GoogleGenerativeAI } from '@google/generative-ai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildWeekPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../shared/lib/validateIngredients.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAIResponse(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();

  // Try direct parse first
  try { return JSON.parse(s); } catch (e) { /* continue */ }

  // Try extracting JSON object
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { /* continue */ }
  }

  // Handle truncated JSON — attempt to close open structures
  // This happens when the model hits maxOutputTokens mid-response
  let truncated = s;
  if (start !== -1) truncated = s.slice(start);

  // Count open brackets/braces to close them
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  for (const ch of truncated) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  // Remove trailing comma or partial value, then close structures
  truncated = truncated.replace(/,\s*$/, '');
  // Remove incomplete key-value pair at end (e.g. `"name": "chi`)
  truncated = truncated.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
  // Remove incomplete object at end of array (e.g. `{ "name": "chi`)
  truncated = truncated.replace(/,\s*\{[^}]*$/, '');

  for (let i = 0; i < openBrackets; i++) truncated += ']';
  for (let i = 0; i < openBraces; i++) truncated += '}';

  try { return JSON.parse(truncated); } catch (e) {
    console.error('parseJSON failed even after truncation repair. First 500 chars:', s.slice(0, 500));
    throw new Error('Failed to parse AI JSON');
  }
}

function processMeal(mealData, macroBudget, dislikes, dietaryRestrictions) {
  if (!mealData || !mealData.ingredients || !Array.isArray(mealData.ingredients)) {
    return null;
  }

  let ingredients = mealData.ingredients
    .filter((ing) => ing.name && ing.type && ing.grams > 0)
    .map((ing) => ({
      name: String(ing.name).trim(),
      type: String(ing.type).trim().toLowerCase(),
      grams: Math.round(parseFloat(ing.grams) || 0),
    }));

  // Validate: remove disliked foods + fix type misclassifications
  ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

  if (ingredients.length === 0) return null;

  const result = estimateAndAdjust(ingredients, macroBudget);

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

    const dislikes = foodPreferences?.dislikes || '';
    const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

    // ── Step 1: Compute per-day nutrition targets ────────────────────────
    console.log('📊 Computing weekly nutrition targets...');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekMealBudgets = {};
    const weekNutrition = {};

    for (const day of days) {
      const dayTraining = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;
      const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayTraining,
        workoutTiming: timingMap[dayTiming] || null,
      });

      weekNutrition[day] = nutrition;
      weekMealBudgets[day] = nutrition.mealBudgets;
    }

    const trainingSchedule = days
      .map((day) => {
        const workouts = trainingPlan?.[day]?.workouts || [];
        return `${day}: ${formatTrainingDay(workouts)}`;
      })
      .join('\n');

    // ── Step 2: Generate meals with Gemini ───────────────────────────────
    console.log('🤖 Generating structured meal plan with Gemini...');

    const prompt = buildWeekPrompt({
      weekMealBudgets,
      foodPreferences,
      dietaryRestrictions,
      trainingSchedule,
    });

    // ── OpenAI (commented out) ──
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4o-mini',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 8000,
    //   temperature: 0.7,
    //   response_format: { type: 'json_object' },
    // });
    // const aiText = response.choices[0].message.content;

    // ── Gemini ──
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    });
    
    let aiResult;
    try {
      aiResult = await geminiModel.generateContent(prompt);
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      throw new Error(`Gemini API failed: ${geminiError.message}`);
    }
    
    const aiText = aiResult.response.text();
    
    let weekMeals;
    try {
      weekMeals = parseAIResponse(aiText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response. Raw text:', aiText);
      console.error('Parse error:', parseError);
      throw parseError;
    }

    // ── Step 3: Process each meal ────────────────────────────────────────
    console.log('⚖️ Computing macros and adjusting portions...');

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
    const normalizeKey = (key) => (key === 'snacks' ? 'snack' : key);
    const outputKey = (mealType) => (mealType === 'snack' ? 'snacks' : mealType);

    const mealsOldFormat = {};
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
        const processed = processMeal(dayMeals[rawKey], budget, dislikes, dietaryRestrictions);
        const outKey = outputKey(mealType);

        if (processed) {
          mealsOldFormat[day][outKey] = toMealString(processed);
          mealsStructured[day][outKey] = processed;

          weekTotals[day].calories += processed.macros.calories;
          weekTotals[day].protein += processed.macros.protein;
          weekTotals[day].carbs += processed.macros.carbs;
          weekTotals[day].fat += processed.macros.fat;
        } else {
          const name = dayMeals[rawKey]?.meal_name || '';
          mealsOldFormat[day][outKey] = name;
          mealsStructured[day][outKey] = { meal_name: name, ingredients: [], macros: null };
        }
      }
    }

    // ── Step 4: Return response ──────────────────────────────────────────
    console.log('✅ Meal plan complete');

    for (const day of days) {
      const target = weekNutrition[day].dailyMacros;
      const actual = weekTotals[day];
      const calDrift = Math.abs(actual.calories - target.calories);
      const pctDrift = target.calories > 0 ? ((calDrift / target.calories) * 100).toFixed(1) : '0';
      console.log(`  ${day}: ${actual.calories} / ${target.calories} kcal (${pctDrift}% drift)`);
    }

    res.status(200).json({
      success: true,
      meals: mealsOldFormat,
      meals_v2: mealsStructured,
      dailyTotals: weekTotals,
      dailyTargets: Object.fromEntries(
        days.map((day) => [day, weekNutrition[day].dailyMacros])
      ),
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}