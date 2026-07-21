/**
 * Single source of truth for meal slot keys and snack/dessert naming.
 *
 * Naming convention:
 *   UI / storage / mobile  →  'snacks'  (plural)
 *   Internal / budgets / AI prompt JSON  →  'snack'  (singular)
 *   Dessert is the same in both contexts.
 */

/**
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [toggles]
 * @returns {string[]} Ordered internal-key array for active meal slots.
 *   e.g. ['breakfast','lunch','dinner','snack','dessert']
 */
export function buildMealSlots({ includeSnacks = true, includeDessert = true } = {}) {
  const slots = ['breakfast', 'lunch', 'dinner'];
  if (includeSnacks !== false) slots.push('snack');
  if (includeDessert !== false) slots.push('dessert');
  return slots;
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
 * Fields default to true when absent (treats undefined / null as "on").
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [params]
 * @returns {{ includeSnacks: boolean, includeDessert: boolean }}
 */
export function resolveMealToggles({ includeSnacks, includeDessert } = {}) {
  return {
    includeSnacks: includeSnacks !== false,
    includeDessert: includeDessert !== false,
  };
}

/**
 * Return an error message if the given meal type is currently disabled by toggles,
 * or null if the type is active.
 *
 * Accepts both UI keys ('snacks') and internal keys ('snack').
 *
 * @param {string} mealType  - UI or internal key
 * @param {{ includeSnacks?: boolean, includeDessert?: boolean }} [toggles]
 * @returns {string|null}
 */
export function getInactiveMealTypeError(mealType, toggles) {
  const { includeSnacks, includeDessert } = resolveMealToggles(toggles);
  const internal = toInternalMealType(mealType);
  if (internal === 'snack' && !includeSnacks) {
    return 'Snacks are turned off for this day';
  }
  if (internal === 'dessert' && !includeDessert) {
    return 'Dessert is turned off for this day';
  }
  return null;
}
