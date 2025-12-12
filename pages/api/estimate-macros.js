// api/estimate-macros.js
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://alimenta-ml-service.onrender.com';

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
    const { meal, mealType } = req.body;

    if (!meal || !mealType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing meal or mealType' 
      });
    }

    const macros = await getMacrosFromML(meal, mealType);
    
    if (macros) {
      const mealWithMacros = attachMacrosText(meal, macros);
      return res.status(200).json({
        success: true,
        meal: mealWithMacros,
        macros: {
          calories: Math.round(macros.calories),
          protein: Math.round(macros.protein),
          carbs: Math.round(macros.carbs),
          fat: Math.round(macros.fat),
        }
      });
    } else {
      // Return meal without macros if ML fails
      return res.status(200).json({
        success: true,
        meal: meal,
        macros: null,
        warning: 'Could not estimate macros'
      });
    }
  } catch (error) {
    console.error('Estimate macros error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}