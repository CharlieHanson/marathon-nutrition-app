/**
 * regenerate-meal.js
 * pages/api/regenerate-meal.js
 *
 * Regenerates a single meal based on user feedback.
 * PIPELINE: TDEE budget → OpenAI (structured) → validate → density → scaler
 *
 * BACKWARD COMPATIBLE: Returns { success, meal: "Name (Cal: X, P: Xg, C: Xg, F: Xg)" }
 */

// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { GoogleGenerativeAI } from '@google/generative-ai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { buildSingleMealPrompt, formatTrainingDay } from '../../shared/lib/mealPromptBuilder.js';
import { validateIngredients } from '../../shared/lib/validateIngredients.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function parseJSON(text) {
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

function toMealString(mealName, macros) {
  if (!macros) return mealName;
  return `${mealName} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userProfile,
      foodPreferences,
      trainingPlan,
      day,
      mealType,
      reason,
      currentMeal,
    } = req.body;

    if (!userProfile || !mealType || !day) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const dislikes = foodPreferences?.dislikes || '';
    const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

    // ── Step 1: Compute this meal's macro budget ─────────────────────────
    const dayWorkouts = trainingPlan?.[day]?.workouts || [];
    const dayTiming = trainingPlan?.[day]?.timing || null;
    const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

    const nutrition = computeNutritionTargets({
      userProfile,
      todayWorkouts: dayWorkouts,
      workoutTiming: timingMap[dayTiming] || null,
    });

    const budgetKey = mealType === 'snacks' ? 'snack' : mealType;
    const budget = nutrition.mealBudgets[budgetKey];

    if (!budget) {
      return res.status(400).json({ success: false, error: `No budget for meal type: ${mealType}` });
    }

    // ── Step 2: Build prompt with feedback context ───────────────────────
    const currentMealDesc = (currentMeal || '').replace(/\(Cal:.*?\).*$/, '').trim();

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(day);
    const tomorrowDay = days[(dayIndex + 1) % 7];

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

    // ── Step 3: Call Gemini ──────────────────────────────────────────────
    console.log(`🔄 Regenerating ${mealType} for ${day}: "${reason}"`);

    // ── OpenAI (commented out) ──
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4o-mini',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 800,
    //   temperature: 0.7,
    //   response_format: { type: 'json_object' },
    // });
    // const mealData = parseJSON(response.choices[0].message.content);

    // ── Gemini ──
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 5000,
      },
    });
    
    let aiResult;
    try {
      aiResult = await geminiModel.generateContent(prompt);
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      throw new Error(`Gemini API failed: ${geminiError.message}`);
    }
    
    const rawText = aiResult.response.text();
    
    let mealData;
    try {
      mealData = parseJSON(rawText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response. Raw text:', rawText);
      console.error('Parse error:', parseError);
      throw parseError;
    }

    // ── Step 4: Validate + Density + Scaler ─────────────────────────────
    let ingredients = (mealData.ingredients || [])
      .filter((ing) => ing.name && ing.type && ing.grams > 0)
      .map((ing) => ({
        name: String(ing.name).trim(),
        type: String(ing.type).trim().toLowerCase(),
        grams: Math.round(parseFloat(ing.grams) || 0),
      }));

    // Remove disliked foods + fix type misclassifications
    ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

    if (ingredients.length === 0) {
      return res.status(200).json({
        success: true,
        meal: mealData.meal_name || 'Generated meal',
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
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}