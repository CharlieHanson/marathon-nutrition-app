import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ML_API_URL = 'https://marathon-nutrition-app-production.up.railway.app';

// Get macros from ML API (no GPT macros needed!)
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
      console.log(`No ML model for meal type: ${mealType}`);
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
    console.error('ML prediction failed:', error.message);
  }
  
  return null;
}

// Add macros to all meals using ML
async function addMacrosToMeals(meals) {
  const mealsWithMacros = { ...meals };
  
  for (const [day, dayMeals] of Object.entries(meals)) {
    for (const [mealType, mealDescription] of Object.entries(dayMeals)) {
      if (!mealDescription) continue;
      
      try {
        const macros = await getMacrosFromML(mealDescription, mealType);
        
        if (macros) {
          // Add macros to description
          mealsWithMacros[day][mealType] = 
            `${mealDescription} (Cal: ${Math.round(macros.calories)}, P: ${Math.round(macros.protein)}g, C: ${Math.round(macros.carbs)}g, F: ${Math.round(macros.fat)}g)`;
        } else {
          // Keep original if ML fails
          mealsWithMacros[day][mealType] = mealDescription;
        }
      } catch (error) {
        console.error(`Failed to add macros for ${day} ${mealType}:`, error.message);
        mealsWithMacros[day][mealType] = mealDescription;
      }
    }
  }
  
  return mealsWithMacros;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, trainingPlan } = req.body;

    const likedFoods = foodPreferences.likes || 'No preferences specified';
    const dislikedFoods = foodPreferences.dislikes || 'No dislikes specified';
    const cuisines = foodPreferences.cuisines || 'No cuisines specified';
    
    const trainingSchedule = Object.entries(trainingPlan)
      .map(([day, workout]) => `${day}: ${workout.type} ${workout.distance} (${workout.intensity} intensity)`)
      .filter(item => !item.includes('undefined') && !item.includes(' (intensity)'))
      .join('\n');

      const prompt = `You are a sports nutritionist creating a weekly meal plan for an athlete.

      USER PROFILE:
      - Height: ${userProfile.height || 'Not specified'}
      - Weight: ${userProfile.weight || 'Not specified'}  
      - Goal: ${userProfile.goal || 'maintain weight'}
      - Objective: ${userProfile.objective || 'Not specified'}
      - Activity Level: ${userProfile.activityLevel || 'moderate'}
      - Dietary Restrictions: ${userProfile.dietaryRestrictions || 'None'}
      
      FOOD PREFERENCES:
      - Likes: ${likedFoods}
      - Dislikes: ${dislikedFoods}
      - Favorite Cuisines: ${cuisines}
      
      TRAINING SCHEDULE:
      ${trainingSchedule || 'No training plan specified'}
      
      Create a diverse weekly meal plan with breakfast, lunch, dinner, dessert (be creative with real desserts like cookies, brownies, fruit tarts, ice cream - not just yogurt variations), and snacks (~75% single items like "Banana" or "Almonds", ~25% combos like "Apple with peanut butter") for each day.
      
      CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:
      1. ABSOLUTE RULES (must follow):
         - NEVER include ANY of these disliked foods: ${dislikedFoods}
         - RESPECT all dietary restrictions: ${userProfile.dietaryRestrictions || 'None'}
         - Tailor nutrition to support each day's training intensity
         - Support weight goal: ${userProfile.goal || 'maintain'}
      
      2. VARIETY REQUIREMENTS (prevent repetition):
         - Each liked food should appear MAXIMUM 3-4 times across the ENTIRE week
         - No ingredient should appear in consecutive meals
         - Provide diverse meal options across different cuisines
         - Use liked foods thoughtfully, not in every meal
      
      3. LIKED FOODS GUIDANCE:
         - Liked foods (${likedFoods}) should be used MORE OFTEN than neutral foods
         - But NOT in every single meal - variety is important
         - Incorporate them naturally where they fit the meal type
         - Don't force them into inappropriate meals (e.g., no avocado in desserts)
      
      Format each meal as JUST THE DESCRIPTION:
      "Meal name with main ingredients"
      
      Example: "Scrambled eggs with spinach and avocado"
      Example: "Grilled chicken with quinoa and roasted vegetables"
      
      Respond with ONLY a JSON object in this exact format:
      {
        "monday": {
          "breakfast": "meal description",
          "lunch": "meal description", 
          "dinner": "meal description",
          "dessert": "meal description",
          "snacks": "snack description"
        },
        "tuesday": { ... },
        ... (all 7 days)
      }
      
      DO NOT include anything other than the JSON object in your response.`;

    console.log('🤖 Generating meal descriptions with GPT...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Faster and cheaper!
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,  // Reduced since no macros needed
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content;
    const mealDescriptions = JSON.parse(aiResponse);

    // Get macros from ML API
    console.log('🤖 Calculating macros with ML API...');
    const mealsWithMacros = await addMacrosToMeals(mealDescriptions);
    console.log('✅ Meal plan complete');

    res.status(200).json({ success: true, meals: mealsWithMacros });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}