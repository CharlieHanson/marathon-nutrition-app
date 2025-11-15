import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';

// Get macros from ML API
async function getMacrosFromML(mealDescription, mealType) {
  try {
    const endpointMap = {
      'breakfast': '/predict-breakfast',
      'lunch': '/predict-lunch',
      'dinner': '/predict-dinner',
      'snacks': '/predict-snacks',
      'dessert': '/predict-desserts'
    };
    
    const endpoint = endpointMap[mealType];
    if (!endpoint) {
      return null;
    }
    
    const mlResponse = await fetch(`${ML_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: mealDescription })
    });
    
    const mlData = await mlResponse.json();
    
    if (mlData.success) {
      return mlData.predictions;
    }
  } catch (error) {
    // ML prediction failed - return null to use meal without macros
  }
  
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, day, mealType, reason, currentMeal } = req.body;

    // Extract just the meal description (remove macros if present)
    const currentMealDesc = currentMeal.replace(/\(Cal:.*?\).*$/, '').trim();

    const prompt = `Generate a single ${mealType} for ${day} that addresses this feedback: "${reason}"

Current meal that needs improvement: ${currentMealDesc}

User profile:
- Goal: ${userProfile.goal || 'maintain weight'}
- Dietary restrictions: ${userProfile.dietaryRestrictions || 'None'}
- Likes: ${foodPreferences.likes || 'None specified'}
- Dislikes: ${foodPreferences.dislikes || 'None specified'}

Generate ONE meal description that fixes the user's concern while maintaining proper nutrition.
Format: Just the meal name and ingredients (e.g., "Grilled salmon with quinoa and roasted vegetables")

DO NOT include macros - they will be calculated automatically.

Respond with only the meal description, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,  // Smaller since no macros
      temperature: 0.8
    });

    const mealDescription = response.choices[0].message.content.trim();
    
    // Get macros from ML
    const macros = await getMacrosFromML(mealDescription, mealType);
    
    let finalMeal;
    if (macros) {
      finalMeal = `${mealDescription} (Cal: ${Math.round(macros.calories)}, P: ${Math.round(macros.protein)}g, C: ${Math.round(macros.carbs)}g, F: ${Math.round(macros.fat)}g)`;
    } else {
      finalMeal = mealDescription;  // Return without macros if ML fails
    }

    res.status(200).json({ success: true, meal: finalMeal });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}