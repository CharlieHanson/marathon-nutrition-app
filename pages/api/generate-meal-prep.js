// api/generate-meal-prep.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://alimenta-ml-service.onrender.com';

async function getMacrosFromML(mealDescription, mealType) {
  try {
    const endpointMap = {
      breakfast: '/predict-breakfast',
      lunch: '/predict-lunch',
      dinner: '/predict-dinner',
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
  } catch (e) {
    console.error('ML prediction error:', e);
  }
  return null;
}

function attachMacrosText(desc, macros) {
  if (!macros) return desc;
  const c = (n) => Math.round(Number(n) || 0);
  return `${desc} (Cal: ${c(macros.calories)}, P: ${c(macros.protein)}g, C: ${c(macros.carbs)}g, F: ${c(macros.fat)}g)`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mealType, days, userProfile, foodPreferences } = req.body;

    if (!mealType || !days || days.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing mealType or days' 
      });
    }

    const prompt = `You are a sports nutritionist specializing in meal prep. Generate exactly 4 meal prep options for ${mealType.toUpperCase()} that will be eaten on ${days.length} days (${days.join(', ')}).

USER PROFILE:
- Goal: ${userProfile?.goal || 'maintain weight'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${foodPreferences?.likes || 'No preferences specified'}
- Dislikes: ${foodPreferences?.dislikes || 'No dislikes specified'}

MEAL PREP REQUIREMENTS:
- Must reheat well (microwave-friendly)
- Must stay fresh in fridge for 5+ days
- Easy to batch cook (scales to 4-6 servings)
- Good for portioning into containers
- Simple and quick to prepare
- Only have max 2 be chicken based meals, and have at least one vegetarian option and one meat option that isn't chicken.

For each option, provide:
1. A concise meal name and description (ingredients)
2. Why it's great for meal prep (1 short sentence)
3. Estimated prep time

Return ONLY valid JSON in this exact format:
{
  "options": [
    {
      "name": "Meal name",
      "description": "Brief description with main ingredients",
      "prepReason": "Why it's good for meal prep",
      "prepTime": "30 min"
    }
  ]
}

Generate 4 diverse options that match the user's preferences. Do NOT include macro information.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    let options = [];
    try {
      const content = response.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      options = parsed.options || [];
    } catch (e) {
      // Try to extract JSON from response
      const content = response.choices?.[0]?.message?.content || '';
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          options = parsed.options || [];
        } catch {}
      }
    }

    if (options.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate meal prep options'
      });
    }

    // Add macros to each option
    const optionsWithMacros = await Promise.all(
      options.map(async (option) => {
        const fullDescription = `${option.name}: ${option.description}`;
        const macros = await getMacrosFromML(fullDescription, mealType);
        
        return {
          ...option,
          fullDescription: attachMacrosText(fullDescription, macros),
          macros: macros ? {
            calories: Math.round(macros.calories),
            protein: Math.round(macros.protein),
            carbs: Math.round(macros.carbs),
            fat: Math.round(macros.fat),
          } : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      options: optionsWithMacros,
      mealType,
      days
    });

  } catch (error) {
    console.error('Meal prep generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}