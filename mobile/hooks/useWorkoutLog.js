import {
  useWorkoutLogActions,
  useWorkoutLogState,
} from '../context/WorkoutLogContext';

/**
 * Shared workout-log API (backed by WorkoutLogProvider).
 */
export const useWorkoutLog = (_user, _isGuest) => {
  const state = useWorkoutLogState();
  const actions = useWorkoutLogActions();

  return {
    selectedDate: state.selectedDate,
    weekStarting: state.weekStarting,
    logsByDate: state.logsByDate,
    draftByDate: state.draftByDate,
    isSaving: state.isSaving,
    isLoading: state.isLoading,
    error: state.error,
    updateDayWorkouts: actions.updateDayWorkouts,
    getWorkoutsForDate: actions.getWorkoutsForDate,
    flushPendingSaves: actions.flushPendingSaves,
    setSelectedDate: actions.setSelectedDate,
    loadWeek: actions.loadWeek,
    clearError: actions.clearError,
    goToPreviousWeek: actions.goToPreviousWeek,
    goToNextWeek: actions.goToNextWeek,
  };
};
