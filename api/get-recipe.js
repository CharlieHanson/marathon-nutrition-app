import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { meal } = req.body;

    const prompt = `Create a simple, easy-to-follow recipe for: ${meal}

Include:
- Ingredients list with amounts
- Step-by-step instructions
- Prep/cook time
- Servings (try to keep it to 1 or 2)

Keep it concise and practical for everyday cooking. Do not include anything in the response that gives away
that an AI responded, such as like "Sure, here's a recipe!" just state the recipe as if it was in a cookbook.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7
    });

    const recipe = response.choices[0].message.content.trim();
    res.status(200).json({ success: true, recipe });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}