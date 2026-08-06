/**
 * shared/lib/rebalanceDayMacros.js
 *
 * Redistribute remaining daily macros across unlogged future meals after a
 * snack is logged. Pure helper — called only from the log-snack API route.
 *
 * Rules (locked):
 * - Lazy original_targets snapshot on first rebalance for a day
 * - Per-macro proportional redistribution by each meal's share of THAT macro
 * - Floor: 0.6 × original per-macro per-meal; any clamp → over_budget
 * - Delete/clear restores from snapshot and clears it
 */

import { getRemainingBudget } from './tdeeCalc.js';
import { MIN_SCALE } from './macroEstimator.js';

const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat'];
const REBALANCE_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert'];

/**
 * Parse macros from a meal description string.
 * Format: "Name (Cal: X, P: Yg, C: Zg, F: Wg)"
 * @param {string} mealString
 * @returns {{ name: string, calories: number, protein: number, carbs: number, fat: number }}
 */
export function parseMealMacros(mealString) {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const calMatch = mealString.match(/Cal:\s*(\d+)/i);
  const proteinMatch = mealString.match(/P:\s*(\d+)\s*g/i);
  const carbsMatch = mealString.match(/C:\s*(\d+)\s*g/i);
  const fatMatch = mealString.match(/F:\s*(\d+)\s*g/i);
  const nameMatch = mealString.match(
    /\s*\(\s*Cal:\s*\d+\s*,\s*P:\s*\d+g\s*,\s*C:\s*\d+g\s*,\s*F:\s*\d+g\s*\)\s*$/i
  );
  const name = nameMatch
    ? mealString.slice(0, nameMatch.index).trim()
    : mealString.trim();

  return {
    name,
    calories: calMatch ? parseInt(calMatch[1], 10) : 0,
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 0,
    carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 0,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 0,
  };
}

/**
 * Format a meal name + macros into the canonical plan string.
 */
export function formatMealString(name, macros) {
  const n = (name || 'Meal').trim() || 'Meal';
  const c = Math.round(Number(macros.calories) || 0);
  const p = Math.round(Number(macros.protein) || 0);
  const carbs = Math.round(Number(macros.carbs) || 0);
  const f = Math.round(Number(macros.fat) || 0);
  return `${n} (Cal: ${c}, P: ${p}g, C: ${carbs}g, F: ${f}g)`;
}

function isFilledMeal(val) {
  return Boolean(val && typeof val === 'string' && val.trim() && val !== '__generating__');
}

/**
 * Build active rebalanceable meal types for a day (never includes snacks).
 */
export function getRebalanceableMealTypes(dayMeals) {
  const types = ['breakfast', 'lunch', 'dinner'];
  if (dayMeals?.include_dessert !== false) types.push('dessert');
  return types;
}

/**
 * Snapshot current macros for filled rebalanceable meals into original_targets.
 * Only runs when original_targets is missing (lazy).
 */
function ensureOriginalTargets(dayMeals, mealTypes) {
  if (dayMeals.original_targets && typeof dayMeals.original_targets === 'object') {
    return { ...dayMeals.original_targets };
  }

  const snapshot = {};
  for (const mt of mealTypes) {
    if (!isFilledMeal(dayMeals[mt])) continue;
    const parsed = parseMealMacros(dayMeals[mt]);
    snapshot[mt] = {
      calories: parsed.calories,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fat: parsed.fat,
    };
  }
  return snapshot;
}

/**
 * Restore meal strings from original_targets and clear rebalance state.
 * Clears snack slot + snacks_user_logged.
 *
 * @param {object} dayMeals
 * @returns {object} updated day object
 */
export function restoreDayFromOriginalTargets(dayMeals) {
  const next = { ...(dayMeals || {}) };
  const originals = next.original_targets || {};

  for (const mt of REBALANCE_MEAL_TYPES) {
    if (!originals[mt] || !isFilledMeal(next[mt])) continue;
    const parsed = parseMealMacros(next[mt]);
    next[mt] = formatMealString(parsed.name, originals[mt]);
  }

  delete next.original_targets;
  next.over_budget = false;
  next.adjusted_meal_types = [];
  next.targets_adjusted = false;
  next.snacks = '';
  next.snacks_user_logged = false;
  next.snacks_rating = next.snacks_rating || 0;

  return next;
}

/**
 * Rebalance unlogged meals after a snack is logged/updated.
 *
 * @param {object} params
 * @param {object} params.dayMeals - current day object from meal_plans.meals
 * @param {{ calories, protein, carbs, fat }} params.dailyMacros
 * @param {string[]} params.completedMealTypes - UI keys marked completed (eaten)
 * @param {{ calories, protein, carbs, fat }} params.snackMacros
 * @param {number} [params.floor=MIN_SCALE]
 * @returns {{
 *   dayMeals: object,
 *   over_budget: boolean,
 *   adjusted_meal_types: string[],
 *   rebalanced: boolean,
 * }}
 */
export function rebalanceDayMacros({
  dayMeals,
  dailyMacros,
  completedMealTypes = [],
  snackMacros,
  floor = MIN_SCALE,
}) {
  const completed = new Set(completedMealTypes);
  const mealTypes = getRebalanceableMealTypes(dayMeals);
  const next = { ...(dayMeals || {}) };

  const originalTargets = ensureOriginalTargets(next, mealTypes);
  next.original_targets = originalTargets;

  // Consumed = completed meals (use current strings; they were not rewritten) + snack
  const consumed = [];
  for (const mt of mealTypes) {
    if (!completed.has(mt) || !isFilledMeal(next[mt])) continue;
    consumed.push(parseMealMacros(next[mt]));
  }
  consumed.push({
    calories: Number(snackMacros.calories) || 0,
    protein: Number(snackMacros.protein) || 0,
    carbs: Number(snackMacros.carbs) || 0,
    fat: Number(snackMacros.fat) || 0,
  });

  const remaining = getRemainingBudget(dailyMacros, consumed);

  const unlogged = mealTypes.filter(
    (mt) => !completed.has(mt) && isFilledMeal(next[mt]) && originalTargets[mt]
  );

  if (unlogged.length === 0) {
    next.over_budget = false;
    next.adjusted_meal_types = [];
    next.targets_adjusted = false;
    return {
      dayMeals: next,
      over_budget: false,
      adjusted_meal_types: [],
      rebalanced: true,
    };
  }

  // Per-macro proportional shares among unlogged originals
  const assigned = {};
  for (const mt of unlogged) {
    assigned[mt] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  let overBudget = false;

  for (const macro of MACRO_KEYS) {
    const sumOriginal = unlogged.reduce(
      (sum, mt) => sum + (Number(originalTargets[mt][macro]) || 0),
      0
    );

    for (const mt of unlogged) {
      const original = Number(originalTargets[mt][macro]) || 0;
      let share;
      if (sumOriginal > 0) {
        share = original / sumOriginal;
      } else {
        share = 1 / unlogged.length;
      }

      let value = (Number(remaining[macro]) || 0) * share;
      const minValue = floor * original;
      if (value < minValue) {
        value = minValue;
        overBudget = true;
      }
      assigned[mt][macro] = value;
    }
  }

  const adjusted = [];
  for (const mt of unlogged) {
    const parsed = parseMealMacros(next[mt]);
    const macros = {
      calories: Math.round(assigned[mt].calories),
      protein: Math.round(assigned[mt].protein),
      carbs: Math.round(assigned[mt].carbs),
      fat: Math.round(assigned[mt].fat),
    };
    next[mt] = formatMealString(parsed.name, macros);
    adjusted.push(mt);
  }

  next.over_budget = overBudget;
  next.adjusted_meal_types = adjusted;
  next.targets_adjusted = adjusted.length > 0;

  return {
    dayMeals: next,
    over_budget: overBudget,
    adjusted_meal_types: adjusted,
    rebalanced: true,
  };
}

export { MIN_SCALE as REBALANCE_FLOOR };
