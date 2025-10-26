import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';

// Helper function to extract macros from string like "(Cal: 520, P: 45g, C: 58g, F: 8g)"
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
    `(Cal: ${Math.round(newMacros.calories)}, P: ${Math.round(newMacros.protein)}g, C: ${Math.round(newMacros.carbs)}g, F: ${Math.round(newMacros.fat)}g) ✓ ML Verified`
  );
}

// Validate macros using ML API
async function validateMacros(meals) {
  const validatedMeals = { ...meals };
  
  for (const [day, dayMeals] of Object.entries(meals)) {
    for (const [mealType, mealDescription] of Object.entries(dayMeals)) {
      if (!mealDescription) continue;
      
      try {
        // Call ML API to validate
        const mlResponse = await fetch(`${ML_API_URL}/predict-macros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meal: mealDescription })
        });
        
        const mlData = await mlResponse.json();
        
        if (mlData.success) {
          const gptMacros = extractMacrosFromString(mealDescription);
          const mlMacros = mlData.predictions;
          
          // Calculate percentage difference for calories
          const caloriesDiff = Math.abs(gptMacros.calories - mlMacros.calories);
          const percentDiff = (caloriesDiff / gptMacros.calories) * 100;
          
          // If ML predicts >20% different, use ML's numbers
          if (percentDiff > 20 && gptMacros.calories > 0) {
            console.log(`⚠️ Large difference detected for ${day} ${mealType}: GPT=${gptMacros.calories}cal, ML=${mlMacros.calories}cal`);
            validatedMeals[day][mealType] = replaceMacrosInString(mealDescription, mlMacros);
          } else if (gptMacros.calories > 0) {
            // ML agrees with GPT (within 20%), just add verification badge
            validatedMeals[day][mealType] = mealDescription.replace(
              /\)$/,
              ') ✓'
            );
          }
        }
      } catch (error) {
        console.error(`ML validation failed for ${day} ${mealType}:`, error.message);
        // Keep GPT's original if ML fails
      }
    }
  }
  
  return validatedMeals;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, trainingPlan } = req.body;

    // Extract the food preferences (now strings instead of arrays)
    const likedFoods = foodPreferences.likes || 'No preferences specified';
    const dislikedFoods = foodPreferences.dislikes || 'No dislikes specified';
    
    const trainingSchedule = Object.entries(trainingPlan)
      .map(([day, workout]) => `${day}: ${workout.type} ${workout.distance} (${workout.intensity} intensity)`)
      .filter(item => !item.includes('undefined') && !item.includes(' (intensity)'))
      .join('\n');

    const prompt = `You are a sports nutritionist creating a weekly meal plan for an athlete.

USER PROFILE:
- Height: ${userProfile.height || 'Not specified'}
- Weight: ${userProfile.weight || 'Not specified'}  
- Goal: ${userProfile.goal || 'maintain weight'}
- Activity Level: ${userProfile.activityLevel || 'moderate'}
- Dietary Restrictions: ${userProfile.dietaryRestrictions || 'None'}

FOOD PREFERENCES:
- Likes: ${likedFoods}
- Dislikes: ${dislikedFoods}

TRAINING SCHEDULE:
${trainingSchedule || 'No training plan specified'}

Create a weekly meal plan with breakfast, lunch, dinner, dessert (doesn't have to be super healthy, and be more creative than 4 versions of yogurt),
and snacks for each day. Make sure that they are getting enough macros for their weight, weight goals, and physical activity.
For example, high intensity athletes should have about:
    -6g carbs times kg of weight
    -1g protein times kg of weight

CRITICAL REQUIREMENTS:
- NEVER include these disliked foods: ${dislikedFoods}
- PRIORITIZE these liked foods: ${likedFoods}
- Tailor nutrition to support each day's training  
- Support their weight goal (${userProfile.goal || 'maintain'})
- Include estimated macros for each meal: (Calories, Protein, Carbs, Fat)
- Include ACCURATE macro estimates for each meal, usually calories is a couple hundred lower than it should be

Format each meal like this:
"Meal name - Brief description (Cal: XXX, P: XXg, C: XXg, F: XXg)"

Respond with ONLY a JSON object in this exact format:
{
  "monday": {
    "breakfast": "meal with macros",
    "lunch": "meal with macros", 
    "dinner": "meal with macros",
    "dessert": "meal with macros",
    "snacks": "snack with macros"
  },
  "tuesday": { ... },
  ... (all 7 days)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content;
    const mealData = JSON.parse(aiResponse);

    // Validate macros using ML API
    console.log('🤖 Validating meals with ML API...');
    const validatedMeals = await validateMacros(mealData);
    console.log('✅ ML validation complete');

    res.status(200).json({ success: true, meals: validatedMeals });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}