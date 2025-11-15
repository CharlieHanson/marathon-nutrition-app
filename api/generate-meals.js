// api/generate-meals.js
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getPersonalizedPreferences } from '../src/lib/rag.js'; // <-- shared RAG helper

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';

// Get Monday of current week (unused by default but kept)
function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// ---- ML Macros helpers ----
async function getMacrosFromML(mealDescription, mealType) {
  try {
    const endpointMap = {
      breakfast: '/predict-breakfast',
      lunch: '/predict-lunch',
      dinner: '/predict-dinner',
      snacks: '/predict-snacks',
      dessert: '/predict-desserts',
    };

    const endpoint = endpointMap[mealType];
    if (!endpoint) return null;

    const mlResponse = await fetch(`${ML_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: mealDescription }),
    });

    const mlData = await mlResponse.json();
    if (mlData?.success) {
      return mlData.predictions;
    }
  } catch (_e) {
    // swallow ML errors; fall back to original text
  }
  return null;
}

async function addMacrosToMeals(meals) {
  const mealsWithMacros = { ...meals };

  for (const [day, dayMeals] of Object.entries(meals)) {
    for (const [mealType, mealDescription] of Object.entries(dayMeals)) {
      if (!mealDescription || typeof mealDescription !== 'string') continue;

      try {
        const macros = await getMacrosFromML(mealDescription, mealType);
        if (macros) {
          mealsWithMacros[day][mealType] =
            `${mealDescription} (Cal: ${Math.round(macros.calories)}, ` +
            `P: ${Math.round(macros.protein)}g, ` +
            `C: ${Math.round(macros.carbs)}g, ` +
            `F: ${Math.round(macros.fat)}g)`;
        } else {
          mealsWithMacros[day][mealType] = mealDescription;
        }
      } catch (_e) {
        mealsWithMacros[day][mealType] = mealDescription;
      }
    }
  }

  return mealsWithMacros;
}

// ---- API route ----
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, trainingPlan, userId, weekStarting } = req.body;

    const likedFoods = foodPreferences?.likes || 'No preferences specified';
    const dislikedFoods = foodPreferences?.dislikes || 'No dislikes specified';
    const cuisines = foodPreferences?.cuisines || 'No cuisines specified';

    const trainingSchedule = Object.entries(trainingPlan || {})
      .map(
        ([day, workout]) =>
          `${day}: ${workout.type} ${workout.distance} (${workout.intensity} intensity)`
      )
      .filter((s) => !s.includes('undefined') && !s.includes(' (intensity)'))
      .join('\n');

    // ---- RAG personalization (no HTTP call; direct function) ----
    let personalizedContext = '';
    if (userId) {
      try {
        console.log('🧠 Fetching personalized preferences using RAG (lib)...');

        const prefs = await getPersonalizedPreferences({ userId, limit: 5 });

        if (prefs?.length > 0) {
          console.log(`✅ Found ${prefs.length} highly-rated meals`);
          const topMeals = prefs
            .slice(0, 5)
            .map((m) => `- ${m.meal_description} (${m.meal_type}, ${m.rating} stars)`)
            .join('\n');

          personalizedContext = `

PERSONALIZED PREFERENCES (from past ratings):
The user has highly rated these meals in the past:
${topMeals}

Generate meals SIMILAR in style and ingredients to these highly-rated options, but with variety.`;
        }
      } catch (error) {
        console.error('Error fetching preferences (lib):', error);
        // continue without personalization
      }
    }

    // ---- Prompt ----
    const prompt = `You are a sports nutritionist creating a weekly meal plan for an athlete.

USER PROFILE:
- Height: ${userProfile?.height || 'Not specified'}
- Weight: ${userProfile?.weight || 'Not specified'}
- Goal: ${userProfile?.goal || 'maintain weight'}
- Objective: ${userProfile?.objective || 'Not specified'}
- Activity Level: ${userProfile?.activityLevel || 'moderate'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}
${personalizedContext}

FOOD PREFERENCES:
- Likes: ${likedFoods}
- Dislikes: ${dislikedFoods}
- Favorite Cuisines: ${cuisines}

TRAINING SCHEDULE:
${trainingSchedule || 'No training plan specified'}

Create a diverse weekly meal plan with breakfast, lunch, dinner, dessert (be creative with real desserts like cookies, brownies, fruit tarts, ice cream - not just yogurt variations), and snacks (~75% single items like "Banana" or "Almonds", ~25% combos like "Apple with peanut butter") for each day.

CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:
1. ABSOLUTE RULES (must follow):
   - NEVER include ANY of these disliked foods: ${dislikedFoods}
   - RESPECT all dietary restrictions: ${userProfile?.dietaryRestrictions || 'None'}
   - Tailor nutrition to support each day's training intensity
   - Support weight goal: ${userProfile?.goal || 'maintain'}

2. VARIETY REQUIREMENTS (prevent repetition):
   - Each liked food should appear MAXIMUM 3-4 times across the ENTIRE week
   - No ingredient should appear in consecutive meals
   - Provide diverse meal options across different cuisines
   - Use liked foods thoughtfully, not in every meal

3. LIKED FOODS GUIDANCE:
   - Liked foods (${likedFoods}) should be used MORE OFTEN than neutral foods
   - But NOT in every single meal - variety is important
   - Incorporate them naturally where they fit the meal type
   - Don't force them into inappropriate meals (e.g., no avocado in desserts)

Format each meal as JUST THE DESCRIPTION:
"Meal name with main ingredients"

Example: "Scrambled eggs with spinach and avocado"
Example: "Grilled chicken with quinoa and roasted vegetables"

Respond with ONLY a JSON object in this exact format:
{
  "monday": {
    "breakfast": "meal description",
    "lunch": "meal description",
    "dinner": "meal description",
    "dessert": "meal description",
    "snacks": "snack description"
  },
  "tuesday": { ... },
  ... (all 7 days)
}

DO NOT include anything other than the JSON object in your response.`;

    console.log('🤖 Generating meal descriptions with GPT...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = response.choices?.[0]?.message?.content ?? '{}';

    let mealDescriptions;
    try {
      mealDescriptions = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse GPT JSON:', aiResponse);
      throw new Error('Model returned invalid JSON');
    }

    // Add ML macros per meal
    const mealsWithMacros = await addMacrosToMeals(mealDescriptions);

    // ---- Save weekly plan (if userId provided) ----
    let savedMealPlanId = null;

    if (userId) {
      console.log('💾 Attempting to save meal plan for user:', userId);
      try {
        console.log('📅 Week starting:', weekStarting);

        const { data: existing } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('week_starting', weekStarting)
          .maybeSingle();

        console.log('🔍 Existing record:', existing);

        let result;
        if (existing) {
          console.log('🔄 Updating existing record...');
          result = await supabase
            .from('meal_plans')
            .update({
              meals: mealsWithMacros,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select();
        } else {
          console.log('➕ Inserting new record...');
          result = await supabase
            .from('meal_plans')
            .insert({
              user_id: userId,
              meals: mealsWithMacros,
              week_starting: weekStarting,
            })
            .select();
        }

        console.log('💾 Save result:', result);

        if (!result.error && result.data?.length > 0) {
          savedMealPlanId = result.data[0].id;
          console.log('✅ Meal plan saved with ID:', savedMealPlanId);
        } else if (result.error) {
          console.log('❌ Save failed:', result.error);
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Do not fail the whole request if the save fails
      }
    } else {
      console.log('⚠️ No userId provided, skipping database save');
    }

    return res.status(200).json({
      success: true,
      meals: mealsWithMacros,
      mealPlanId: savedMealPlanId,
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
