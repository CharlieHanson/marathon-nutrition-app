// pages/api/generate-meals.js
// Streams day-by-day generation via Server-Sent Events (SSE)

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTopMealsByVector } from '../src/lib/rag.js'; // adjust path if needed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ML_API_URL = 'https://alimenta-ml-service.onrender.com';
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEAL_TYPES = ['breakfast','lunch','dinner','snacks','dessert'];

const DESSERT_CATEGORIES = ['baked', 'frozen', 'chocolate', 'fruit', 'pastry/cream'];

/* ---------------------- NEW: normalize training plan ---------------------- */
// training_plans.plan_data → { day: { workouts: [...] }, ... }
// We flatten that into { day: { type, distance, intensity }, ... }
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
      ? Math.round(
          intensities.reduce((a, b) => a + b, 0) / intensities.length
        )
      : 5;

    summary[day] = {
      type: chosen.type || 'Rest',
      distance: chosen.distance || '',
      intensity,
    };
  }

  return summary;
}

/* ------------------------------- JSON schema ------------------------------- */
function dayJsonSchema(day) {
  return {
    name: "DayPlan",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        day: { type: "string", enum: [day] },
        meals: {
          type: "object",
          additionalProperties: false,
          properties: {
            breakfast: { type: "string" },
            lunch: { type: "string" },
            dinner: { type: "string" },
            dessert: { type: "string" },
            snacks: { type: "string" }
          },
          required: ["breakfast","lunch","dinner","dessert","snacks"]
        }
      },
      required: ["day","meals"]
    }
  };
}

function countDessertCategories(weekSoFar) {
  const counts = Object.fromEntries(DESSERT_CATEGORIES.map(c => [c, 0]));
  for (const [, meals] of Object.entries(weekSoFar || {})) {
    const d = (meals?.dessert || '').toLowerCase();
    if (!d) continue;
    if (/\b(brownie|cake|tart|crumble|cookie|bar|muffin|baked)\b/.test(d)) counts['baked']++;
    else if (/\b(ice cream|gelato|sorbet|frozen|popsicle|semifreddo)\b/.test(d)) counts['frozen']++;
    else if (/\b(chocolate|cocoa|ganache|truffle|lava)\b/.test(d)) counts['chocolate']++;
    else if (/\b(berry|berries|fruit|apple|pear|peach|banana|citrus)\b/.test(d)) counts['fruit']++;
    else if (/\b(custard|panna cotta|cream|mousse|tiramisu|pastry|cream)\b/.test(d)) counts['pastry/cream']++;
  }
  return counts;
}

function pickNextDessertCategory(weekSoFar) {
  const counts = countDessertCategories(weekSoFar);
  const unused = DESSERT_CATEGORIES.find(c => counts[c] === 0);
  if (unused) return unused;
  return Object.entries(counts).sort((a,b) => a[1]-b[1])[0][0];
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

/* ---------------------- Target & thresholds (uses plan) -------------------- */
function targetForDay(userProfile, trainingPlan, day) {
  // parse weight like "160 lbs" → 160 → kg-ish
  const rawWeight = userProfile?.weight;
  const weightNumber = rawWeight ? Number(String(rawWeight).replace(/[^\d.]/g, '')) : null;
  const kg = weightNumber && weightNumber < 400 ? weightNumber * 0.45 : null;

  let kcal = kg ? 30 * kg : 2200;

  const goal = String(userProfile?.goal || '').toLowerCase();
  if (goal.includes('bulk') || goal.includes('gain')) kcal *= 1.05;
  if (goal.includes('cut') || goal.includes('lose')) kcal *= 0.90;

  const w = trainingPlan?.[day] || {};
  const intensity = w.intensity != null ? Number(w.intensity) : 5;
  kcal *= (0.9 + intensity * 0.02); // ±10% swing

  const min = Math.round(kcal * 0.8);
  const max = Math.round(kcal * 1.2);
  return { kcalTarget: Math.round(kcal), minKcal: min, maxKcal: max };
}

/* --------------------------- Prompt composition ---------------------------- */
function summarizePreviousMeals(soFarWeek) {
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
        k: 2,
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

  const [pB,pL,pD,pS,pDe] = await Promise.all([
    personalizationBulletsPerMeal({ userId, mealType:'breakfast', foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'lunch',     foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'dinner',    foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'snacks',    foodPreferences, userProfile, trainingPlan, day }),
    personalizationBulletsPerMeal({ userId, mealType:'dessert',   foodPreferences, userProfile, trainingPlan, day }),
  ]);

  const perMealContext = [pB,pL,pD,pS,pDe].filter(Boolean).join('\n\n');

  const dessertCategory = pickNextDessertCategory(soFarWeek);

  const w = trainingPlan?.[day] || {};
  const dayTraining = `${w.type || 'easy'} ${w.distance || ''} ${
    w.intensity != null ? `(intensity ${w.intensity})` : ''
  }`.trim();

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
- ${dayTraining || 'Rest / easy day'}

WEEK SO FAR (do NOT repeat dishes / main proteins already used):
${prevSummary || '(first day or no prior meals)'}

${perMealContext || ''}

CRITICAL REQUIREMENTS:
1) Output ONLY JSON for this day in the exact shape below.
2) Avoid all foods and ingredients that are not suitable for the user's dietary restrictions.
3) Strictly avoid disliked foods.
4) Provide varied cuisines across the week; rotate main proteins.
5) Use liked foods thoughtfully (≤ 3–4 appearances in the whole week).
6) Return concise meal descriptions (no macros text).
7) Provide meals that may have more protein and calories for days where the user is training harder.
8) Do not repeat meals from the week so far (vary the meals each day, especially dessert).
9) Dessert must clearly fit the category "${dessertCategory}" and differ from earlier days until all categories are covered.

Return a JSON object that matches the required schema, with:
- "day" equal to "${day}"
- "meals" containing string descriptions for breakfast, lunch, dinner, dessert, and snacks.
Do not include macros in the strings.`;
}

/* ------------------------------ Save progress ------------------------------ */
async function upsertWeekPartial({ userId, weekStarting, weekObj }) {
  if (!userId) return;

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

/* ------------------- JSON schema for partial day generation --------------- */
function dayJsonSchemaPartial(day, mealTypes) {
  const properties = {};
  for (const mt of mealTypes) {
    properties[mt] = { type: "string" };
  }
  
  return {
    name: "DayPlan",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        day: { type: "string", enum: [day] },
        meals: {
          type: "object",
          additionalProperties: false,
          properties,
          required: mealTypes
        }
      },
      required: ["day", "meals"]
    }
  };
}

/* ------------------- Build prompt with existing meals context -------------- */
async function buildDayPromptWithExisting({
  day,
  userProfile,
  foodPreferences,
  trainingPlan,
  dislikedFoods,
  likedFoods,
  cuisines,
  soFarWeek,
  userId,
  existingMealsForDay,
  missingMealTypes
}) {
  const prevSummary = summarizePreviousMeals(soFarWeek);

  // Get personalization only for missing meal types
  const personalizationPromises = missingMealTypes.map(mt =>
    personalizationBulletsPerMeal({ userId, mealType: mt, foodPreferences, userProfile, trainingPlan, day })
  );
  const personalizationResults = await Promise.all(personalizationPromises);
  const perMealContext = personalizationResults.filter(Boolean).join('\n\n');

  const dessertCategory = missingMealTypes.includes('dessert') 
    ? pickNextDessertCategory(soFarWeek) 
    : null;

  const w = trainingPlan?.[day] || {};
  const dayTraining = `${w.type || 'easy'} ${w.distance || ''} ${
    w.intensity != null ? `(intensity ${w.intensity})` : ''
  }`.trim();

  // Format existing meals for context
  const existingMealsContext = Object.entries(existingMealsForDay)
    .filter(([mt, meal]) => meal && typeof meal === 'string' && meal.trim())
    .map(([mt, meal]) => {
      const cleanMeal = meal.replace(/\s*\(Cal:[^)]+\)\s*$/i, '').trim();
      return `- ${mt}: ${cleanMeal}`;
    })
    .join('\n');

  return `You are a sports nutritionist creating ONLY the missing meals for ${day}.

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
- ${dayTraining || 'Rest / easy day'}

ALREADY PLANNED FOR TODAY (complement these with balanced nutrition):
${existingMealsContext || '(none)'}

WEEK SO FAR (do NOT repeat dishes / main proteins already used):
${prevSummary || '(first day or no prior meals)'}

${perMealContext || ''}

CRITICAL REQUIREMENTS:
1) Output ONLY JSON for these missing meals: ${missingMealTypes.join(', ')}
2) Complement the existing meals with balanced nutrition for the day
3) Avoid all foods and ingredients that are not suitable for the user's dietary restrictions
4) Strictly avoid disliked foods
5) Return concise meal descriptions (no macros text)
${dessertCategory ? `6) Dessert must clearly fit the category "${dessertCategory}"` : ''}

Return a JSON object with:
- "day" equal to "${day}"
- "meals" containing string descriptions for: ${missingMealTypes.join(', ')}
Do not include macros in the strings.`;
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
    const { 
      userProfile, 
      foodPreferences, 
      trainingPlan: clientTrainingPlan, 
      userId, 
      weekStarting,
      existingMeals  // NEW: accept existing meals
    } = req.body || {};

    const likedFoods    = foodPreferences?.likes || 'No preferences specified';
    const dislikedFoods = foodPreferences?.dislikes || 'No dislikes specified';
    const cuisines      = foodPreferences?.cuisines || 'No cuisines specified';

    // 🔥 NEW: prefer active training plan from DB
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

    // fallback to what client sends (e.g. guests)
    if (!trainingPlan && clientTrainingPlan) {
      trainingPlan = summarizePlanData(clientTrainingPlan) || null;
    }

    // Start with existing meals or empty object
    const week = {};
    
    // Helper to check if a meal slot is filled
    const isMealFilled = (day, mealType) => {
      const meal = existingMeals?.[day]?.[mealType];
      return meal && typeof meal === 'string' && meal.trim().length > 0;
    };

    // Helper to get missing meal types for a day
    const getMissingMealTypes = (day) => {
      return MEAL_TYPES.filter(mt => !isMealFilled(day, mt));
    };

    // Count total missing meals
    let totalMissing = 0;
    for (const day of DAYS) {
      totalMissing += getMissingMealTypes(day).length;
    }

    // If all meals exist, just return them
    if (totalMissing === 0) {
      sendEvent(res, 'done', { 
        success: true, 
        weekStarting, 
        userSaved: Boolean(userId),
        message: 'All meals already filled'
      });
      clearInterval(keepAlive);
      res.end();
      return;
    }

    const hasExisting = existingMeals && Object.keys(existingMeals).length > 0;
    sendStatus(res, hasExisting 
      ? `Generating ${totalMissing} remaining meals…` 
      : 'Starting weekly generation…'
    );

    for (const day of DAYS) {
      const missingMealTypes = getMissingMealTypes(day);
      
      // If all meals exist for this day, copy them and skip generation
      if (missingMealTypes.length === 0) {
        week[day] = { ...existingMeals[day] };
        sendEvent(res, 'day', { day, meals: week[day], skipped: true });
        continue;
      }

      // If some meals exist, start with those
      if (existingMeals?.[day]) {
        week[day] = { ...existingMeals[day] };
      }

      sendStatus(res, `Generating ${day.charAt(0).toUpperCase() + day.slice(1)}… (${missingMealTypes.join(', ')})`);

      // Build prompt that includes existing meals for context
      const prompt = await buildDayPromptWithExisting({
        day,
        userProfile,
        foodPreferences,
        trainingPlan,
        dislikedFoods,
        likedFoods,
        cuisines,
        soFarWeek: week,
        userId,
        existingMealsForDay: existingMeals?.[day] || {},
        missingMealTypes
      });

      const llm = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 500,
        response_format: {
          type: "json_schema",
          json_schema: dayJsonSchemaPartial(day, missingMealTypes)
        }
      });

      let dayObj = week[day] || {};
      try {
        const raw = llm.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(raw);
        if (parsed?.day === day && parsed?.meals) {
          // Only take the missing meals from the response
          for (const mt of missingMealTypes) {
            if (parsed.meals[mt]) {
              dayObj[mt] = parsed.meals[mt];
            }
          }
        } else {
          throw new Error('Schema shape mismatch');
        }
      } catch {
        const content = llm.choices?.[0]?.message?.content ?? '';
        const m = content.match(/\{[\s\S]*\}$/);
        if (m) {
          try {
            const salvage = JSON.parse(m[0]);
            if (salvage?.day === day && salvage?.meals) {
              for (const mt of missingMealTypes) {
                if (salvage.meals[mt]) {
                  dayObj[mt] = salvage.meals[mt];
                }
              }
            }
          } catch {}
        }

        if (missingMealTypes.every(mt => !dayObj[mt])) {
          sendEvent(res, 'error', { day, message: `Invalid JSON for ${day}, skipping` });
          week[day] = dayObj;
          continue;
        }
      }

      // Attach macros only to newly generated meals
      for (const mt of missingMealTypes) {
        const desc = dayObj[mt];
        if (!desc) continue;
        const macros = await getMacrosFromML(desc, mt);
        dayObj[mt] = attachMacrosText(desc, macros);
      }

      // kcal sanity vs training-aware target
      const totals = sumDayMacros(dayObj);
      const { minKcal, maxKcal } = targetForDay(userProfile, trainingPlan, day);

      if (totals.hasData && (totals.calories < minKcal || totals.calories > maxKcal)) {
        sendStatus(res, `${day}: adjusting macros (one retry)…`);

        const adjustPrompt = `You produced these meals for ${day}:
${JSON.stringify(dayObj, null, 2)}

Adjust ONLY these meal types minimally so that the total daily calories land between ${minKcal} and ${maxKcal}: ${missingMealTypes.join(', ')}
Return ONLY JSON with the same shape for this day:
{ "day": "${day}", "meals": { ${missingMealTypes.map(mt => `"${mt}": "..."`).join(', ')} } }`;

        const retry = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: adjustPrompt }],
          temperature: 0.4,
          max_tokens: 500,
        });

        try {
          const content2 = retry.choices?.[0]?.message?.content ?? '{}';
          const parsed2 = JSON.parse(content2);
          if (parsed2?.day === day && parsed2?.meals) {
            for (const mt of missingMealTypes) {
              const desc = parsed2.meals[mt];
              if (!desc) continue;
              const macros = await getMacrosFromML(desc, mt);
              dayObj[mt] = attachMacrosText(desc, macros);
            }
          }
        } catch {
          // keep original if retry fails
        }
      }

      week[day] = dayObj;

      if (userId) {
        try {
          await upsertWeekPartial({ userId, weekStarting, weekObj: week });
        } catch {}
      }

      sendEvent(res, 'day', { day, meals: dayObj });
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