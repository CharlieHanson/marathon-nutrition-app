/**
 * generate-meal-prep.js
 * pages/api/generate-meal-prep.js
 *
 * Suggests 4 meal-prep options for a given meal type across specified days.
 * Averages the TDEE-based budget across those days, then asks OpenAI for
 * batch-friendly recipes that hit the per-serving targets.
 *
 * PIPELINE: avg TDEE budget → OpenAI (4 options) → validate → density per option
 *
 * Body: { mealType, days, userProfile, foodPreferences, trainingPlan }
 *   mealType: "breakfast" | "lunch" | "dinner"
 *   days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *
 * Returns: { success, options: [...], mealType, days }
 */

// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { GoogleGenerativeAI } from '@google/generative-ai';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../shared/lib/macroEstimator.js';
import { validateIngredients } from '../../shared/lib/validateIngredients.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const toInternalKey = (k) => (k === 'snacks' ? 'snack' : k);

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      mealType: rawMealType,
      days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      userProfile,
      foodPreferences,
      trainingPlan,
    } = req.body;

    if (!userProfile || !rawMealType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const mealType = toInternalKey(rawMealType);
    const dislikes = foodPreferences?.dislikes || '';
    const dietaryRestrictions = userProfile.dietary_restrictions || userProfile.dietaryRestrictions || '';

    // ── Step 1: Average the macro budget across specified days ──
    const budgets = [];
    for (const day of days) {
      const dayWorkouts = trainingPlan?.[day]?.workouts || [];
      const dayTiming = trainingPlan?.[day]?.timing || null;
      const timingMap = { 'Morning': 'am', 'Afternoon': 'pm', 'Evening': 'pm' };

      const nutrition = computeNutritionTargets({
        userProfile,
        todayWorkouts: dayWorkouts,
        workoutTiming: timingMap[dayTiming] || null,
      });

      const b = nutrition.mealBudgets[mealType];
      if (b) budgets.push(b);
    }

    if (budgets.length === 0) {
      return res.status(400).json({ success: false, error: `No budget for meal type: ${rawMealType}` });
    }

    const avgBudget = {
      calories: Math.round(budgets.reduce((s, b) => s + b.calories, 0) / budgets.length),
      protein: Math.round(budgets.reduce((s, b) => s + b.protein, 0) / budgets.length),
      carbs: Math.round(budgets.reduce((s, b) => s + b.carbs, 0) / budgets.length),
      fat: Math.round(budgets.reduce((s, b) => s + b.fat, 0) / budgets.length),
    };

    const numServings = days.length;

    // ── Step 2: Build prompt ──
    const likes = foodPreferences?.likes || '';
    const cuisines = foodPreferences?.cuisine_favorites || foodPreferences?.cuisines || '';

    const prompt = `You are a sports nutritionist creating meal prep options for an athlete.

TASK: Create exactly 4 different ${rawMealType} meal prep recipes, each making ${numServings} servings.

PER-SERVING MACRO TARGETS:
- Calories: ~${avgBudget.calories} kcal
- Protein: ~${avgBudget.protein}g
- Carbs: ~${avgBudget.carbs}g
- Fat: ~${avgBudget.fat}g

Density guide (to size portions):
- 1g protein food ≈ 0.25g protein, 0.10g fat
- 1g cooked carb food ≈ 0.23g carbs
- 1g vegetable ≈ 0.06g carbs
- 1g added fat (oil/butter) ≈ 1.0g fat

${dietaryRestrictions ? `DIETARY RESTRICTIONS (MUST follow): ${dietaryRestrictions}` : ''}
${likes ? `FOODS/CUISINES THE USER ENJOYS (rotate through these): ${likes}${cuisines ? ', ' + cuisines : ''}` : ''}
${dislikes ? `DISLIKED FOODS (NEVER use any of these): ${dislikes}` : ''}

RULES:
1. Recipes must be batch-cookable and reheat well
2. Return PER-SERVING ingredient amounts (cooked weights)
3. Each option should use a different protein source
4. Include a brief prep description and estimated prep time
5. Ingredient types must be: protein, carb, vegetable, or fat
6. NEVER include any disliked foods — double check each ingredient

Respond with ONLY valid JSON:
{
  "options": [
    {
      "meal_name": "...",
      "description": "Brief description of the dish",
      "prep_time": "30 mins",
      "prep_reason": "Why this is good for meal prep",
      "ingredients": [
        { "name": "...", "type": "protein|carb|vegetable|fat", "grams": 0 }
      ]
    }
  ]
}`;

    // ── Step 3: Call Gemini ──
    console.log(`🥘 Generating ${rawMealType} meal prep (${numServings} servings, ${avgBudget.calories} kcal/serving)...`);

    // ── OpenAI (commented out) ──
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4o-mini',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 3000,
    //   temperature: 0.8,
    //   response_format: { type: 'json_object' },
    // });
    // const data = parseJSON(response.choices[0].message.content);

    // ── Gemini ──
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 50000,
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
    
    // Debug: log the raw response if parsing fails
    let data;
    try {
      data = parseJSON(rawText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response. Raw text:', rawText);
      console.error('Parse error:', parseError);
      throw parseError;
    }

    const rawOptions = data.options || [];

    // ── Step 4: Validate + density for each option ──
    const options = rawOptions.map((opt) => {
      let ingredients = (opt.ingredients || [])
        .filter((ing) => ing.name && ing.type && ing.grams > 0)
        .map((ing) => ({
          name: String(ing.name).trim(),
          type: String(ing.type).trim().toLowerCase(),
          grams: Math.round(parseFloat(ing.grams) || 0),
        }));

      // Remove disliked foods + fix type misclassifications
      ingredients = validateIngredients(ingredients, dislikes, dietaryRestrictions);

      if (ingredients.length === 0) {
        return {
          name: opt.meal_name || 'Unknown',
          description: opt.description || '',
          prepReason: opt.prep_reason || '',
          prepTime: opt.prep_time || '',
          macros: null,
          fullDescription: `${opt.meal_name || 'Meal prep option'}`,
          ingredients: [],
        };
      }

      const result = estimateAndAdjust(ingredients, avgBudget);
      const macros = {
        calories: Math.round(result.macros.calories),
        protein: Math.round(result.macros.protein),
        carbs: Math.round(result.macros.carbs),
        fat: Math.round(result.macros.fat),
      };

      const mealName = opt.meal_name || 'Meal prep option';
      const fullDescription = `${mealName} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;

      return {
        name: mealName,
        description: opt.description || '',
        prepReason: opt.prep_reason || '',
        prepTime: opt.prep_time || '',
        macros,
        fullDescription,
        ingredients: result.ingredients,
        perServingBudget: avgBudget,
        totalForPrep: {
          servings: numServings,
          totalCalories: macros.calories * numServings,
          totalProtein: macros.protein * numServings,
          totalCarbs: macros.carbs * numServings,
          totalFat: macros.fat * numServings,
        },
        scaled: result.scaled,
      };
    });

    console.log(`✅ Generated ${options.length} meal prep options`);

    res.status(200).json({
      success: true,
      options,
      mealType: rawMealType,
      days,
      perServingBudget: avgBudget,
    });
  } catch (error) {
    console.error('generate-meal-prep error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}