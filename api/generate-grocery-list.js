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

    const prompt = `Based on these weekly meals, create a realistic grocery list for ONE PERSON for ONE WEEK:

MEALS:
${meals.join('\n')}

Rules:
- Only include ingredients that appear in the meals above
- Consolidate duplicate ingredients across meals
- Use realistic quantities for 1 person/1 week
- Group similar items to avoid redundancy
- Use proper units (dozen eggs, not "1 lb eggs")
- Skip basic seasonings (salt, pepper, oil) unless specifically mentioned
- If multiple proteins appear, prioritize the most frequent ones

Categories: Proteins, Produce, Grains & Starches, Dairy, Pantry Items

Example format:
"2 lbs chicken breast" not "4 lbs chicken breast"
"1 dozen eggs" not "1 lb eggs"
"2 bananas" not "1 lb bananas"

Respond with ONLY a JSON array, no markdown formatting.`;

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