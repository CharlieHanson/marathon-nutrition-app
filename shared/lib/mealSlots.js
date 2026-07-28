/**
 * Single source of truth for meal slot keys and snack/dessert naming.
 *
 * Naming convention:
 *   UI / storage / mobile  →  'snacks'  (plural)
 *   Internal / budgets / AI prompt JSON  →  'snack'  (singular)
 *   Dessert is the same in both contexts.
 *
 * Snacks are NOT AI-generated. They are reserved for manual Log Snack (Phase 2+).
 * Generation slots never include snack; the enum/converters remain for logged snacks.
 */

/**
 * Meal slots used for AI generation budgets/prompts.
 * Never includes snack — snacks are user-logged only.
 *
 * @param {{ includeDessert?: boolean }} [toggles]
 * @returns {string[]} Ordered internal-key array, e.g. ['breakfast','lunch','dinner','dessert']
 */
export function buildGenerationMealSlots({ includeDessert = true } = {}) {
  const slots = ['breakfast', 'lunch', 'dinner'];
  if (includeDessert !== false) slots.push('dessert');
  return slots;
}

/**
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [toggles]
 * @returns {string[]} Ordered internal-key array for active meal slots.
 *   includeSnacks is ignored (always excluded). Prefer buildGenerationMealSlots for AI flows.
 */
export function buildMealSlots({ includeDessert = true } = {}) {
  return buildGenerationMealSlots({ includeDessert });
}

/**
 * UI/storage key → internal budget/generation key.
 * 'snacks' → 'snack'; everything else passes through.
 * @param {string} uiKey
 * @returns {string}
 */
export function toInternalMealType(uiKey) {
  return uiKey === 'snacks' ? 'snack' : uiKey;
}

/**
 * Internal key → UI/storage key.
 * 'snack' → 'snacks'; everything else passes through.
 * @param {string} internalKey
 * @returns {string}
 */
export function toUiMealType(internalKey) {
  return internalKey === 'snack' ? 'snacks' : internalKey;
}

/**
 * Normalize toggle flags from an API request body or hook state.
 * includeSnacks is always false — snacks are not an AI-generatable slot.
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [params]
 * @returns {{ includeSnacks: false, includeDessert: boolean }}
 */
export function resolveMealToggles({ includeDessert } = {}) {
  return {
    includeSnacks: false,
    includeDessert: includeDessert !== false,
  };
}

/**
 * Return an error message if the given meal type cannot be AI-generated,
 * or null if the type is active.
 *
 * Accepts both UI keys ('snacks') and internal keys ('snack').
 * Snacks are always rejected (manual log only).
 *
 * @param {string} mealType  - UI or internal key
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [toggles]
 * @returns {string|null}
 */
export function getInactiveMealTypeError(mealType, toggles) {
  const { includeDessert } = resolveMealToggles(toggles);
  const internal = toInternalMealType(mealType);
  if (internal === 'snack') {
    return 'Snacks are logged manually and cannot be AI-generated';
  }
  if (internal === 'dessert' && !includeDessert) {
    return 'Dessert is turned off for this day';
  }
  return null;
}
