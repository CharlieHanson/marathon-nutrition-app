// pages/api/generate-single-meal.js
// Generates a single meal for an empty slot with optional user suggestions
// Uses helper functions for variety/rotation

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTopMealsByVector } from '../../src/lib/rag.js';
import {
  getBreakfastSuggestion,
  getLunchSuggestion,
  getDinnerSuggestion,
  getSnackSuggestion,
  getDessertSuggestion,
  getTrainingContext,
  DAYS,
} from '../../src/lib/mealSuggestions.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ML_API_URL = 'https://alimenta-ml-service.onrender.com';
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

/* ---------------------- RAG Personalization ---------------------- */
async function getPersonalizationContext({ userId, mealType, foodPreferences, userProfile, training }) {
  const likes = foodPreferences?.likes;
  const dislikes = foodPreferences?.dislikes;
  const cuisines = foodPreferences?.cuisines;
  const goal = userProfile?.goal;

  const intensityText = training?.today 
    ? `${training.today.type || 'rest'} ${training.today.distance || ''}`
    : '';

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
      })
    : [];

  if (!recs?.length) return '';
  const bullets = recs.map((r) => `- ${r.meal_description} (${r.rating}★)`).join('\n');
  return `PAST FAVORITES:\n${bullets}\nUse as inspiration, but create something NEW.`;
}

/* ---------------------- Get existing meals for the week ---------------------- */
async function getExistingMeals(userId, weekStarting) {
  if (!userId || !weekStarting) return {};

  try {
    const { data } = await supabase
      .from('meal_plans')
      .select('meals')
      .eq('user_id', userId)
      .eq('week_starting', weekStarting)
      .maybeSingle();

    return data?.meals || {};
  } catch (error) {
    console.error('Error fetching existing meals:', error);
    return {};
  }
}

/* ---------------------- Build prompt with suggestions ---------------------- */
function buildPromptWithSuggestion({
  mealType,
  userProfile,
  foodPreferences,
  suggestion,
  training,
  ragContext,
  userPrompt,
}) {
  const baseContext = `USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}
- Favorite Cuisines: ${foodPreferences?.cuisines || 'Any'}

TODAY'S TRAINING: ${training?.today?.type || 'Rest'} ${training?.today?.distance || ''} (${training?.today?.intensity || 'medium'} intensity)`;

  const userRequest = userPrompt 
    ? `\nUSER'S SPECIFIC REQUEST: "${userPrompt}"\nPrioritize this request while still meeting nutritional needs.`
    : '';

  let mealSpecificInstructions;

  switch (mealType) {
    case 'breakfast':
      mealSpecificInstructions = `Create a ${suggestion?.type || 'balanced'}-style breakfast.
${suggestion?.avoid?.length ? `AVOID these types (already had): ${suggestion.avoid.join(', ')}` : ''}`;
      break;

    case 'lunch':
      mealSpecificInstructions = `Create a ${suggestion?.type || 'balanced'} for lunch.
${suggestion?.protein ? `Use ${suggestion.protein} as the protein.` : ''}
${suggestion?.avoid?.length ? `AVOID these formats: ${suggestion.avoid.join(', ')}` : ''}
${suggestion?.avoidProteins?.length ? `AVOID these proteins: ${suggestion.avoidProteins.join(', ')}` : ''}`;
      break;

    case 'dinner':
      const tomorrowIntense = training?.tomorrow?.intensity?.toLowerCase() === 'high';
      mealSpecificInstructions = `Create a dinner with ${suggestion?.protein || 'quality protein'} as the main protein - THIS IS REQUIRED.
${suggestion?.avoid?.length ? `DO NOT use these proteins: ${suggestion.avoid.join(', ')}` : ''}
${tomorrowIntense ? 'Tomorrow has intense training - include good carbs.' : ''}`;
      break;

    case 'snacks':
      mealSpecificInstructions = `Create a ${suggestion?.type || 'healthy'}-based snack.
${suggestion?.avoid?.length ? `AVOID these types: ${suggestion.avoid.join(', ')}` : ''}
Keep it simple and portable.`;
      break;

    case 'dessert':
      mealSpecificInstructions = `Create a ${suggestion?.category || 'balanced'} dessert - THIS CATEGORY IS REQUIRED.
${suggestion?.avoid?.length ? `AVOID these categories: ${suggestion.avoid.join(', ')}` : ''}
Categories: baked (cookies, cakes), frozen (ice cream), chocolate, fruit-based, pastry/cream (mousse, custard)`;
      break;

    default:
      mealSpecificInstructions = 'Create a balanced meal.';
  }

  return `You are a sports nutritionist creating a single ${mealType}.

${baseContext}
${userRequest}

REQUIREMENTS:
${mealSpecificInstructions}
- Respect dietary restrictions and dislikes
- Keep portions appropriate for an athlete

${ragContext || ''}

Return ONLY a concise meal description (1-2 sentences), no macros or extra text.`;
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
      weekStarting,
      userPrompt, // NEW: optional user suggestion/preference
    } = req.body || {};

    // Validate required fields
    if (!day || !DAYS.includes(day)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing day' });
    }
    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing mealType' });
    }

    // Get existing meals for variety checking
    const existingMeals = await getExistingMeals(userId, weekStarting);

    // Get training context
    const training = await getTrainingContext(userId, day);

    // Get meal-specific suggestion
    const suggestionFunctions = {
      breakfast: getBreakfastSuggestion,
      lunch: getLunchSuggestion,
      dinner: getDinnerSuggestion,
      snacks: getSnackSuggestion,
      dessert: getDessertSuggestion,
    };

    const suggestion = suggestionFunctions[mealType](day, existingMeals, foodPreferences);

    // Get RAG personalization
    const ragContext = await getPersonalizationContext({
      userId,
      mealType,
      foodPreferences,
      userProfile,
      training,
    });

    // Build prompt
    const prompt = buildPromptWithSuggestion({
      mealType,
      userProfile,
      foodPreferences,
      suggestion,
      training,
      ragContext,
      userPrompt,
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
      .replace(/^["']|["']$/g, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-•]\s*/, '')
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