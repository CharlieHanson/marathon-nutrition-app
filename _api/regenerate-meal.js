// api/regenerate-meal.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- ML Macros helpers ----
const ML_API_URL = 'https://alimenta-ml-service.onrender.com';

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
  } catch {
    // swallow ML errors; just return null to keep UX smooth
  }
  return null;
}

function attachMacrosText(desc, macros) {
  if (!macros) return desc;
  const c = (n) => Math.round(Number(n) || 0);
  return `${desc} (Cal: ${c(macros.calories)}, P: ${c(macros.protein)}g, C: ${c(macros.carbs)}g, F: ${c(macros.fat)}g)`;
}

// Schema: return just one field, the new meal description (no macros)
function regenerateSchema() {
  return {
    name: "RegeneratedMeal",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        meal: { type: "string" }
      },
      required: ["meal"]
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      day,
      mealType,
      reason,
      currentMeal,
      userProfile,
      foodPreferences,
      trainingPlan
    } = req.body || {};

    if (!day || !mealType || !reason || currentMeal === undefined || currentMeal === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: day, mealType, reason, currentMeal'
      });
    }

    const likes        = foodPreferences?.likes || '';
    const dislikes     = foodPreferences?.dislikes || '';
    const cuisines     = foodPreferences?.cuisines || '';
    const restrictions = userProfile?.dietaryRestrictions || 'None';
    const goal         = userProfile?.goal || 'maintain weight';

    const w = trainingPlan?.[day] || {};
    const trainingLine = `${w.type || 'easy'} ${w.distance || ''} ${w.intensity != null ? `(intensity ${w.intensity})` : ''}`.trim();

    const prompt = `Regenerate a single ${mealType} for ${day}.

CONTEXT
- Reason to regenerate: "${reason}"
- Current meal (replace this with something different): "${currentMeal}"
- Goal: ${goal}
- Dietary restrictions: ${restrictions}
- Likes: ${likes}
- Dislikes: ${dislikes}
- Favorite cuisines: ${cuisines}
- Today's training: ${trainingLine}

RULES
1) Return ONLY JSON with a single field "meal" (no macros text). Example:
   {"meal":"Grilled chicken with quinoa and roasted vegetables"}
2) Must avoid disliked foods and respect dietary restrictions.
3) Keep it concise, cookbook-style (no fluff, no extra text).
4) Prefer variety vs. current meal (different main protein/ingredients if possible).`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: "json_schema", json_schema: regenerateSchema() }
    });

    let text = resp.choices?.[0]?.message?.content ?? '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}$/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("Model did not return valid JSON.");
    }

    if (!parsed?.meal || typeof parsed.meal !== 'string') {
      throw new Error("Missing 'meal' in response.");
    }

    // Attach ML macros
    const macros = await getMacrosFromML(parsed.meal, mealType);
    const mealWithMacros = attachMacrosText(parsed.meal, macros);

    return res.status(200).json({
      success: true,
      meal: mealWithMacros
    });
  } catch (error) {
    console.error('Regenerate meal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
