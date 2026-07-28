import { useMealCompletionsActions, useMealCompletionsState } from '../context/MealCompletionsContext';

// Get current day of week in lowercase (e.g., 'monday')
const getCurrentDayOfWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon,...
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[day];
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

/**
 * Shared meal-completions API (backed by MealCompletionsProvider).
 * Signature preserved for existing callers.
 */
export const useMealCompletions = (_user, _isGuest) => {
  const state = useMealCompletionsState();
  const actions = useMealCompletionsActions();

  return {
    completions: state.completions,
    loading: state.loading,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    error: state.error,
    toggleMealCompletion: actions.toggleMealCompletion,
    removeMealCompletion: actions.removeMealCompletion,
    completedCount: state.completedCount,
    refetch: actions.refetch,
  };
};

/**
 * Count how many completions exist for a specific day among a given set of active meal types.
 * @param {Array} completions  - array from useMealCompletions
 * @param {string} day         - e.g. 'monday'
 * @param {string[]} activeTypes - UI-key meal types to count
 * @returns {number}
 */
export const getCompletedCountForDay = (completions, day, activeTypes) =>
  completions.filter(
    (c) => c.day_of_week === day && activeTypes.includes(c.meal_type)
  ).length;

export { getCurrentDayOfWeek, getTodayDate, MEAL_TYPES };
