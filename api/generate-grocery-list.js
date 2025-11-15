// api/generate-grocery-list.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Top-level must be an object
function grocerySchema() {
  return {
    name: "GroceryList",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        list: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: "string" },
              items: {
                type: "array",
                minItems: 1,
                items: { type: "string" }
              }
            },
            required: ["category", "items"]
          }
        }
      },
      required: ["list"]
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { meals } = req.body;
    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ success: false, error: 'meals array required' });
    }

    const prompt = `Extract ingredients from these single-serving meals and produce a consolidated shopping list with no duplicates.

Meals:
${meals.join('\n')}

Rules:
- Each meal is ONE serving. Estimate total quantity across all meals.
- Use realistic shopping units (e.g., "1 lb", "2 cups", "1 bunch").
- Organize by grocery store sections (e.g., Produce, Meat, Dairy, Pantry, Bakery, Frozen).
- No explanations, no extra fields.

Return JSON that matches this structure:
{
  "list": [
    { "category": "Produce", "items": ["3 apples", "1 bunch spinach"] },
    { "category": "Meat",    "items": ["2 lbs chicken breast"] }
  ]
}`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: "json_schema", json_schema: grocerySchema() }
    });

    let text = resp.choices?.[0]?.message?.content ?? '';
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}$/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("Model did not return valid JSON.");
    }

    if (!parsed?.list || !Array.isArray(parsed.list)) {
      throw new Error("Missing 'list' array in response.");
    }

    return res.status(200).json({ success: true, groceryList: parsed.list });
  } catch (error) {
    console.error('Grocery list error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
