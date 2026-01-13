// shared/lib/mealSuggestions.js
// Helper functions for meal variety and rotation
// These handle the "state tracking" that LLMs are bad at

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Common proteins to detect in meal descriptions
const PROTEINS = [
  'chicken', 'beef', 'pork', 'salmon', 'cod', 'tilapia', 'shrimp', 'tuna',
  'turkey', 'lamb', 'tofu', 'tempeh', 'eggs', 'fish', 'steak', 'ground beef',
  'sausage', 'bacon', 'ham', 'duck', 'venison', 'bison', 'crab', 'lobster',
  'scallops', 'mussels', 'clams', 'oysters', 'sardines', 'trout', 'halibut',
  'mahi', 'sea bass', 'snapper'
];

// Lunch types
const LUNCH_TYPES = ['wrap', 'sandwich', 'salad', 'bowl', 'pasta', 'soup', 'burrito', 'tacos', 'stir fry', 'grain bowl'];

// Breakfast types
const BREAKFAST_TYPES = ['omelette', 'scramble', 'burrito', 'yogurt', 'granola', 'cereal', 'smoothie', 'overnight oats', 'pancakes', 'waffles', 'toast', 'eggs', 'breakfast bowl', 'parfait', 'muffin'];

// Snack types
const SNACK_TYPES = ['nuts', 'vegetables', 'hummus', 'protein bar', 'fruit', 'cheese', 'crackers', 'trail mix', 'jerky', 'smoothie', 'yogurt', 'popcorn', 'edamame'];

// Dessert categories (from existing code)
const DESSERT_CATEGORIES = ['baked', 'frozen', 'chocolate', 'fruit', 'pastry/cream'];

// Cuisine types for dinner variety
const CUISINES = ['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian', 'Thai', 'Japanese', 'Chinese', 'Greek', 'French', 'Korean', 'Vietnamese', 'Middle Eastern'];

/* ---------------------- Extraction helpers ---------------------- */

// Extract protein from meal description
function extractProtein(mealDescription) {
  if (!mealDescription || typeof mealDescription !== 'string') return null;
  const lower = mealDescription.toLowerCase();
  
  for (const protein of PROTEINS) {
    if (lower.includes(protein)) {
      return protein;
    }
  }
  return null;
}

// Extract lunch type from meal description
function extractLunchType(mealDescription) {
  if (!mealDescription || typeof mealDescription !== 'string') return null;
  const lower = mealDescription.toLowerCase();
  
  for (const type of LUNCH_TYPES) {
    if (lower.includes(type)) {
      return type;
    }
  }
  return null;
}

// Extract breakfast type from meal description
function extractBreakfastType(mealDescription) {
  if (!mealDescription || typeof mealDescription !== 'string') return null;
  const lower = mealDescription.toLowerCase();
  
  for (const type of BREAKFAST_TYPES) {
    if (lower.includes(type)) {
      return type;
    }
  }
  return null;
}

// Extract snack type from meal description
function extractSnackType(mealDescription) {
  if (!mealDescription || typeof mealDescription !== 'string') return null;
  const lower = mealDescription.toLowerCase();
  
  for (const type of SNACK_TYPES) {
    if (lower.includes(type)) {
      return type;
    }
  }
  return null;
}

// Detect dessert category
function extractDessertCategory(mealDescription) {
  if (!mealDescription || typeof mealDescription !== 'string') return null;
  const lower = mealDescription.toLowerCase();
  
  if (/\b(brownie|cake|tart|crumble|cookie|bar|muffin|baked)\b/.test(lower)) return 'baked';
  if (/\b(ice cream|gelato|sorbet|frozen|popsicle|semifreddo)\b/.test(lower)) return 'frozen';
  if (/\b(chocolate|cocoa|ganache|truffle|lava)\b/.test(lower)) return 'chocolate';
  if (/\b(berry|berries|fruit|apple|pear|peach|banana|citrus)\b/.test(lower)) return 'fruit';
  if (/\b(custard|panna cotta|cream|mousse|tiramisu|pastry)\b/.test(lower)) return 'pastry/cream';
  
  return null;
}

// Extract liked proteins from preferences
function extractLikedProteins(likes) {
  if (!likes || typeof likes !== 'string') return [];
  const lower = likes.toLowerCase();
  return PROTEINS.filter(p => lower.includes(p));
}

// Extract disliked proteins from preferences
function extractDislikedProteins(dislikes) {
  if (!dislikes || typeof dislikes !== 'string') return [];
  const lower = dislikes.toLowerCase();
  return PROTEINS.filter(p => lower.includes(p));
}

/* ---------------------- Count helpers ---------------------- */

// Count protein occurrences in existing meals
function countProteins(existingMeals, mealType) {
  const counts = {};
  
  for (const day of DAYS) {
    const meal = existingMeals?.[day]?.[mealType];
    const protein = extractProtein(meal);
    if (protein) {
      counts[protein] = (counts[protein] || 0) + 1;
    }
  }
  
  return counts;
}

// Count type occurrences
function countTypes(existingMeals, mealType, extractFn) {
  const counts = {};
  
  for (const day of DAYS) {
    const meal = existingMeals?.[day]?.[mealType];
    const type = extractFn(meal);
    if (type) {
      counts[type] = (counts[type] || 0) + 1;
    }
  }
  
  return counts;
}

// Get meals from days before the target day
function getMealsBefore(existingMeals, targetDay, mealType) {
  const targetIndex = DAYS.indexOf(targetDay);
  const meals = [];
  
  for (let i = 0; i < targetIndex; i++) {
    const meal = existingMeals?.[DAYS[i]]?.[mealType];
    if (meal && typeof meal === 'string' && meal.trim()) {
      meals.push({ day: DAYS[i], meal });
    }
  }
  
  return meals;
}

// Get yesterday's meal (for "don't repeat yesterday" logic)
function getYesterdaysMeal(existingMeals, targetDay, mealType) {
  const targetIndex = DAYS.indexOf(targetDay);
  if (targetIndex <= 0) return null;
  
  const yesterdayMeal = existingMeals?.[DAYS[targetIndex - 1]]?.[mealType];
  return yesterdayMeal && typeof yesterdayMeal === 'string' && yesterdayMeal.trim() 
    ? yesterdayMeal 
    : null;
}

/* ---------------------- Selection helpers ---------------------- */

// Pick from array avoiding items
function pickAvoiding(options, avoid, count = 1) {
  const available = options.filter(o => !avoid.includes(o));
  if (available.length === 0) return options.slice(0, count);
  
  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Weighted random selection favoring less-used options
function pickLeastUsed(options, counts, avoid = []) {
  const available = options.filter(o => !avoid.includes(o));
  if (available.length === 0) return options[0] || null;
  
  // Sort by count ascending (least used first)
  const sorted = available.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  
  // Pick from the least used (with some randomness)
  const leastUsedCount = counts[sorted[0]] || 0;
  const leastUsed = sorted.filter(o => (counts[o] || 0) === leastUsedCount);
  
  return leastUsed[Math.floor(Math.random() * leastUsed.length)];
}

/* ---------------------- Main suggestion functions ---------------------- */

/**
 * Get dinner suggestion with protein and cuisine rotation
 */
export function getDinnerSuggestion(targetDay, existingMeals, foodPreferences) {
  const likedProteins = extractLikedProteins(foodPreferences?.likes);
  const dislikedProteins = extractDislikedProteins(foodPreferences?.dislikes);
  const proteinCounts = countProteins(existingMeals, 'dinner');
  
  const yesterdaysDinner = getYesterdaysMeal(existingMeals, targetDay, 'dinner');
  const yesterdaysProtein = extractProtein(yesterdaysDinner);
  
  // Build avoid list
  const avoid = [...dislikedProteins];
  if (yesterdaysProtein) avoid.push(yesterdaysProtein);
  
  // Add proteins that have been used 2+ times
  for (const [protein, count] of Object.entries(proteinCounts)) {
    if (count >= 2 && !avoid.includes(protein)) {
      avoid.push(protein);
    }
  }
  
  let selectedProtein;
  
  if (likedProteins.length >= 4) {
    // Pick from liked proteins, preferring least used
    selectedProtein = pickLeastUsed(likedProteins, proteinCounts, avoid);
  } else if (likedProteins.length >= 2) {
    // Each liked protein can appear twice, pick least used
    const availableLiked = likedProteins.filter(p => (proteinCounts[p] || 0) < 2 && !avoid.includes(p));
    if (availableLiked.length > 0) {
      selectedProtein = pickLeastUsed(availableLiked, proteinCounts, avoid);
    } else {
      // Fall back to any protein not disliked
      const allOptions = PROTEINS.filter(p => !dislikedProteins.includes(p));
      selectedProtein = pickLeastUsed(allOptions, proteinCounts, avoid);
    }
  } else if (likedProteins.length === 1) {
    // Single liked protein can appear 3 times
    const liked = likedProteins[0];
    if ((proteinCounts[liked] || 0) < 3 && !avoid.includes(liked)) {
      selectedProtein = liked;
    } else {
      const allOptions = PROTEINS.filter(p => !dislikedProteins.includes(p));
      selectedProtein = pickLeastUsed(allOptions, proteinCounts, avoid);
    }
  } else {
    // No preferences - pick any, no more than 2x each
    const allOptions = PROTEINS.filter(p => !dislikedProteins.includes(p));
    selectedProtein = pickLeastUsed(allOptions, proteinCounts, avoid);
  }
  
  // Extract used proteins to avoid in prompt
  const usedProteins = Object.keys(proteinCounts).filter(p => proteinCounts[p] >= 2);
  
  return {
    protein: selectedProtein,
    avoid: [...new Set([...avoid, ...usedProteins])].filter(p => p !== selectedProtein),
    proteinCounts,
  };
}

/**
 * Get lunch suggestion with type and protein rotation
 */
export function getLunchSuggestion(targetDay, existingMeals, foodPreferences) {
  const likedProteins = extractLikedProteins(foodPreferences?.likes);
  const dislikedProteins = extractDislikedProteins(foodPreferences?.dislikes);
  
  const typeCounts = countTypes(existingMeals, 'lunch', extractLunchType);
  const proteinCounts = countProteins(existingMeals, 'lunch');
  
  const yesterdaysLunch = getYesterdaysMeal(existingMeals, targetDay, 'lunch');
  const yesterdaysType = extractLunchType(yesterdaysLunch);
  const yesterdaysProtein = extractProtein(yesterdaysLunch);
  
  // Pick type - avoid yesterday's and anything with 3+ uses
  const avoidTypes = [];
  if (yesterdaysType) avoidTypes.push(yesterdaysType);
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= 3) avoidTypes.push(type);
  }
  
  const selectedType = pickLeastUsed(LUNCH_TYPES, typeCounts, avoidTypes);
  
  // Pick protein - similar logic to dinner
  const avoidProteins = [...dislikedProteins];
  if (yesterdaysProtein) avoidProteins.push(yesterdaysProtein);
  
  const proteinOptions = likedProteins.length > 0 ? likedProteins : PROTEINS;
  const selectedProtein = pickLeastUsed(
    proteinOptions.filter(p => !dislikedProteins.includes(p)),
    proteinCounts,
    avoidProteins
  );
  
  return {
    type: selectedType,
    protein: selectedProtein,
    avoid: avoidTypes,
    avoidProteins: avoidProteins.filter(p => p !== selectedProtein),
    typeCounts,
    proteinCounts,
  };
}

/**
 * Get breakfast suggestion with type variety
 */
export function getBreakfastSuggestion(targetDay, existingMeals, foodPreferences) {
  const typeCounts = countTypes(existingMeals, 'breakfast', extractBreakfastType);
  
  const yesterdaysBreakfast = getYesterdaysMeal(existingMeals, targetDay, 'breakfast');
  const yesterdaysType = extractBreakfastType(yesterdaysBreakfast);
  
  // Avoid yesterday's type and anything with 2+ uses
  const avoidTypes = [];
  if (yesterdaysType) avoidTypes.push(yesterdaysType);
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= 2) avoidTypes.push(type);
  }
  
  const selectedType = pickLeastUsed(BREAKFAST_TYPES, typeCounts, avoidTypes);
  
  return {
    type: selectedType,
    avoid: avoidTypes,
    yesterdaysType,
    typeCounts,
  };
}

/**
 * Get snack suggestion with variety
 */
export function getSnackSuggestion(targetDay, existingMeals, foodPreferences) {
  const typeCounts = countTypes(existingMeals, 'snacks', extractSnackType);
  
  const yesterdaysSnack = getYesterdaysMeal(existingMeals, targetDay, 'snacks');
  const yesterdaysType = extractSnackType(yesterdaysSnack);
  
  // Avoid yesterday's type and anything with 3+ uses
  const avoidTypes = [];
  if (yesterdaysType) avoidTypes.push(yesterdaysType);
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= 3) avoidTypes.push(type);
  }
  
  const selectedType = pickLeastUsed(SNACK_TYPES, typeCounts, avoidTypes);
  
  return {
    type: selectedType,
    avoid: avoidTypes,
    typeCounts,
  };
}

/**
 * Get dessert suggestion with category rotation
 */
export function getDessertSuggestion(targetDay, existingMeals, foodPreferences) {
  const categoryCounts = {};
  
  for (const day of DAYS) {
    const meal = existingMeals?.[day]?.dessert;
    const category = extractDessertCategory(meal);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }
  
  // Find unused categories first
  const unusedCategories = DESSERT_CATEGORIES.filter(c => !categoryCounts[c]);
  
  let selectedCategory;
  if (unusedCategories.length > 0) {
    selectedCategory = unusedCategories[Math.floor(Math.random() * unusedCategories.length)];
  } else {
    // Pick least used
    selectedCategory = pickLeastUsed(DESSERT_CATEGORIES, categoryCounts, []);
  }
  
  // Avoid categories with 2+ uses
  const avoidCategories = Object.entries(categoryCounts)
    .filter(([_, count]) => count >= 2)
    .map(([cat]) => cat);
  
  return {
    category: selectedCategory,
    avoid: avoidCategories,
    categoryCounts,
  };
}

/**
 * Get training context for a day (with peek at tomorrow)
 */
export async function getTrainingContext(userId, targetDay) {
  if (!userId) return { today: null, tomorrow: null };
  
  try {
    const { data: activePlan } = await supabase
      .from('training_plans')
      .select('plan_data')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!activePlan?.plan_data) return { today: null, tomorrow: null };
    
    const planData = activePlan.plan_data;
    const targetIndex = DAYS.indexOf(targetDay);
    const tomorrowIndex = (targetIndex + 1) % 7;
    
    const extractWorkout = (dayData) => {
      if (!dayData?.workouts?.length) return { type: 'Rest', distance: '', intensity: 'Medium' };
      
      const workouts = dayData.workouts;
      const nonRest = workouts.filter(w => (w.type || '').toLowerCase() !== 'rest');
      const chosen = nonRest[0] || workouts[0];
      
      return {
        type: chosen.type || 'Rest',
        distance: chosen.distance || '',
        intensity: chosen.intensity || 'Medium',
      };
    };
    
    return {
      today: extractWorkout(planData[targetDay]),
      tomorrow: extractWorkout(planData[DAYS[tomorrowIndex]]),
    };
  } catch (error) {
    console.error('Error fetching training context:', error);
    return { today: null, tomorrow: null };
  }
}

/**
 * Get all suggestions for a day
 */
export async function getDaySuggestions(userId, targetDay, existingMeals, foodPreferences) {
  const training = await getTrainingContext(userId, targetDay);
  
  return {
    breakfast: getBreakfastSuggestion(targetDay, existingMeals, foodPreferences),
    lunch: getLunchSuggestion(targetDay, existingMeals, foodPreferences),
    dinner: getDinnerSuggestion(targetDay, existingMeals, foodPreferences),
    snacks: getSnackSuggestion(targetDay, existingMeals, foodPreferences),
    dessert: getDessertSuggestion(targetDay, existingMeals, foodPreferences),
    training,
  };
}

// Export constants for use elsewhere
export { DAYS, PROTEINS, LUNCH_TYPES, BREAKFAST_TYPES, SNACK_TYPES, DESSERT_CATEGORIES, CUISINES };