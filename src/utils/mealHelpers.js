/** Helpers shared by the web dashboard (aligned with mobile/utils/mealHelpers). */

/** Trailing macros block; starts at `(` so name trailing spaces are preserved. */
const MEAL_MACRO_SUFFIX_RE =
  /\(\s*Cal:\s*\d+\s*,\s*P:\s*\d+g\s*,\s*C:\s*\d+g\s*,\s*F:\s*\d+g\s*\)\s*$/i;

/**
 * Format is `${name} (Cal: …)`. Split so intentional trailing spaces in `name` survive
 * (controlled meal editors need them while typing).
 */
export const splitMealNameAndMacros = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', macroSuffix: null };
  }
  const macroSuffixMatch = mealString.match(MEAL_MACRO_SUFFIX_RE);
  if (!macroSuffixMatch) {
    return { name: mealString, macroSuffix: null };
  }
  let name = mealString.slice(0, macroSuffixMatch.index);
  // Drop the single spacer written by formatMealWithMacros before `(`.
  if (name.endsWith(' ')) {
    name = name.slice(0, -1);
  }
  return { name, macroSuffix: macroSuffixMatch[0] };
};

export const parseMeal = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const calMatch = mealString.match(/Cal:\s*(\d+)/);
  const proteinMatch = mealString.match(/P:\s*(\d+)g/);
  const carbsMatch = mealString.match(/C:\s*(\d+)g/);
  const fatMatch = mealString.match(/F:\s*(\d+)g/);
  const { name } = splitMealNameAndMacros(mealString);

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
