/**
 * get-recipe.js
 * pages/api/get-recipe.js
 *
 * Generates a cookbook-style recipe for a meal string.
 * Respects user's disliked foods and dietary restrictions.
 * Supports user-selected serving count (1-6).
 *
 * Body: { meal, servings?, dislikes?, dietaryRestrictions? }
 *
 * Returns: { success, recipe (display string), structured (JSON) }
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── JSON Schema ─────────────────────────────────────────────────────────────

function recipeSchema(maxServings = 6) {
  return {
    name: 'Recipe',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        servings: { type: 'integer', minimum: 1, maximum: maxServings },
        time: {
          type: 'object',
          additionalProperties: false,
          properties: {
            prep_minutes: { type: 'integer', minimum: 0 },
            cook_minutes: { type: 'integer', minimum: 0 },
            total_minutes: { type: 'integer', minimum: 0 },
          },
          required: ['prep_minutes', 'cook_minutes', 'total_minutes'],
        },
        ingredients: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' },
        },
        steps: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' },
        },
        notes: { type: 'string' },
      },
      required: ['title', 'servings', 'time', 'ingredients', 'steps'],
    },
  };
}

// ─── Display Formatter ───────────────────────────────────────────────────────

function toCookbookText(r) {
  const lines = [];
  lines.push(r.title || 'Recipe');
  lines.push(`Servings: ${r.servings ?? 1}`);
  if (r.time) {
    lines.push(
      `Time: prep ${r.time.prep_minutes ?? 0} min • cook ${r.time.cook_minutes ?? 0} min • total ${r.time.total_minutes ?? 0} min`
    );
  }
  lines.push('');
  lines.push('Ingredients:');
  (r.ingredients || []).forEach((i) => lines.push(`- ${i}`));
  lines.push('');
  lines.push('Steps:');
  (r.steps || []).forEach((s, idx) => lines.push(`${idx + 1}. ${s}`));
  if (r.notes) {
    lines.push('');
    lines.push('Notes:');
    lines.push(r.notes);
  }
  return lines.join('\n');
}

// ─── Post-generation: filter disliked ingredients from string list ────────────

function filterDislikedFromStrings(ingredientStrings, bannedList) {
  if (!bannedList.length) return ingredientStrings;

  return ingredientStrings.filter((line) => {
    const lower = line.toLowerCase();
    const isBanned = bannedList.some(
      (b) => lower.includes(b) || b.includes(lower.replace(/[\d\s.g,ml]+/g, '').trim())
    );
    if (isBanned) {
      console.warn(`⚠️ Removed disliked ingredient from recipe: "${line}"`);
    }
    return !isBanned;
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      meal,
      servings = 1,
      dislikes = '',
      dietaryRestrictions = '',
    } = req.body;

    if (!meal || typeof meal !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing meal' });
    }

    const clampedServings = Math.min(6, Math.max(1, Math.round(servings)));

    // Build banned list for post-generation filtering
    const bannedList = [
      ...dislikes.toLowerCase().split(','),
      ...dietaryRestrictions.toLowerCase().split(','),
    ]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Build prompt with preference constraints
    let constraintBlock = '';
    if (dietaryRestrictions) {
      constraintBlock += `\n- DIETARY RESTRICTIONS (MUST follow): ${dietaryRestrictions}`;
    }
    if (dislikes) {
      constraintBlock += `\n- DISLIKED FOODS (NEVER use any of these as ingredients): ${dislikes}`;
      constraintBlock += `\n- If the meal name contains a disliked ingredient, substitute it with a similar alternative.`;
    }

    const prompt = `Write a concise cookbook-style recipe for: "${meal}".
- Servings: exactly ${clampedServings}.
- Ingredients with amounts scaled for ${clampedServings} serving${clampedServings > 1 ? 's' : ''}.
- Step-by-step instructions.
- Prep/cook/total time (minutes).
- Optional brief notes.${constraintBlock}
Return ONLY JSON that matches the provided schema. No extra text.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: 'json_schema', json_schema: recipeSchema(clampedServings) },
    });

    let text = resp.choices?.[0]?.message?.content ?? '';
    let structured;
    try {
      structured = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}$/);
      if (m) structured = JSON.parse(m[0]);
      else throw new Error('Model did not return valid JSON.');
    }

    // Force correct servings count
    structured.servings = clampedServings;

    // Post-generation: remove any disliked ingredients that slipped through
    if (bannedList.length > 0 && structured.ingredients) {
      structured.ingredients = filterDislikedFromStrings(structured.ingredients, bannedList);
    }

    const recipe = toCookbookText(structured);
    return res.status(200).json({ success: true, recipe, structured });
  } catch (error) {
    console.error('Recipe error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}