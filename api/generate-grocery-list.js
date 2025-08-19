import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { meals } = req.body;

    const prompt = `Based on these weekly meals, create a comprehensive grocery list organized by category:

MEALS:
${meals.join('\n')}

Create a grocery list with ingredients needed for all meals. Organize by categories like:
- Proteins
- Vegetables & Fruits
- Grains & Starches
- Dairy & Eggs
- Pantry Items
- Other

Estimate reasonable quantities for one person for the week. Don't include very basic items like salt, pepper, cooking oil unless specifically mentioned.

Respond with a JSON array in this format:
[
  {
    "category": "Proteins",
    "items": ["2 lbs chicken breast", "1 lb salmon fillets", "etc"]
  },
  {
    "category": "Vegetables & Fruits", 
    "items": ["2 cups berries", "1 large sweet potato", "etc"]
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    });

    const groceryList = JSON.parse(response.choices[0].message.content);
    res.status(200).json({ success: true, groceryList });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}