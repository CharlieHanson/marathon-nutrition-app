/**
 * validateIngredients.js
 * shared/lib/validateIngredients.js
 *
 * Post-AI validation for ingredients:
 *   1. Remove disliked foods that slipped past the prompt
 *   2. Fix common type misclassifications (sauces as "fat", etc.)
 *
 * Used by: generate-day, generate-meals, generate-single-meal,
 *          regenerate-meal, generate-meal-prep, get-recipe
 */

// ─── Type Correction Map ─────────────────────────────────────────────────────
// Keys are lowercase substrings matched against ingredient names.
// Values are the correct type label.

const TYPE_CORRECTIONS = {
    // Sauces the AI often labels as "fat" — they're mostly carbs/sugar
    'teriyaki sauce': 'carb',
    'teriyaki': 'carb',
    'soy sauce': 'carb',
    'hoisin sauce': 'carb',
    'hoisin': 'carb',
    'bbq sauce': 'carb',
    'barbecue sauce': 'carb',
    'ketchup': 'carb',
    'honey': 'carb',
    'maple syrup': 'carb',
    'agave': 'carb',
    'sugar': 'carb',
    'brown sugar': 'carb',
    'sriracha': 'carb',
    'hot sauce': 'carb',
    'sweet chili sauce': 'carb',
    'fish sauce': 'carb',
    'oyster sauce': 'carb',
    'tomato sauce': 'vegetable',
    'marinara': 'vegetable',
    'salsa': 'vegetable',
    'pesto': 'fat',
  
    // Foods the AI sometimes mistypes
    'avocado': 'fat',
    'cheese': 'protein',
    'cheddar': 'protein',
    'mozzarella': 'protein',
    'parmesan': 'protein',
    'cream cheese': 'protein',
    'hummus': 'protein',
    'beans': 'protein',
    'black beans': 'protein',
    'kidney beans': 'protein',
    'chickpeas': 'protein',
    'lentils': 'protein',
    'edamame': 'protein',
    'chia seeds': 'fat',
    'flax seeds': 'fat',
    'coconut milk': 'fat',
    'coconut cream': 'fat',
    'Greek yogurt': 'protein',
    'yogurt': 'protein',
  };
  
  /**
   * Remove ingredients that match the user's disliked foods list.
   *
   * Uses bidirectional substring matching:
   *   - "potato" in dislikes catches "Cooked Potatoes" in ingredients
   *   - "potatoes" in dislikes catches "Potato" in ingredients
   *
   * @param {Array} ingredients - [{ name, type, grams }]
   * @param {string} dislikes - Comma-separated disliked foods (from foodPreferences.dislikes)
   * @param {string} dietaryRestrictions - Comma-separated restrictions (from userProfile)
   * @returns {Array} Filtered ingredients with disliked items removed
   */
  export function filterDislikedFoods(ingredients, dislikes = '', dietaryRestrictions = '') {
    const banned = [
      ...dislikes.toLowerCase().split(','),
      ...dietaryRestrictions.toLowerCase().split(','),
    ]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  
    if (banned.length === 0) return ingredients;
  
    return ingredients.filter((ing) => {
      const nameLower = ing.name.toLowerCase();
      const isBanned = banned.some(
        (b) => nameLower.includes(b) || b.includes(nameLower)
      );
      if (isBanned) {
        console.warn(`⚠️ Removed disliked/restricted ingredient: "${ing.name}"`);
      }
      return !isBanned;
    });
  }
  
  /**
   * Fix common type misclassifications from the AI.
   * Mutates the ingredients array in place.
   *
   * @param {Array} ingredients - [{ name, type, grams }]
   * @returns {Array} Same array with corrected types
   */
  export function correctIngredientTypes(ingredients) {
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase();
      for (const [pattern, correctType] of Object.entries(TYPE_CORRECTIONS)) {
        if (key.includes(pattern) && ing.type !== correctType) {
          console.log(`🔧 Type fix: "${ing.name}" ${ing.type} → ${correctType}`);
          ing.type = correctType;
          break;
        }
      }
    }
    return ingredients;
  }
  
  /**
   * Run both validations in sequence. Convenience wrapper.
   *
   * @param {Array} ingredients - [{ name, type, grams }]
   * @param {string} dislikes
   * @param {string} dietaryRestrictions
   * @returns {Array} Cleaned + corrected ingredients
   */
  export function validateIngredients(ingredients, dislikes = '', dietaryRestrictions = '') {
    const filtered = filterDislikedFoods(ingredients, dislikes, dietaryRestrictions);
    return correctIngredientTypes(filtered);
  }