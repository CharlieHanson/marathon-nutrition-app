/**
 * Macro Estimator for Alimenta
 * shared/lib/macroEstimator.js
 *
 * Two responsibilities:
 *   1. Density lookup: ingredients with grams → P/C/F/kcal
 *   2. Algebraic scaler: adjust portions to hit macro targets
 *
 * Uses type-level macro densities (per gram) derived from USDA data.
 * These are the same values computed by collect_data_v3.py and stored
 * in type_macro_densities.json. Hardcoded here to avoid a network hop.
 *
 * Upgrade path: replace TYPE_DENSITIES with ingredient-level lookups
 * from the ML service once you build that out (Phase 4).
 */

// ─── Type Macro Densities (per gram of food) ────────────────────────────────
//
// Sourced from USDA data, medians of pure single-ingredient foods.
// These represent: for 1 gram of a "protein-type" food, how many grams
// of actual protein/carbs/fat does it contain?
//
// Example: 100g cooked chicken breast ≈ 31g protein, 0g carb, 3.6g fat
//          → p_per_g = 0.31, c_per_g = 0.00, f_per_g = 0.036

const TYPE_DENSITIES = {
    protein: { p_per_g: 0.25, c_per_g: 0.02, f_per_g: 0.10 },
    carb:    { p_per_g: 0.03, c_per_g: 0.23, f_per_g: 0.02 },
    vegetable: { p_per_g: 0.02, c_per_g: 0.06, f_per_g: 0.01 },
    fat:     { p_per_g: 0.00, c_per_g: 0.00, f_per_g: 1.00 },
  };
  
  // ─── Density Lookup ──────────────────────────────────────────────────────────
  
  /**
   * Compute macros from a list of ingredients with grams and types.
   *
   * @param {Array<{ name: string, type: string, grams: number }>} ingredients
   * @returns {{ protein: number, carbs: number, fat: number, calories: number }}
   */
  export function computeMacros(ingredients) {
    let protein = 0;
    let carbs = 0;
    let fat = 0;
  
    for (const ing of ingredients) {
      const type = (ing.type || '').toLowerCase().trim();
      const grams = parseFloat(ing.grams) || 0;
  
      const density = TYPE_DENSITIES[type];
      if (!density) {
        // Unknown type — skip (or you could log a warning)
        console.warn(`Unknown ingredient type "${type}" for "${ing.name}", skipping macro calc`);
        continue;
      }
  
      protein += grams * density.p_per_g;
      carbs += grams * density.c_per_g;
      fat += grams * density.f_per_g;
    }
  
    protein = Math.round(protein * 10) / 10;
    carbs = Math.round(carbs * 10) / 10;
    fat = Math.round(fat * 10) / 10;
    const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  
    return { protein, carbs, fat, calories };
  }
  
  // ─── Algebraic Scaler ────────────────────────────────────────────────────────
  
  /**
   * Scale factor bounds. We won't shrink an ingredient below 60% of the
   * AI-suggested portion or grow it beyond 150%.
   */
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.5;
  
  /**
   * Absolute gram bounds per type — prevents absurd portions even after scaling.
   */
  const PORTION_BOUNDS = {
    protein:   { min: 30,  max: 350 },
    carb:      { min: 30,  max: 400 },
    vegetable: { min: 0,   max: 400 },
    fat:       { min: 0,   max: 40  },
  };
  
  /**
   * Drift threshold: if every macro is within this tolerance, skip scaling.
   */
  const CALORIE_DRIFT_THRESHOLD = 50; // kcal
  const MACRO_DRIFT_PCT = 0.12;       // 12% relative
  
  /**
   * Check if computed macros are close enough to targets that scaling isn't needed.
   *
   * @param {{ protein, carbs, fat, calories }} computed
   * @param {{ protein, carbs, fat, calories }} target
   * @returns {boolean}
   */
  export function isWithinTolerance(computed, target) {
    if (Math.abs(computed.calories - target.calories) > CALORIE_DRIFT_THRESHOLD) {
      return false;
    }
  
    for (const macro of ['protein', 'carbs', 'fat']) {
      const t = target[macro];
      if (t <= 0) continue;
      if (Math.abs(computed[macro] - t) / t > MACRO_DRIFT_PCT) {
        return false;
      }
    }
  
    return true;
  }
  
  /**
   * Adjust ingredient portions to bring computed macros closer to target macros.
   *
   * Strategy:
   *   1. Scale protein-type ingredients to hit protein target
   *   2. Scale carb-type ingredients to hit carb target
   *   3. Scale fat-type ingredients to hit fat target (small lever, big caloric impact)
   *   4. Leave vegetable portions unchanged (low caloric impact, mainly volume)
   *
   * Each scale factor is clamped to [MIN_SCALE, MAX_SCALE] to keep portions realistic.
   *
   * @param {Array<{ name: string, type: string, grams: number }>} ingredients
   * @param {{ protein: number, carbs: number, fat: number, calories: number }} target
   *   - The macro budget this meal should hit
   * @returns {{
   *   ingredients: Array<{ name, type, grams, originalGrams }>,
   *   macros: { protein, carbs, fat, calories },
   *   scaled: boolean,
   *   scaleFactors: { protein?: number, carb?: number, fat?: number }
   * }}
   */
  export function adjustPortions(ingredients, target) {
    // Deep copy so we don't mutate the original
    let adjusted = ingredients.map((ing) => ({
      ...ing,
      originalGrams: ing.grams,
      grams: parseFloat(ing.grams) || 0,
    }));
  
    // First, check if we even need to scale
    const initialMacros = computeMacros(adjusted);
    if (isWithinTolerance(initialMacros, target)) {
      return {
        ingredients: adjusted,
        macros: initialMacros,
        scaled: false,
        scaleFactors: {},
      };
    }
  
    const scaleFactors = {};
  
    // Helper: compute total grams contributed by a type to a specific macro
    function typeMacroContribution(type, macro) {
      const density = TYPE_DENSITIES[type];
      if (!density) return 0;
      const densityKey = { protein: 'p_per_g', carbs: 'c_per_g', fat: 'f_per_g' }[macro];
      return adjusted
        .filter((ing) => (ing.type || '').toLowerCase() === type)
        .reduce((sum, ing) => sum + ing.grams * density[densityKey], 0);
    }
  
    // Helper: apply a scale factor to all ingredients of a given type
    function scaleType(type, factor) {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, factor));
      scaleFactors[type] = Math.round(clamped * 100) / 100;
  
      const bounds = PORTION_BOUNDS[type] || { min: 0, max: 500 };
  
      adjusted = adjusted.map((ing) => {
        if ((ing.type || '').toLowerCase() !== type) return ing;
        const newGrams = Math.round(ing.grams * clamped);
        return {
          ...ing,
          grams: Math.max(bounds.min, Math.min(bounds.max, newGrams)),
        };
      });
    }
  
    // Step 1: Scale protein sources to hit protein target
    const proteinFromProteinType = typeMacroContribution('protein', 'protein');
    if (proteinFromProteinType > 0 && target.protein > 0) {
      const proteinScale = target.protein / proteinFromProteinType;
      scaleType('protein', proteinScale);
    }
  
    // Step 2: Scale carb sources to hit carb target
    // Account for protein sources' carb contribution after scaling
    const carbsFromProtein = typeMacroContribution('protein', 'carbs');
    const carbsFromVeg = typeMacroContribution('vegetable', 'carbs');
    const carbsFromCarbs = typeMacroContribution('carb', 'carbs');
    const carbsNeededFromCarbs = target.carbs - carbsFromProtein - carbsFromVeg;
  
    if (carbsFromCarbs > 0 && carbsNeededFromCarbs > 0) {
      const carbScale = carbsNeededFromCarbs / carbsFromCarbs;
      scaleType('carb', carbScale);
    }
  
    // Step 3: Scale fat sources to hit fat target
    // Account for fat from protein and carb sources after scaling
    const fatFromProtein = typeMacroContribution('protein', 'fat');
    const fatFromCarbs = typeMacroContribution('carb', 'fat');
    const fatFromVeg = typeMacroContribution('vegetable', 'fat');
    const fatFromFat = typeMacroContribution('fat', 'fat');
    const fatNeededFromFat = target.fat - fatFromProtein - fatFromCarbs - fatFromVeg;
  
    if (fatFromFat > 0 && fatNeededFromFat > 0) {
      const fatScale = fatNeededFromFat / fatFromFat;
      scaleType('fat', fatScale);
    }
  
    // Recompute final macros after all adjustments
    const finalMacros = computeMacros(adjusted);
  
    return {
      ingredients: adjusted,
      macros: finalMacros,
      scaled: true,
      scaleFactors,
    };
  }
  
  // ─── Convenience: Full Pipeline ──────────────────────────────────────────────
  
  /**
   * Full pipeline: compute macros from AI-returned ingredients, optionally
   * scale to hit targets.
   *
   * @param {Array<{ name, type, grams }>} ingredients - from OpenAI response
   * @param {{ protein, carbs, fat, calories }|null} target - meal macro budget (null to skip scaling)
   * @returns {{
   *   ingredients: Array<{ name, type, grams, originalGrams? }>,
   *   macros: { protein, carbs, fat, calories },
   *   scaled: boolean,
   *   scaleFactors: object
   * }}
   */
  export function estimateAndAdjust(ingredients, target = null) {
    if (!ingredients || ingredients.length === 0) {
      return {
        ingredients: [],
        macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        scaled: false,
        scaleFactors: {},
      };
    }
  
    // If no target provided, just compute macros (user-entered meal flow)
    if (!target) {
      const macros = computeMacros(ingredients);
      return {
        ingredients: ingredients.map((ing) => ({ ...ing })),
        macros,
        scaled: false,
        scaleFactors: {},
      };
    }
  
    // Otherwise, compute + scale
    return adjustPortions(ingredients, target);
  }
  
  // ─── Exported Constants (for testing / debugging) ────────────────────────────
  
  export { TYPE_DENSITIES, MIN_SCALE, MAX_SCALE, PORTION_BOUNDS };