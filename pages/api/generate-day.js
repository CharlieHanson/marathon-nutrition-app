// pages/api/generate-day.js
// Generates all empty meals for a single day
// Uses helper functions for variety/rotation instead of relying on LLM memory

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTopMealsByVector } from '../../src/lib/rag.js';
import { 
  getDaySuggestions, 
  DAYS, 
} from '../../shared/lib/mealSuggestions.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

/* ------------------------------- SSE helpers ------------------------------- */
function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

function sendEvent(res, type, payload) {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sendStatus(res, message) {
  sendEvent(res, 'status', { message });
}

/* ---------------------- RAG Personalization ---------------------- */
async function getPersonalizationContext({ userId, mealType, foodPreferences, userProfile, training }) {
  const likes = foodPreferences?.likes;
  const dislikes = foodPreferences?.dislikes;
  const cuisines = foodPreferences?.cuisines;
  const goal = userProfile?.goal;

  const intensityText = training?.today 
    ? `${training.today.type || 'rest'} ${training.today.distance || ''} (${training.today.intensity || 'medium'})`
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
  return `PAST FAVORITES:\n${bullets}\nUse these as inspiration for style/flavors the user enjoys, but create something NEW.`;
}

/* ---------------------- Prompt builders for each meal type ---------------------- */

function buildBreakfastPrompt({ userProfile, foodPreferences, suggestion, training, ragContext }) {
  const { type, avoid } = suggestion;
  
  return `You are a sports nutritionist creating a breakfast.

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}

TODAY'S TRAINING: ${training?.today?.type || 'Rest'} ${training?.today?.distance || ''} (${training?.today?.intensity || 'medium'} intensity)

REQUIREMENTS:
1) Create a ${type || 'balanced'}-style breakfast
2) ${avoid?.length ? `AVOID these types (already had this week): ${avoid.join(', ')}` : ''}
3) Respect dietary restrictions and dislikes
4) Keep it practical and quick to prepare

${ragContext || ''}

Return ONLY a concise meal description (1-2 sentences), no macros.`;
}

function buildLunchPrompt({ userProfile, foodPreferences, suggestion, training, ragContext }) {
  const { type, protein, avoid, avoidProteins } = suggestion;
  
  return `You are a sports nutritionist creating a lunch.

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}
- Favorite Cuisines: ${foodPreferences?.cuisines || 'Any'}

TODAY'S TRAINING: ${training?.today?.type || 'Rest'} ${training?.today?.distance || ''} (${training?.today?.intensity || 'medium'} intensity)

REQUIREMENTS:
1) Create a ${type || 'balanced'} for lunch
2) Use ${protein || 'a lean protein'} as the main protein
3) ${avoid?.length ? `AVOID these formats (already had this week): ${avoid.join(', ')}` : ''}
4) ${avoidProteins?.length ? `AVOID these proteins: ${avoidProteins.join(', ')}` : ''}
5) Respect dietary restrictions and dislikes

${ragContext || ''}

Return ONLY a concise meal description (1-2 sentences), no macros.`;
}

function buildDinnerPrompt({ userProfile, foodPreferences, suggestion, training, ragContext }) {
  const { protein, avoid } = suggestion;
  
  // Check if tomorrow's training is intense for carb-loading
  const tomorrowIntense = training?.tomorrow?.intensity?.toLowerCase() === 'high' ||
    training?.tomorrow?.type?.toLowerCase().includes('long') ||
    training?.tomorrow?.type?.toLowerCase().includes('distance');
  
  const carbNote = tomorrowIntense 
    ? 'Tomorrow has intense training - include good carbs for fuel.' 
    : '';
  
  return `You are a sports nutritionist creating a dinner.

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}
- Favorite Cuisines: ${foodPreferences?.cuisines || 'Any'}

TODAY'S TRAINING: ${training?.today?.type || 'Rest'} ${training?.today?.distance || ''} (${training?.today?.intensity || 'medium'} intensity)
TOMORROW'S TRAINING: ${training?.tomorrow?.type || 'Rest'} ${training?.tomorrow?.distance || ''}

REQUIREMENTS:
1) Use ${protein || 'a quality protein'} as the main protein - THIS IS REQUIRED
2) ${avoid?.length ? `DO NOT use these proteins (already used this week): ${avoid.join(', ')}` : ''}
3) ${carbNote}
4) Respect dietary restrictions and dislikes
5) Make it a satisfying, complete dinner

${ragContext || ''}

Return ONLY a concise meal description (1-2 sentences), no macros.`;
}

function buildSnacksPrompt({ userProfile, foodPreferences, suggestion, training, ragContext }) {
  const { type, avoid } = suggestion;
  
  return `You are a sports nutritionist creating a snack.

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}

TODAY'S TRAINING: ${training?.today?.type || 'Rest'} ${training?.today?.distance || ''}

REQUIREMENTS:
1) Create a ${type || 'healthy'}-based snack
2) ${avoid?.length ? `AVOID these types (already had this week): ${avoid.join(', ')}` : ''}
3) Keep it simple and portable
4) Good for an athlete's energy needs

${ragContext || ''}

Return ONLY a concise snack description (1 sentence), no macros.`;
}

function buildDessertPrompt({ userProfile, foodPreferences, suggestion, training, ragContext }) {
  const { category, avoid } = suggestion;
  
  return `You are a sports nutritionist creating a dessert.

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes'}

REQUIREMENTS:
1) Create a ${category} dessert - THIS CATEGORY IS REQUIRED
2) ${avoid?.length ? `AVOID these categories (already had this week): ${avoid.join(', ')}` : ''}
3) Keep portions reasonable for an athlete
4) Respect dietary restrictions

Category definitions:
- baked: brownies, cakes, cookies, tarts, crumbles
- frozen: ice cream, gelato, sorbet, frozen yogurt
- chocolate: chocolate-forward desserts
- fruit: fresh fruit-based desserts
- pastry/cream: custards, panna cotta, mousse, tiramisu

${ragContext || ''}

Return ONLY a concise dessert description (1 sentence), no macros.`;
}

/* ---------------------- Generate single meal ---------------------- */
async function generateMeal({ mealType, userProfile, foodPreferences, suggestion, training, userId }) {
  // Get RAG personalization
  const ragContext = await getPersonalizationContext({
    userId,
    mealType,
    foodPreferences,
    userProfile,
    training,
  });

  // Build prompt based on meal type
  const promptBuilders = {
    breakfast: buildBreakfastPrompt,
    lunch: buildLunchPrompt,
    dinner: buildDinnerPrompt,
    snacks: buildSnacksPrompt,
    dessert: buildDessertPrompt,
  };

  const prompt = promptBuilders[mealType]({
    userProfile,
    foodPreferences,
    suggestion,
    training,
    ragContext,
  });

  // Generate with OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
  });

  let mealDescription = completion.choices?.[0]?.message?.content?.trim() || '';

  // Clean up formatting
  mealDescription = mealDescription
    .replace(/^["']|["']$/g, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-•]\s*/, '')
    .trim();

  // Attach macros
  const macros = await getMacrosFromML(mealDescription, mealType);
  return attachMacrosText(mealDescription, macros);
}

/* ---------------------- Save to database ---------------------- */
async function saveDayMeals({ userId, weekStarting, day, meals }) {
  if (!userId || !weekStarting) return;

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
          ...meals,
        },
      };

      await supabase
        .from('meal_plans')
        .update({ meals: updatedMeals, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          meals: { [day]: meals },
          week_starting: weekStarting,
        });
    }
  } catch (error) {
    console.error('Error saving day meals:', error);
  }
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

/* --------------------------------- Handler -------------------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  sseHeaders(res);

  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  try {
    const { userId, day, userProfile, foodPreferences, weekStarting } = req.body || {};

    // Validate
    if (!day || !DAYS.includes(day)) {
      sendEvent(res, 'error', { message: 'Invalid or missing day' });
      clearInterval(keepAlive);
      res.end();
      return;
    }

    const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
    sendStatus(res, `Preparing ${capitalizedDay}'s meals...`);

    // Get existing meals for the week (for variety checking)
    const existingMeals = await getExistingMeals(userId, weekStarting);
    
    // Get existing meals for this day
    const existingDayMeals = existingMeals[day] || {};
    
    // Find empty meal slots
    const emptyMealTypes = MEAL_TYPES.filter(mt => {
      const meal = existingDayMeals[mt];
      return !meal || typeof meal !== 'string' || !meal.trim();
    });

    if (emptyMealTypes.length === 0) {
      sendEvent(res, 'done', { 
        success: true, 
        message: 'All meals already filled for this day',
        day,
      });
      clearInterval(keepAlive);
      res.end();
      return;
    }

    sendStatus(res, `Generating ${emptyMealTypes.length} meals for ${capitalizedDay}...`);

    // Get all suggestions for the day (includes training context)
    const suggestions = await getDaySuggestions(userId, day, existingMeals, foodPreferences);
    
    const generatedMeals = { ...existingDayMeals };

    // Generate each empty meal
    for (const mealType of emptyMealTypes) {
      const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
      sendStatus(res, `Creating ${mealLabel}...`);

      try {
        const meal = await generateMeal({
          mealType,
          userProfile,
          foodPreferences,
          suggestion: suggestions[mealType],
          training: suggestions.training,
          userId,
        });

        generatedMeals[mealType] = meal;

        // Send progress event
        sendEvent(res, 'meal', { 
          mealType, 
          meal,
          day,
        });
      } catch (error) {
        console.error(`Error generating ${mealType}:`, error);
        sendEvent(res, 'error', { 
          mealType, 
          message: `Failed to generate ${mealType}` 
        });
      }
    }

    // Save all generated meals to database
    if (userId && weekStarting) {
      await saveDayMeals({ userId, weekStarting, day, meals: generatedMeals });
    }

    sendEvent(res, 'done', { 
      success: true, 
      day,
      meals: generatedMeals,
    });

    clearInterval(keepAlive);
    res.end();

  } catch (error) {
    clearInterval(keepAlive);
    console.error('generate-day error:', error);
    sendEvent(res, 'error', { message: error.message });
    res.end();
  }
}