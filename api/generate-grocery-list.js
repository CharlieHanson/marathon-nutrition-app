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

    const prompt = `Create a realistic grocery list for ONE PERSON for ONE WEEK based only on these meals:

MEALS:
${meals.join('\n')}

STRICT RULES:
- Calculate realistic portions (if chicken appears in 3 meals, estimate total amount needed)
- No duplicate ingredients 
- Realistic quantities for one person (example: 6 bananas, not "1 lb bananas")
- Proper categories (nuts go in Pantry, not Produce)
- Use standard grocery units (dozen eggs, 1 container yogurt, etc.)
- If a protein appears once, include smaller quantity (8oz-1lb)
- If a protein appears multiple times, include larger quantity (2-3lbs)

Only include ingredients that are actually mentioned in the meals above.

Respond with ONLY a JSON array, no markdown.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    });

    let groceryListText = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (groceryListText.startsWith('```json')) {
      groceryListText = groceryListText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (groceryListText.startsWith('```')) {
      groceryListText = groceryListText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    const groceryList = JSON.parse(groceryListText);
    res.status(200).json({ success: true, groceryList });

  } catch (error) {
    console.error('Grocery list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}