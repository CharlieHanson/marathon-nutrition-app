// api/generate-meals.js
// Streams day-by-day generation via Server-Sent Events (SSE)

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTopMealsByVector } from '../src/lib/rag.js'; // needs the vector helper we discussed

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEAL_TYPES = ['breakfast','lunch','dinner','snacks','dessert'];

/* ------------------------------- SSE helpers ------------------------------- */
function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // for some proxies
  res.flushHeaders?.();
}

function sendEvent(res, type, payload) {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sendStatus(res, message) {
  sendEvent(res, 'status', { message });
}

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
      body: JSON.stringify({ meal: mealDescription })
    });
    const data = await resp.json();
    if (data?.success) return data.predictions;
  } catch {}
  return null;
}

function attachMacrosText(desc, macros) {
  if (!macros) return desc;
  const c = (n) => Math.round(Number(n) || 0);
  return `${desc} (Cal: ${c(macros.calories)}, P: ${c(macros.protein)}g, C: ${c(macros.carbs)}g, F: ${c(macros.fat)}g)`;
}

function extractMacrosFromText(txt='') {
  const get = (re) => {
    const m = txt.match(re);
    return m ? Number(m[1]) : 0;
  };
  return {
    calories: get(/Cal:\s*(\d+)/i),
    protein:  get(/P:\s*(\d+)\s*g/i),
    carbs:    get(/C:\s*(\d+)\s*g/i),
    fat:      get(/F:\s*(\d+)\s*g/i),
  };
}

function sumDayMacros(dayMeals) {
  const sums = { calories:0, protein:0, carbs:0, fat:0, hasData:false };
  for (const mt of MEAL_TYPES) {
    const v = dayMeals[mt];
    if (!v || typeof v !== 'string') continue;
    const m = extractMacrosFromText(v);
    sums.calories += m.calories;
    sums.protein  += m.protein;
    sums.carbs    += m.carbs;
    sums.fat      += m.fat;
    sums.hasData = true;
  }
  return sums;
}

/* ---------------------- Light target & sanity thresholds ------------------- */
/** Very lightweight target heuristic.
 * If weight present, kcal target ≈ 30 * (kg) (+5% if "bulk", -10% if "cut")
 * Otherwise generic 2200 kcal. Tolerances are intentionally wide (±20%).
 */
function targetForDay(userProfile, trainingPlan, day) {
  const kg = userProfile?.weight ? Number(userProfile.weight) : null; // assume kg if you store kg; adjust if lbs
  let kcal = kg ? 30 * kg : 2200;

  const goal = String(userProfile?.goal || '').toLowerCase();
  if (goal.includes('bulk') || goal.includes('gain')) kcal *= 1.05;
  if (goal.includes('cut') || goal.includes('lose')) kcal *= 0.90;

  const intensity = trainingPlan?.[day]?.intensity ?? 5; // 1..10
  kcal *= (0.9 + (Number(intensity) || 5) * 0.02); // ±10% swing

  const min = Math.round(kcal * 0.8);
  const max = Math.round(kcal * 1.2);
  return { kcalTarget: Math.round(kcal), minKcal: min, maxKcal: max };
}

/* --------------------------- Prompt composition ---------------------------- */
function summarizePreviousMeals(soFarWeek) {
  // Keep it short: only last 2 days to avoid prompt bloat
  const daysWithMeals = DAYS.filter(d => soFarWeek[d]);
  const pick = daysWithMeals.slice(-2);
  if (pick.length === 0) return '';

  let lines = [];
  for (const d of pick) {
    const dayMeals = soFarWeek[d];
    lines.push(`${d}:`);
    for (const mt of MEAL_TYPES) {
      const v = dayMeals[mt];
      if (v && typeof v === 'string') {
        // Strip macro suffix to reduce tokens
        const core = v.replace(/\s*\(Cal:[^)]+\)\s*$/i,'').trim();
        lines.push(`- ${mt}: ${core}`);
      }
    }
  }
  return lines.join('\n');
}

async function personalizationBulletsPerMeal({
  userId, mealType, foodPreferences, userProfile, trainingPlan, day
}) {
  const likes   = foodPreferences?.likes;
  const dislikes= foodPreferences?.dislikes;
  const cuisines= foodPreferences?.cuisines;
  const goal    = userProfile?.goal;

  const intensityText = (() => {
    const w = trainingPlan?.[day] || {};
    const t = w.type ? String(w.type) : 'easy';
    const d = w.distance ? String(w.distance) : '';
    const i = (w.intensity != null) ? ` (intensity ${w.intensity})` : '';
    return `${t} ${d}${i}`.trim();
  })();

  const recs = userId
    ? await getTopMealsByVector({
        userId,
        mealType,
        likes,
        dislikes,
        cuisines,
        goal,
        intensityText,
        k: 2,                // 2 bullets per meal type
        candidateLimit: 40,
        efSearch: 64
      })
    : [];

  if (!recs?.length) return '';
  const bullets = recs.map(r => `- ${r.meal_description} (${r.rating}★)`).join('\n');
  return `PAST FAVORITES (${mealType}):\n${bullets}\nGenerate a NEW ${mealType} inspired by these (not identical), aligned to today's training and macros.`;
}

async function buildDayPrompt({
  day,
  userProfile,
  foodPreferences,
  trainingPlan,
  dislikedFoods,
  likedFoods,
  cuisines,
  soFarWeek,
  userId
}) {
  const prevSummary = summarizePreviousMeals(soFarWeek);

  // Per-meal RAG bullets
  const [pB,pL,pD,pS,pDe] = await Promise.all([
    personalizationBulletsPerMeal({ userId, mealType:'breakfast', foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'lunch',     foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'dinner',    foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'snacks',    foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'dessert',   foodPreferences, userProfile, trainingPlan, day }),
  ]);

  const perMealContext = [pB,pL,pD,pS,pDe].filter(Boolean).join('\n\n');

  const w = trainingPlan?.[day] || {};
  const dayTraining = `${w.type || 'easy'} ${w.distance || ''} ${w.intensity!=null ? `(intensity ${w.intensity})` : ''}`.trim();

  return `You are a sports nutritionist creating the ${day} plan for an athlete.

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

TRAINING (today):
- ${dayTraining}

WEEK SO FAR (do NOT repeat dishes / main proteins already used):
${prevSummary || '(first day or no prior meals)'}

${perMealContext || ''}

REQUIREMENTS:
1) Output ONLY JSON for this day in the exact shape below.
2) Strictly avoid disliked foods and respect restrictions.
3) Provide varied cuisines across the week; rotate main proteins.
4) Use liked foods thoughtfully (≤ 3–4 appearances in the whole week).
5) Return concise meal descriptions (no macros text).

Respond with JSON ONLY:
{
  "${day}": {
    "breakfast": "meal description",
    "lunch": "meal description",
    "dinner": "meal description",
    "dessert": "meal description",
    "snacks": "snack description"
  }
}`;
}

/* ------------------------------ Save progress ------------------------------ */
async function upsertWeekPartial({ userId, weekStarting, weekObj }) {
  if (!userId) return;

  // Try find existing row
  const { data: existing } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('meal_plans')
      .update({ meals: weekObj, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('meal_plans')
      .insert({ user_id: userId, meals: weekObj, week_starting: weekStarting });
  }
}

/* --------------------------------- Handler -------------------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // For SSE, we still POST, but stream the response.
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Switch response to SSE
  sseHeaders(res);

  const keepAlive = setInterval(() => {
    res.write(':\n\n'); // comment/ping to keep connection alive
  }, 15000);

  try {
    const { userProfile, foodPreferences, trainingPlan, userId, weekStarting } = req.body || {};

    const likedFoods    = foodPreferences?.likes || 'No preferences specified';
    const dislikedFoods = foodPreferences?.dislikes || 'No dislikes specified';
    const cuisines      = foodPreferences?.cuisines || 'No cuisines specified';

    const week = {}; // progressively filled { monday:{...}, ... }

    sendStatus(res, 'Starting weekly generation…');

    for (const day of DAYS) {
      sendStatus(res, `Generating ${day.charAt(0).toUpperCase() + day.slice(1)}…`);

      // 1) Build per-day prompt with RAG bullets + history of last 1–2 days
      const prompt = await buildDayPrompt({
        day,
        userProfile,
        foodPreferences,
        trainingPlan,
        dislikedFoods,
        likedFoods,
        cuisines,
        soFarWeek: week,
        userId
      });

      // 2) Call LLM for just this day
      const llm = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      });

      // 3) Parse day JSON
      let dayObj;
      try {
        const content = llm.choices?.[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(content);
        dayObj = parsed?.[day];
        if (!dayObj) throw new Error('Missing day key');
      } catch (e) {
        sendEvent(res, 'error', { day, message: `Invalid JSON for ${day}` });
        break; // stop the week on hard parse error
      }

      // 4) Add macros for each meal via ML API
      for (const mt of MEAL_TYPES) {
        const desc = dayObj[mt];
        if (!desc) continue;
        const macros = await getMacrosFromML(desc, mt);
        dayObj[mt] = attachMacrosText(desc, macros);
      }

      // 5) Check totals and optionally retry ONCE if way off target
      const totals = sumDayMacros(dayObj);
      const { minKcal, maxKcal } = targetForDay(userProfile, trainingPlan, day);

      if (totals.hasData && (totals.calories < minKcal || totals.calories > maxKcal)) {
        sendStatus(res, `${day}: adjusting macros (one retry)…`);
        // Simple retry: ask model to tweak choices to hit target range
        const adjustPrompt = `You produced these meals for ${day}:
${JSON.stringify(dayObj, null, 2)}

Adjust the meals minimally so that the total daily calories land between ${minKcal} and ${maxKcal}.
Return ONLY JSON with the same shape for "${day}" (no extra text).`;

        const retry = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: adjustPrompt }],
          temperature: 0.4,
          max_tokens: 500,
        });

        try {
          const content2 = retry.choices?.[0]?.message?.content ?? '{}';
          const parsed2 = JSON.parse(content2);
          const dayObj2 = parsed2?.[day];
          if (dayObj2) {
            // Re-attach macros to the adjusted meals
            for (const mt of MEAL_TYPES) {
              const desc = dayObj2[mt];
              if (!desc) continue;
              const macros = await getMacrosFromML(desc, mt);
              dayObj2[mt] = attachMacrosText(desc, macros);
            }
            dayObj = dayObj2;
          }
        } catch {}
      }

      // 6) Commit the day into the week + persist (logged-in users)
      week[day] = dayObj;

      if (userId) {
        try { await upsertWeekPartial({ userId, weekStarting, weekObj: week }); }
        catch (e) { /* don't fail the stream on DB hiccup */ }
      }

      // 7) Stream the day to the client
      sendEvent(res, 'day', { day, meals: dayObj });

      // (Optional) small delay to feel progressive
      // await new Promise(r => setTimeout(r, 200));
    }

    sendEvent(res, 'done', { success: true, weekStarting, userSaved: Boolean(userId) });
    clearInterval(keepAlive);
    res.end();
  } catch (error) {
    clearInterval(keepAlive);
    sendEvent(res, 'error', { message: error.message });
    res.end();
  }
}
