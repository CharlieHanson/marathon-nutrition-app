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

    const prompt = `Extract ingredients from these meals and create a shopping list:

${meals.join('\n')}

Rules:
- List each ingredient only once
- Estimate total quantity needed for all meals combined
- Use realistic shopping units
- Organize by grocery store sections

Format as JSON array with categories and items only. No explanations.

Example format (FOLLOW THIS):
[
  {"category": "Meat", "items": ["2 lbs chicken breast", "1 lb ground turkey"]},
  {"category": "Produce", "items": ["1 bunch spinach", "3 avocados"]}
]

Ensure that there are NO DUPLICATES before returning.

Response:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    });

    let groceryListText = response.choices[0].message.content.trim();

    const groceryList = JSON.parse(groceryListText);
    res.status(200).json({ success: true, groceryList });

  } catch (error) {
    console.error('Grocery list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}