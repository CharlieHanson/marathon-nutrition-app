import { useEffect, useRef } from 'react';
import { useUserProfileActions, useUserProfileState } from '../context/UserProfileContext';

/**
 * Shared user-profile API (backed by UserProfileProvider).
 * Signature preserved for existing callers.
 */
export const useUserProfile = (_user, _isGuest, reloadKey = 0) => {
  const state = useUserProfileState();
  const actions = useUserProfileActions();
  const prevReloadKey = useRef(reloadKey);

  useEffect(() => {
    if (prevReloadKey.current === reloadKey) return;
    prevReloadKey.current = reloadKey;
    actions.refetchProfile();
  }, [reloadKey, actions]);

  return {
    profile: state.profile,
    foodPreferences: state.foodPreferences,
    rawUserProfile: state.rawUserProfile,
    updateProfile: actions.updateProfile,
    saveProfile: actions.saveProfile,
    refreshProfile: actions.refreshProfile,
    isSaving: state.isSaving,
    loadingProfile: state.loadingProfile,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    error: state.error,
  };
};
