import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';

// Helper function to extract macros from string
function extractMacrosFromString(mealString) {
  const calMatch = mealString.match(/Cal:\s*(\d+)/);
  const proteinMatch = mealString.match(/P:\s*(\d+)g/);
  const carbsMatch = mealString.match(/C:\s*(\d+)g/);
  const fatMatch = mealString.match(/F:\s*(\d+)g/);
  
  return {
    calories: calMatch ? parseInt(calMatch[1]) : 0,
    protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
    carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
    fat: fatMatch ? parseInt(fatMatch[1]) : 0
  };
}

// Helper to replace macros in string and add ML verification badge
function replaceMacrosInString(mealString, newMacros) {
  return mealString.replace(
    /\(Cal: \d+, P: \d+g, C: \d+g, F: \d+g\)/,
    `(Cal: ${Math.round(newMacros.calories)}, P: ${Math.round(newMacros.protein)}g, C: ${Math.round(newMacros.carbs)}g, F: ${Math.round(newMacros.fat)}g)`
  );
}

// Validate single meal with ML
async function validateMeal(mealDescription) {
  try {
    const mlResponse = await fetch(`${ML_API_URL}/predict-macros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: mealDescription })
    });
    
    const mlData = await mlResponse.json();
    
    if (mlData.success) {
      const gptMacros = extractMacrosFromString(mealDescription);
      const mlMacros = mlData.predictions;
      
      // Calculate percentage difference
      const caloriesDiff = Math.abs(gptMacros.calories - mlMacros.calories);
      const percentDiff = (caloriesDiff / gptMacros.calories) * 100;
      
      // If ML predicts >20% different, use ML's numbers
      if (percentDiff > 20 && gptMacros.calories > 0) {
        console.log(`⚠️ Large difference: GPT=${gptMacros.calories}cal, ML=${mlMacros.calories}cal`);
        return replaceMacrosInString(mealDescription, mlMacros);
      } else if (gptMacros.calories > 0) {
        // ML agrees, add verification badge
        return mealDescription.replace(/\)$/, ') ✓');
      }
    }
  } catch (error) {
    console.error('ML validation failed:', error.message);
  }
  
  // Return original if validation fails
  return mealDescription;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, day, mealType, reason, currentMeal } = req.body;

    const prompt = `Generate a single ${mealType} for ${day} that addresses this feedback: "${reason}"

Current meal that needs improvement: ${currentMeal}

User profile:
- Goal: ${userProfile.goal || 'maintain weight'}
- Dietary restrictions: ${userProfile.dietaryRestrictions || 'None'}

Generate ONE meal that fixes the user's concern while maintaining proper nutrition.
Format: "Meal name - description (Cal: XXX, P: XXg, C: XXg, F: XXg)"

Respond with only the meal text, no extra formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8
    });

    const gptMeal = response.choices[0].message.content.trim();
    
    // Validate with ML
    console.log('🤖 Validating regenerated meal with ML...');
    const validatedMeal = await validateMeal(gptMeal);
    console.log('✅ ML validation complete');

    res.status(200).json({ success: true, meal: validatedMeal });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}