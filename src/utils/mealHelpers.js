/** Helpers shared by the web dashboard (aligned with mobile/utils/mealHelpers). */

export const parseMeal = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const calMatch = mealString.match(/Cal:\s*(\d+)/);
  const proteinMatch = mealString.match(/P:\s*(\d+)g/);
  const carbsMatch = mealString.match(/C:\s*(\d+)g/);
  const fatMatch = mealString.match(/F:\s*(\d+)g/);
  const nameMatch = mealString.match(/^(.+?)\s*\(/);
  const name = nameMatch ? nameMatch[1].trim() : mealString;

  return {
    name,
    calories: calMatch ? parseInt(calMatch[1], 10) : 0,
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 0,
    carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 0,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 0,
  };
};

export const getDayMealToggles = (dayMeals) => ({
  includeSnacks: false,
  includeDessert: dayMeals?.include_dessert !== false,
});

export const getActiveMealTypes = ({ includeDessert = true } = {}, dayMeals = null) => {
  const types = ['breakfast', 'lunch', 'dinner'];
  if (dayMeals?.snacks_user_logged === true) {
    types.push('snacks');
  }
  if (includeDessert !== false) types.push('dessert');
  return types;
};

export const calculateDayMacros = (dayMeals) => {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const toggles = getDayMealToggles(dayMeals);
  const activeTypes = getActiveMealTypes(toggles, dayMeals);

  activeTypes.forEach((mealType) => {
    const meal = dayMeals?.[mealType];
    if (meal) {
      const parsed = parseMeal(meal);
      total.calories += parsed.calories;
      total.protein += parsed.protein;
      total.carbs += parsed.carbs;
      total.fat += parsed.fat;
    }
  });

  return total;
};
