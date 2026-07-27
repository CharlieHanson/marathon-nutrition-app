import { useTrainingPlanActions, useTrainingPlanState } from '../context/TrainingPlanContext';

/**
 * Shared training-plan API (backed by TrainingPlanProvider).
 * Signature preserved for existing callers.
 */
export const useTrainingPlan = (_user, _isGuest) => {
  const state = useTrainingPlanState();
  const actions = useTrainingPlanActions();

  return {
    plan: state.plan,
    currentPlanId: state.currentPlanId,
    currentPlanName: state.currentPlanName,
    isLoadedSavedPlan: state.isLoadedSavedPlan,
    savedPlans: state.savedPlans,
    updatePlan: actions.updatePlan,
    savePlan: actions.savePlan,
    loadPlan: actions.loadPlan,
    deletePlan: actions.deletePlan,
    createNewPlan: actions.createNewPlan,
    loadSavedPlans: actions.loadSavedPlans,
    isSaving: state.isSaving,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    fetchError: state.fetchError,
    clearFetchError: actions.clearFetchError,
    refetchTrainingPlan: actions.refetchTrainingPlan,
  };
};
