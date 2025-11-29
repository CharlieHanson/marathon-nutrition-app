// api/get-recipe.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// JSON schema the model must follow (top-level object required)
function recipeSchema() {
  return {
    name: "Recipe",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        servings: { type: "integer", minimum: 1, maximum: 2 },
        time: {
          type: "object",
          additionalProperties: false,
          properties: {
            prep_minutes: { type: "integer", minimum: 0 },
            cook_minutes: { type: "integer", minimum: 0 },
            total_minutes: { type: "integer", minimum: 0 }
          },
          required: ["prep_minutes", "cook_minutes", "total_minutes"]
        },
        ingredients: {
          type: "array",
          minItems: 1,
          items: { type: "string" }
        },
        steps: {
          type: "array",
          minItems: 1,
          items: { type: "string" }
        },
        notes: { type: "string" }
      },
      required: ["title", "servings", "time", "ingredients", "steps"]
    }
  };
}

// Turn the structured JSON into a single display string
function toCookbookText(r) {
  const lines = [];
  lines.push(r.title || "Recipe");
  lines.push(`Servings: ${r.servings ?? 1}`);
  if (r.time) {
    lines.push(
      `Time: prep ${r.time.prep_minutes ?? 0} min • cook ${r.time.cook_minutes ?? 0} min • total ${r.time.total_minutes ?? 0} min`
    );
  }
  lines.push("");
  lines.push("Ingredients:");
  (r.ingredients || []).forEach(i => lines.push(`- ${i}`));
  lines.push("");
  lines.push("Steps:");
  (r.steps || []).forEach((s, idx) => lines.push(`${idx + 1}. ${s}`));
  if (r.notes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(r.notes);
  }
  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { meal } = req.body;
    if (!meal || typeof meal !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing meal' });
    }

    const prompt = `Write a concise cookbook-style recipe for: "${meal}".
- Ingredients with amounts.
- Step-by-step instructions.
- Prep/cook/total time (minutes).
- Servings (1 or 2).
- Optional brief notes.
Return ONLY JSON that matches the provided schema. No extra text.`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_schema", json_schema: recipeSchema() }
    });

    let text = resp.choices?.[0]?.message?.content ?? '';
    let structured;
    try {
      structured = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}$/);
      if (m) structured = JSON.parse(m[0]);
      else throw new Error("Model did not return valid JSON.");
    }

    // Convert to string for your existing UI
    const recipe = toCookbookText(structured);
    return res.status(200).json({ success: true, recipe });

  } catch (error) {
    console.error('Recipe error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
