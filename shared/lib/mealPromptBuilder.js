/**
 * Meal Prompt Builder for Alimenta
 * shared/lib/mealPromptBuilder.js
 *
 * Builds OpenAI prompts for all meal generation flows.
 * The key change from the old prompts: we now include macro targets
 * and ask for structured JSON with ingredients, types, and gram portions.
 */

// ─── Ingredient Type Descriptions (for the AI) ──────────────────────────────

const TYPE_DESCRIPTIONS = `Ingredient types (use exactly these labels):
- "protein": meat, fish, eggs, tofu, tempeh, legumes, yogurt, cottage cheese
- "carb": rice, pasta, bread, potato, oats, quinoa, couscous, tortillas (COOKED weights)
- "vegetable": broccoli, spinach, peppers, onions, tomatoes, salad greens, mushrooms
- "fat": oils, butter, ghee, avocado oil (pure added fats only)`;

// ─── Response Format ─────────────────────────────────────────────────────────

const SINGLE_MEAL_FORMAT = `Respond with ONLY valid JSON, no other text:
{
  "meal_name": "Short descriptive name with key ingredients",
  "ingredients": [
    { "name": "chicken breast", "type": "protein", "grams": 170 },
    { "name": "brown rice cooked", "type": "carb", "grams": 220 },
    { "name": "broccoli", "type": "vegetable", "grams": 150 },
    { "name": "olive oil", "type": "fat", "grams": 12 }
  ]
}`;

const DAY_MEALS_FORMAT = `Respond with ONLY valid JSON, no other text:
{
  "breakfast": {
    "meal_name": "...",
    "ingredients": [{ "name": "...", "type": "protein|carb|vegetable|fat", "grams": 0 }, ...]
  },
  "lunch": { "meal_name": "...", "ingredients": [...] },
  "dinner": { "meal_name": "...", "ingredients": [...] },
  "snack": { "meal_name": "...", "ingredients": [...] },
  "dessert": { "meal_name": "...", "ingredients": [...] }
}`;

const WEEK_MEALS_FORMAT = `Respond with ONLY valid JSON, no other text:
{
  "monday": {
    "breakfast": { "meal_name": "...", "ingredients": [{ "name": "...", "type": "protein|carb|vegetable|fat", "grams": 0 }, ...] },
    "lunch": { "meal_name": "...", "ingredients": [...] },
    "dinner": { "meal_name": "...", "ingredients": [...] },
    "snack": { "meal_name": "...", "ingredients": [...] },
    "dessert": { "meal_name": "...", "ingredients": [...] }
  },
  "tuesday": { ... },
  ... (all 7 days)
}`;

// ─── Shared Blocks ───────────────────────────────────────────────────────────

function buildPreferencesBlock({ foodPreferences, dietaryRestrictions }) {
  const likes = foodPreferences?.likes || foodPreferences?.cuisine_favorites
    ? [foodPreferences.likes, foodPreferences.cuisine_favorites].filter(Boolean).join(', ')
    : null;
  const dislikes = foodPreferences?.dislikes || null;

  let block = '';
  if (dietaryRestrictions) {
    block += `DIETARY RESTRICTIONS (MUST follow): ${dietaryRestrictions}\n`;
  }
  if (likes) {
    block += `PREFERRED FOODS/CUISINES: ${likes}\n`;
  }
  if (dislikes) {
    block += `DISLIKED FOODS (NEVER use): ${dislikes}\n`;
  }
  return block || 'No specific preferences.\n';
}

function buildTrainingBlock({ todayTraining, tomorrowTraining }) {
  let block = '';
  if (todayTraining) {
    block += `TODAY'S TRAINING: ${todayTraining}\n`;
  }
  if (tomorrowTraining) {
    block += `TOMORROW'S TRAINING: ${tomorrowTraining}\n`;
  }
  return block || 'REST DAY\n';
}

function formatTrainingDay(workouts) {
  if (!workouts || !Array.isArray(workouts)) return 'Rest';
  const active = workouts.filter(
    (w) => w.type && w.type.toLowerCase() !== 'rest' && w.type !== ''
  );
  if (active.length === 0) return 'Rest';
  return active
    .map((w) => `${w.type}${w.distance ? ' ' + w.distance : ''} (intensity ${w.intensity || 5}/10)`)
    .join(' + ');
}

function buildVarietyBlock({ avoidIngredients, alreadyGeneratedToday, ragContext }) {
  let block = '';
  if (avoidIngredients?.length) {
    block += `AVOID THESE (already used recently): ${avoidIngredients.join(', ')}\n`;
  }
  if (alreadyGeneratedToday?.length) {
    block += `ALREADY GENERATED TODAY (add variety): ${alreadyGeneratedToday.join('; ')}\n`;
  }
  if (ragContext) {
    block += `\nPERSONALIZATION CONTEXT:\n${ragContext}\n`;
  }
  return block;
}

function buildMacroBudgetBlock(budget) {
  if (!budget) return '';
  return `MACRO TARGETS for this meal:
- Calories: ~${budget.calories} kcal
- Protein: ~${budget.protein}g
- Carbs: ~${budget.carbs}g
- Fat: ~${budget.fat}g

IMPORTANT: Choose ingredient gram amounts that will approximately hit these targets.
Use COOKED weights for carbs (rice, pasta, potatoes). A rough guide:
- 1g of protein-type food ≈ 0.25g protein, 0.10g fat
- 1g of cooked carb-type food ≈ 0.23g carbs
- 1g of vegetable ≈ 0.06g carbs
- 1g of added fat (oil/butter) ≈ 1.0g fat
So for ${budget.protein}g protein, you need ~${Math.round(budget.protein / 0.25)}g of protein food.
For ${budget.carbs}g carbs, you need ~${Math.round(budget.carbs / 0.23)}g of cooked carb food.
For ${budget.fat}g fat (after accounting for fat in protein), you may need ~${Math.max(0, Math.round((budget.fat - budget.protein * 0.4) / 1.0))}g of added fat.\n`;
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

/**
 * Build a prompt for generating a single meal.
 *
 * Used by: generate-single-meal.js, regenerate-meal.js, generate-day.js (per meal)
 */
export function buildSingleMealPrompt({
  mealType,
  macroBudget,
  foodPreferences = {},
  dietaryRestrictions = '',
  todayTraining = null,
  tomorrowTraining = null,
  avoidIngredients = [],
  alreadyGeneratedToday = [],
  ragContext = null,
  reason = null,        // for regeneration: user's feedback
  currentMeal = null,   // for regeneration: meal being replaced
}) {
  const lines = [
    `You are a sports nutritionist creating a ${mealType} for an athlete.`,
    '',
    buildMacroBudgetBlock(macroBudget),
    buildPreferencesBlock({ foodPreferences, dietaryRestrictions }),
    buildTrainingBlock({ todayTraining, tomorrowTraining }),
    buildVarietyBlock({ avoidIngredients, alreadyGeneratedToday, ragContext }),
  ];

  if (reason && currentMeal) {
    lines.push(`USER FEEDBACK: "${reason}"`);
    lines.push(`MEAL TO REPLACE: ${currentMeal}`);
    lines.push('Generate a new meal addressing this feedback.\n');
  }

  lines.push(`RULES:`);
  lines.push(`1. Return ingredients with COOKED gram weights`);
  lines.push(`2. Every ingredient must have a type: protein, carb, vegetable, or fat`);
  lines.push(`3. Make it a realistic, appetizing ${mealType}`);
  lines.push(`4. Meal name should be short and descriptive (e.g., "Grilled salmon with quinoa and roasted vegetables")`);
  lines.push('');
  lines.push(TYPE_DESCRIPTIONS);
  lines.push('');
  lines.push(SINGLE_MEAL_FORMAT);

  return lines.join('\n');
}

/**
 * Build a prompt for generating all meals for one day.
 *
 * Used by: generate-day.js (mobile)
 */
export function buildDayPrompt({
  mealBudgets,
  foodPreferences = {},
  dietaryRestrictions = '',
  todayTraining = null,
  tomorrowTraining = null,
  avoidIngredients = [],
  ragContext = null,
}) {
  const budgetSummary = Object.entries(mealBudgets)
    .map(([meal, b]) => `  ${meal}: ${b.calories} kcal | ${b.protein}P ${b.carbs}C ${b.fat}F`)
    .join('\n');

  const lines = [
    'You are a sports nutritionist creating a full day of meals for an athlete.',
    '',
    `MACRO BUDGETS PER MEAL:`,
    budgetSummary,
    '',
    `Choose ingredient gram amounts that approximately hit each meal's targets.`,
    `Use COOKED weights for carbs. Rough density guide:`,
    `- 1g protein food ≈ 0.25g protein, 0.10g fat`,
    `- 1g cooked carb food ≈ 0.23g carbs`,
    `- 1g vegetable ≈ 0.06g carbs`,
    `- 1g added fat ≈ 1.0g fat`,
    '',
    buildPreferencesBlock({ foodPreferences, dietaryRestrictions }),
    buildTrainingBlock({ todayTraining, tomorrowTraining }),
    buildVarietyBlock({ avoidIngredients, alreadyGeneratedToday: [], ragContext }),
    'RULES:',
    '1. Each meal must have ingredients with types (protein, carb, vegetable, fat) and gram weights',
    '2. Use COOKED weights for grains, pasta, potatoes',
    '3. Ensure variety across meals — don\'t repeat the same protein or carb source',
    '4. Dessert should be a real dessert (not just yogurt), but keep it within the macro budget',
    '5. Snack can be simple (1-3 ingredients)',
    '6. Meal names should be short and descriptive',
    '',
    TYPE_DESCRIPTIONS,
    '',
    DAY_MEALS_FORMAT,
  ];

  return lines.join('\n');
}

/**
 * Build a prompt for generating a full week of meals.
 *
 * Used by: generate-meals.js (web)
 *
 * Note: This asks for all 7 days in one call. For the new architecture,
 * the response is much larger since it includes ingredients. Consider
 * whether you want to switch to 7 separate day calls instead.
 */
export function buildWeekPrompt({
  weekMealBudgets,   // { monday: { breakfast: {P,C,F,cal}, ... }, tuesday: ... }
  foodPreferences = {},
  dietaryRestrictions = '',
  trainingSchedule = '', // formatted string of weekly training
  ragContext = null,
}) {
  // Summarize budgets (just show daily totals to keep prompt shorter)
  const dailySummaries = Object.entries(weekMealBudgets)
    .map(([day, meals]) => {
      const total = Object.values(meals).reduce(
        (acc, b) => ({
          calories: acc.calories + b.calories,
          protein: acc.protein + b.protein,
          carbs: acc.carbs + b.carbs,
          fat: acc.fat + b.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      return `  ${day}: ~${total.calories} kcal (${total.protein}P/${total.carbs}C/${total.fat}F)`;
    })
    .join('\n');

  // Pick one day to show per-meal breakdown as example
  const exampleDay = Object.keys(weekMealBudgets)[0];
  const exampleBudgets = Object.entries(weekMealBudgets[exampleDay])
    .map(([meal, b]) => `    ${meal}: ${b.calories} kcal | ${b.protein}P ${b.carbs}C ${b.fat}F`)
    .join('\n');

  const lines = [
    'You are a sports nutritionist creating a weekly meal plan for an athlete.',
    '',
    'DAILY CALORIE TARGETS:',
    dailySummaries,
    '',
    `EXAMPLE PER-MEAL BREAKDOWN (${exampleDay}):`,
    exampleBudgets,
    '(Similar splits apply to other days)',
    '',
    `Choose ingredient gram amounts that approximately hit each meal's macro targets.`,
    `Use COOKED weights. Density guide:`,
    `- 1g protein food ≈ 0.25g protein, 0.10g fat`,
    `- 1g cooked carb food ≈ 0.23g carbs`,
    `- 1g added fat ≈ 1.0g fat`,
    '',
    buildPreferencesBlock({ foodPreferences, dietaryRestrictions }),
    `TRAINING SCHEDULE:\n${trainingSchedule || 'Not specified'}\n`,
    ragContext ? `PERSONALIZATION:\n${ragContext}\n` : '',
    'RULES:',
    '1. Each meal has ingredients with type (protein/carb/vegetable/fat) and gram weight',
    '2. Use COOKED weights for grains, pasta, potatoes',
    '3. NEVER repeat the same dinner protein on consecutive days',
    '4. Vary cuisines across the week',
    '5. Desserts should be creative (not just yogurt variations)',
    '6. Snacks can be simple (1-3 ingredients)',
    '7. Respect dietary restrictions absolutely',
    '8. Never use disliked foods',
    '',
    TYPE_DESCRIPTIONS,
    '',
    WEEK_MEALS_FORMAT,
  ];

  return lines.join('\n');
}

/**
 * Build a prompt for parsing a user-entered meal description into
 * structured ingredients with types and estimated grams.
 *
 * Used by: log-custom-meal flow
 */
export function buildParseMealPrompt({ mealDescription }) {
  return `Parse this meal into structured ingredients with types and estimated gram portions.

MEAL: "${mealDescription}"

Estimate realistic serving sizes based on a standard adult portion.
Use COOKED weights for grains, pasta, and potatoes.

${TYPE_DESCRIPTIONS}

${SINGLE_MEAL_FORMAT}`;
}

/**
 * Build a prompt for meal prep options.
 *
 * Used by: generate-meal-prep.js
 */
export function buildMealPrepPrompt({
  mealType,
  macroBudget,
  numServings = 5,
  foodPreferences = {},
  dietaryRestrictions = '',
}) {
  const lines = [
    `You are a sports nutritionist creating a meal prep recipe for ${numServings} servings of ${mealType}.`,
    '',
    `PER-SERVING MACRO TARGETS:`,
    `- Calories: ~${macroBudget.calories} kcal`,
    `- Protein: ~${macroBudget.protein}g`,
    `- Carbs: ~${macroBudget.carbs}g`,
    `- Fat: ~${macroBudget.fat}g`,
    '',
    buildPreferencesBlock({ foodPreferences, dietaryRestrictions }),
    'RULES:',
    '1. Recipe should be easy to batch cook and store for the week',
    '2. Ingredients should reheat well',
    '3. Return PER-SERVING ingredient amounts',
    '4. Suggest 2-3 different options',
    '',
    TYPE_DESCRIPTIONS,
    '',
    `Respond with ONLY valid JSON:`,
    `{`,
    `  "options": [`,
    `    {`,
    `      "meal_name": "...",`,
    `      "ingredients": [{ "name": "...", "type": "...", "grams": 0 }, ...]`,
    `    },`,
    `    ...`,
    `  ]`,
    `}`,
  ];

  return lines.join('\n');
}

// ─── Helpers for callers ─────────────────────────────────────────────────────

export { formatTrainingDay };