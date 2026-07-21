/**
 * Parse JSON from LLM responses (markdown fences, truncation repair).
 */
export function parseAIJson(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();

  try {
    return JSON.parse(s);
  } catch {
    /* continue */
  }

  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch {
      /* continue */
    }
  }

  let truncated = s;
  if (start !== -1) truncated = s.slice(start);

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  for (const ch of truncated) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  truncated = truncated.replace(/,\s*$/, '');
  truncated = truncated.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
  truncated = truncated.replace(/,\s*\{[^}]*$/, '');

  for (let i = 0; i < openBrackets; i++) truncated += ']';
  for (let i = 0; i < openBraces; i++) truncated += '}';

  try {
    return JSON.parse(truncated);
  } catch {
    console.error('parseAIJson failed. First 500 chars:', s.slice(0, 500));
    throw new Error('Failed to parse AI JSON');
  }
}
