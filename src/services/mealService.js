// Meal-related utility functions

/**
 * Calculate total macros for a day's meals
 */
export const calculateDayMacros = (dayMeals) => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let hasData = false;

  Object.values(dayMeals).forEach((meal) => {
    if (typeof meal !== 'string' || !meal) return;
    
    // Parse macros from meal string (format: "Meal name (Cal: 350, P: 15g, C: 45g, F: 8g)")
    const calMatch = meal.match(/Cal:\s*(\d+)/);
    const proteinMatch = meal.match(/P:\s*(\d+)g/);
    const carbsMatch = meal.match(/C:\s*(\d+)g/);
    const fatMatch = meal.match(/F:\s*(\d+)g/);

    if (calMatch) {
      totalCalories += parseInt(calMatch[1]);
      hasData = true;
    }
    if (proteinMatch) totalProtein += parseInt(proteinMatch[1]);
    if (carbsMatch) totalCarbs += parseInt(carbsMatch[1]);
    if (fatMatch) totalFat += parseInt(fatMatch[1]);
  });

  return {
    calories: totalCalories,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    hasData,
  };
};

/**
 * Calculate total macros for entire week
 */
export const calculateWeekMacros = (mealPlan) => {
  let weekTotal = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  Object.values(mealPlan).forEach((day) => {
    const dayMacros = calculateDayMacros(day);
    weekTotal.calories += dayMacros.calories;
    weekTotal.protein += dayMacros.protein;
    weekTotal.carbs += dayMacros.carbs;
    weekTotal.fat += dayMacros.fat;
  });

  return {
    ...weekTotal,
    avgCalories: Math.round(weekTotal.calories / 7),
    avgProtein: Math.round(weekTotal.protein / 7),
    avgCarbs: Math.round(weekTotal.carbs / 7),
    avgFat: Math.round(weekTotal.fat / 7),
  };
};

/**
 * Check if day's macros are within acceptable range
 */
export const validateDayMacros = (dayMacros, targetMacros, tolerance = 0.15) => {
  const caloriesOk = Math.abs(dayMacros.calories - targetMacros.calories) <= 
                     targetMacros.calories * tolerance;
  
  const proteinOk = Math.abs(dayMacros.protein - targetMacros.protein) <= 
                    targetMacros.protein * tolerance;

  return {
    isValid: caloriesOk && proteinOk,
    caloriesOk,
    proteinOk,
    details: {
      caloriesDiff: dayMacros.calories - targetMacros.calories,
      proteinDiff: dayMacros.protein - targetMacros.protein,
    },
  };
};

/**
 * Extract meal name without macros
 */
export const extractMealName = (mealString) => {
  if (!mealString) return '';
  const match = mealString.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : mealString;
};

/**
 * Format meal with macros
 */
export const formatMealWithMacros = (name, macros) => {
  return `${name} (Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
};