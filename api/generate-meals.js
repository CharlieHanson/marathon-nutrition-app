import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: no REACT_APP_ prefix!
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, foodPreferences, trainingPlan } = req.body;

    // Build the prompt (same logic as before)
    const likedFoods = foodPreferences.likes?.join(', ') || 'No preferences specified';
    const dislikedFoods = foodPreferences.dislikes?.join(', ') || 'No dislikes specified';
    
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

Create a weekly meal plan with breakfast, lunch, dinner, and snacks for each day.

CRITICAL REQUIREMENTS:
- NEVER include these disliked foods: ${dislikedFoods}
- PRIORITIZE these liked foods: ${likedFoods}
- Tailor nutrition to support each day's training  
- Support their weight goal (${userProfile.goal || 'maintain'})
- Include estimated macros for each meal: (Calories, Protein, Carbs, Fat)

FORBIDDEN INGREDIENTS: ${dislikedFoods} - Do not include these in ANY meal.

Format each meal like this:
"Meal name - Brief description (Cal: XXX, P: XXg, C: XXg, F: XXg)"

Respond with ONLY a JSON object in this exact format:
{
  "monday": {
    "breakfast": "meal with macros",
    "lunch": "meal with macros", 
    "dinner": "meal with macros",
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

    // Generate explanation
    const explanationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Based on this training schedule and user profile, explain in 2-3 sentences why this meal plan works well for their goals:

        Training: ${trainingSchedule}
        Goal: ${userProfile.goal || 'maintain weight'}
        Activity Level: ${userProfile.activityLevel || 'moderate'}

        Keep it concise and focus on how the nutrition supports their training and goals.`
      }],
      max_tokens: 150
    });

    const explanation = explanationResponse.choices[0].message.content;

    res.status(200).json({ 
      success: true, 
      meals: mealData,
      explanation: explanation 
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}