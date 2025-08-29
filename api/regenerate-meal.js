import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const meal = response.choices[0].message.content.trim();
    res.status(200).json({ success: true, meal });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}