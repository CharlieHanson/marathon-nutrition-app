// pages/api/generate-single-meal.js
// Generates a single meal for an empty slot

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTopMealsByVector } from '../../src/lib/rag.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ML_API_URL = 'https://alimenta-ml-service.onrender.com';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

/* ---------------------------- Macro utils (ML) ----------------------------- */
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

    const resp = await fetch(`${ML_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: mealDescription }),
    });
    const data = await resp.json();
    if (data?.success) return data.predictions;
  } catch (err) {
    console.error('ML macro prediction error:', err);
  }
  return null;
}

function attachMacrosText(desc, macros) {
  if (!macros) return desc;
  const c = (n) => Math.round(Number(n) || 0);
  return `${desc} (Cal: ${c(macros.calories)}, P: ${c(macros.protein)}g, C: ${c(macros.carbs)}g, F: ${c(macros.fat)}g)`;
}

/* ---------------------- Training plan helpers ---------------------- */
function summarizePlanData(planData) {
  if (!planData || typeof planData !== 'object') return null;

  const summary = {};
  for (const day of DAYS) {
    const dayObj = planData[day] || {};
    const workouts = Array.isArray(dayObj.workouts) ? dayObj.workouts : [];

    if (!workouts.length) {
      summary[day] = { type: 'Rest', distance: '', intensity: 5 };
      continue;
    }

    const nonRest = workouts.filter(
      (w) => (w.type || '').toLowerCase() !== 'rest'
    );
    const chosen = nonRest[0] || workouts[0];

    const intensities = workouts
      .map((w) => Number(w.intensity) || 0)
      .filter((n) => n > 0);
    const intensity = intensities.length
      ? Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length)
      : 5;

    summary[day] = {
      type: chosen.type || 'Rest',
      distance: chosen.distance || '',
      intensity,
    };
  }

  return summary;
}

/* ---------------------- RAG Personalization ---------------------- */
async function getPersonalizationContext({
  userId,
  mealType,
  foodPreferences,
  userProfile,
  trainingPlan,
  day,
}) {
  const likes = foodPreferences?.likes;
  const dislikes = foodPreferences?.dislikes;
  const cuisines = foodPreferences?.cuisines;
  const goal = userProfile?.goal;

  const w = trainingPlan?.[day] || {};
  const intensityText = `${w.type || 'easy'} ${w.distance || ''} ${
    w.intensity != null ? `(intensity ${w.intensity})` : ''
  }`.trim();

  const recs = userId
    ? await getTopMealsByVector({
        userId,
        mealType,
        likes,
        dislikes,
        cuisines,
        goal,
        intensityText,
        k: 3,
        candidateLimit: 40,
        efSearch: 64,
      })
    : [];

  if (!recs?.length) return '';
  const bullets = recs.map((r) => `- ${r.meal_description} (${r.rating}★)`).join('\n');
  return `PAST FAVORITES (${mealType}):\n${bullets}\nGenerate a NEW ${mealType} inspired by these (not identical).`;
}

/* ---------------------- Existing meals context ---------------------- */
function getExistingMealsContext(existingMeals, day, mealType) {
  const lines = [];

  // Same day meals
  const dayMeals = existingMeals?.[day] || {};
  const sameDayMeals = Object.entries(dayMeals)
    .filter(([mt, meal]) => mt !== mealType && meal && typeof meal === 'string' && meal.trim())
    .map(([mt, meal]) => {
      const cleanMeal = meal.replace(/\s*\(Cal:[^)]+\)\s*$/i, '').trim();
      return `- ${mt}: ${cleanMeal}`;
    });

  if (sameDayMeals.length > 0) {
    lines.push(`OTHER MEALS TODAY (${day}):`);
    lines.push(...sameDayMeals);
  }

  // Recent days for variety
  const dayIndex = DAYS.indexOf(day);
  const recentDays = DAYS.slice(Math.max(0, dayIndex - 2), dayIndex);
  
  const recentMealsOfType = recentDays
    .map((d) => {
      const meal = existingMeals?.[d]?.[mealType];
      if (meal && typeof meal === 'string' && meal.trim()) {
        const cleanMeal = meal.replace(/\s*\(Cal:[^)]+\)\s*$/i, '').trim();
        return `- ${d}: ${cleanMeal}`;
      }
      return null;
    })
    .filter(Boolean);

  if (recentMealsOfType.length > 0) {
    lines.push(`\nRECENT ${mealType.toUpperCase()} MEALS (avoid repeating):`);
    lines.push(...recentMealsOfType);
  }

  return lines.join('\n');
}

/* ---------------------- Build prompt ---------------------- */
async function buildPrompt({
  day,
  mealType,
  userProfile,
  foodPreferences,
  trainingPlan,
  existingMeals,
  userId,
}) {
  const likedFoods = foodPreferences?.likes || 'No preferences specified';
  const dislikedFoods = foodPreferences?.dislikes || 'No dislikes specified';
  const cuisines = foodPreferences?.cuisines || 'No cuisines specified';

  const w = trainingPlan?.[day] || {};
  const dayTraining = `${w.type || 'easy'} ${w.distance || ''} ${
    w.intensity != null ? `(intensity ${w.intensity})` : ''
  }`.trim();

  const personalization = await getPersonalizationContext({
    userId,
    mealType,
    foodPreferences,
    userProfile,
    trainingPlan,
    day,
  });

  const existingContext = getExistingMealsContext(existingMeals, day, mealType);

  return `You are a sports nutritionist creating a single ${mealType} for ${day}.

USER PROFILE:
- Height: ${userProfile?.height || 'Not specified'}
- Weight: ${userProfile?.weight || 'Not specified'}
- Goal: ${userProfile?.goal || 'maintain weight'}
- Objective: ${userProfile?.objective || 'Not specified'}
- Activity Level: ${userProfile?.activityLevel || 'moderate'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${likedFoods}
- Dislikes: ${dislikedFoods}
- Favorite Cuisines: ${cuisines}

TRAINING (${day}):
- ${dayTraining || 'Rest / easy day'}

${existingContext || ''}

${personalization || ''}

REQUIREMENTS:
1) Generate ONE ${mealType} meal that fits the user's profile and preferences.
2) Avoid all foods not suitable for dietary restrictions.
3) Strictly avoid disliked foods.
4) Complement other meals already planned for today.
5) Avoid repeating recent ${mealType} meals from this week.
6) Return ONLY a concise meal description (no macros, no extra text).

Return ONLY the meal description as a single line of text, nothing else.`;
}

/* --------------------------------- Handler -------------------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      day,
      mealType,
      userProfile,
      foodPreferences,
      trainingPlan: clientTrainingPlan,
      weekStarting,
      existingMeals,
    } = req.body || {};

    // Validate required fields
    if (!day || !DAYS.includes(day)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing day' });
    }
    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing mealType' });
    }

    // Get training plan from DB if available
    let trainingPlan = null;

    if (userId) {
      const { data: activePlan, error } = await supabase
        .from('training_plans')
        .select('plan_data')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && activePlan?.plan_data) {
        trainingPlan = summarizePlanData(activePlan.plan_data);
      }
    }

    // Fallback to client-sent plan
    if (!trainingPlan && clientTrainingPlan) {
      trainingPlan = summarizePlanData(clientTrainingPlan) || null;
    }

    // Build prompt
    const prompt = await buildPrompt({
      day,
      mealType,
      userProfile,
      foodPreferences,
      trainingPlan,
      existingMeals,
      userId,
    });

    // Generate meal with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    let mealDescription = completion.choices?.[0]?.message?.content?.trim() || '';

    if (!mealDescription) {
      return res.status(500).json({ success: false, error: 'Failed to generate meal' });
    }

    // Clean up any extra formatting
    mealDescription = mealDescription
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/^[-•]\s*/, '') // Remove bullet points
      .trim();

    // Attach macros via ML service
    const macros = await getMacrosFromML(mealDescription, mealType);
    const mealWithMacros = attachMacrosText(mealDescription, macros);

    // Save to database if user is logged in
    if (userId && weekStarting) {
      try {
        const { data: existing } = await supabase
          .from('meal_plans')
          .select('id, meals')
          .eq('user_id', userId)
          .eq('week_starting', weekStarting)
          .maybeSingle();

        if (existing) {
          const updatedMeals = {
            ...existing.meals,
            [day]: {
              ...(existing.meals?.[day] || {}),
              [mealType]: mealWithMacros,
            },
          };

          await supabase
            .from('meal_plans')
            .update({ meals: updatedMeals, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          const newMeals = {
            [day]: { [mealType]: mealWithMacros },
          };

          await supabase
            .from('meal_plans')
            .insert({
              user_id: userId,
              meals: newMeals,
              week_starting: weekStarting,
            });
        }
      } catch (dbError) {
        console.error('Error saving meal to database:', dbError);
        // Don't fail the request, just log
      }
    }

    return res.status(200).json({
      success: true,
      meal: mealWithMacros,
      day,
      mealType,
    });
  } catch (error) {
    console.error('generate-single-meal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}