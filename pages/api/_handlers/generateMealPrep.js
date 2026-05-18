/**
 * Shared handler: suggest 4 meal-prep options for a meal type across specified days.
 */

import { computeNutritionTargets } from '../../../shared/lib/tdeeCalc.js';
import { estimateAndAdjust } from '../../../shared/lib/macroEstimator.js';
import { validateIngredients } from '../../../shared/lib/validateIngredients.js';
import { completeJSON, isHighDemandError, OPENAI_MEAL_MODEL } from '../lib/aiCompletion.js';
import { parseAIJson } from '../lib/parseAIJson.js';

const toInternalKey = (k) => (k === 'snacks' ? 'snack' : k);

const AI_CONFIG = {
  gemini: { geminiModel: 'gemini-2.5-flash', temperature: 0.8, maxTokens: 50000 },
  openai: { openaiModel: OPENAI_MEAL_MODEL, temperature: 0.8, maxTokens: 3000 },
};

function buildMealPrepPrompt(rawMealType, avgBudget, numServings, dietaryRestrictions, likes, cuisines, dislikes) {
  return `You are a sports nutritionist creating meal prep options for an athlete.

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
}

export function createGenerateMealPrepHandler(provider) {
  return async function handler(req, res) {
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

      const budgets = [];
      for (const day of days) {
        const dayWorkouts = trainingPlan?.[day]?.workouts || [];
        const dayTiming = trainingPlan?.[day]?.timing || null;
        const timingMap = { Morning: 'am', Afternoon: 'pm', Evening: 'pm' };

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
      const likes = foodPreferences?.likes || '';
      const cuisines = foodPreferences?.cuisine_favorites || foodPreferences?.cuisines || '';

      const prompt = buildMealPrepPrompt(
        rawMealType,
        avgBudget,
        numServings,
        dietaryRestrictions,
        likes,
        cuisines,
        dislikes
      );

      console.log(`🥘 Generating ${rawMealType} meal prep (${provider}, ${numServings} servings)...`);

      const rawText = await completeJSON(provider, { prompt, ...AI_CONFIG[provider] });

      let data;
      try {
        data = parseAIJson(rawText);
      } catch (parseError) {
        console.error(`Failed to parse ${provider} response. Raw text:`, rawText);
        throw parseError;
      }

      const rawOptions = data.options || [];

      const options = rawOptions.map((opt) => {
        let ingredients = (opt.ingredients || [])
          .filter((ing) => ing.name && ing.type && ing.grams > 0)
          .map((ing) => ({
            name: String(ing.name).trim(),
            type: String(ing.type).trim().toLowerCase(),
            grams: Math.round(parseFloat(ing.grams) || 0),
          }));

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

      console.log(`✅ Generated ${options.length} meal prep options (${provider})`);

      res.status(200).json({
        success: true,
        options,
        mealType: rawMealType,
        days,
        perServingBudget: avgBudget,
        provider,
      });
    } catch (error) {
      console.error(`generate-meal-prep (${provider}) error:`, error);
      if (isHighDemandError(error.message)) {
        return res.status(503).json({
          error: 'Our AI is experiencing high demand right now. Please try again in a moment.',
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
