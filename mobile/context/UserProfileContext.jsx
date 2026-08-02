import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchPersonalInfo, saveUserProfile } from '../../shared/lib/dataClient';
import { useAuth } from './AuthContext';
import { useStaleAppStateRevalidate } from './dataCacheUtils';

const EMPTY_PROFILE = {
  name: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  goal: '',
  activityLevel: '',
  objective: '',
  dietaryRestrictions: '',
};

const UserProfileStateContext = createContext(null);
const UserProfileActionsContext = createContext(null);

const mapPersonalInfoToProfile = (personalInfo) => {
  const up = personalInfo?.userProfile;
  if (!up) return EMPTY_PROFILE;
  return {
    name: up.name || '',
    age: up.age ? String(up.age) : '',
    gender: up.gender || '',
    height: up.height || '',
    weight: up.weight || '',
    goal: up.goal || '',
    activityLevel: up.activity_level || '',
    objective: up.objective || '',
    dietaryRestrictions: up.dietary_restrictions || '',
  };
};

const initialLoadingFor = (userId, isGuest) => Boolean(userId && !isGuest);

export function UserProfileProvider({ children }) {
  const { user, isGuest } = useAuth();
  const userId = user?.id ?? null;

  const [cacheKey, setCacheKey] = useState(userId);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [foodPreferences, setFoodPreferences] = useState(null);
  const [rawUserProfile, setRawUserProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(() => initialLoadingFor(userId, isGuest));
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const hasDataRef = useRef(false);
  const lastFetchedAtRef = useRef(null);
  const inflightRef = useRef(null);
  const profileRef = useRef(profile);
  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);

  userRef.current = user;
  isGuestRef.current = isGuest;
  profileRef.current = profile;
  hasDataRef.current = hasData;
  lastFetchedAtRef.current = lastFetchedAt;

  if (cacheKey !== userId) {
    setCacheKey(userId);
    setProfile(EMPTY_PROFILE);
    setFoodPreferences(null);
    setRawUserProfile(null);
    setIsSaving(false);
    setLoadingProfile(initialLoadingFor(userId, isGuest));
    setIsValidating(false);
    setError(null);
    setHasData(false);
    setLastFetchedAt(null);
    hasDataRef.current = false;
    lastFetchedAtRef.current = null;
    inflightRef.current = null;
  }

  const loadProfile = useCallback(async ({ background = false } = {}) => {
    const uid = userRef.current?.id;
    const guest = isGuestRef.current;

    if (!uid || guest) {
      setProfile(EMPTY_PROFILE);
      setFoodPreferences(null);
      setRawUserProfile(null);
      setLoadingProfile(false);
      setIsValidating(false);
      setError(null);
      setHasData(false);
      hasDataRef.current = false;
      return;
    }

    if (inflightRef.current) {
      console.log('UserProfileProvider: dedup — joining in-flight request');
      return inflightRef.current;
    }

    const alreadyHasData = hasDataRef.current;
    if (alreadyHasData || background) {
      setIsValidating(true);
    } else {
      setLoadingProfile(true);
    }

    const promise = (async () => {
      try {
        console.log('UserProfileProvider: fetching profile', { userId: uid });
        const personalInfo = await fetchPersonalInfo(uid);
        if (userRef.current?.id !== uid) return;

        setProfile(mapPersonalInfoToProfile(personalInfo));
        setFoodPreferences(personalInfo?.foodPreferences || null);
        setRawUserProfile(personalInfo?.userProfile || null);
        setError(null);
        setHasData(true);
        hasDataRef.current = true;
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      } catch (e) {
        console.error('UserProfileProvider: error fetching profile', e);
        if (userRef.current?.id !== uid) return;
        setError(e?.message || 'Failed to load profile');
        // Do not clear displayed profile when we already have data.
        if (!hasDataRef.current) {
          setProfile(EMPTY_PROFILE);
          setFoodPreferences(null);
          setRawUserProfile(null);
        }
      } finally {
        if (userRef.current?.id === uid) {
          setLoadingProfile(false);
          setIsValidating(false);
        }
        if (inflightRef.current === promise) {
          inflightRef.current = null;
        }
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, []);

  const refetchProfile = useCallback(() => {
    setError(null);
    return loadProfile({ background: hasDataRef.current });
  }, [loadProfile]);

  useEffect(() => {
    if (!userId || isGuest) {
      setLoadingProfile(false);
      setIsValidating(false);
      return undefined;
    }
    loadProfile({ background: false });
    return undefined;
  }, [userId, isGuest, loadProfile]);

  useStaleAppStateRevalidate(loadProfile, lastFetchedAtRef, Boolean(userId && !isGuest));

  const updateProfile = useCallback((field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveProfile = useCallback(async () => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return { error: 'Not authenticated' };

    const current = profileRef.current;
    setIsSaving(true);
    try {
      console.log('UserProfileProvider: saving profile', {
        userId: u.id,
        profile: current,
      });

      const { error: saveError } = await saveUserProfile(u.id, {
        name: current.name,
        age: current.age,
        gender: current.gender,
        height: current.height,
        weight: current.weight,
        goal: current.goal,
        activityLevel: current.activityLevel,
        objective: current.objective,
        dietaryRestrictions: current.dietaryRestrictions,
      });

      if (saveError) {
        console.error('UserProfileProvider: save error', saveError);
        return { error: saveError.message || 'Failed to save profile' };
      }

      return { error: null };
    } catch (e) {
      console.error('UserProfileProvider: save exception', e);
      return { error: e.message || 'Unknown error' };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const stateValue = useMemo(
    () => ({
      profile,
      foodPreferences,
      /** DB-shaped profile for generation APIs (may be null). */
      rawUserProfile,
      isSaving,
      loadingProfile,
      /** Alias: true only when there is no profile data to show yet. */
      isLoading: loadingProfile,
      isValidating,
      error,
      hasData,
    }),
    [
      profile,
      foodPreferences,
      rawUserProfile,
      isSaving,
      loadingProfile,
      isValidating,
      error,
      hasData,
    ]
  );

  const actionsValue = useMemo(
    () => ({
      updateProfile,
      saveProfile,
      refetchProfile,
      refreshProfile: refetchProfile,
    }),
    [updateProfile, saveProfile, refetchProfile]
  );

  return (
    <UserProfileActionsContext.Provider value={actionsValue}>
      <UserProfileStateContext.Provider value={stateValue}>
        {children}
      </UserProfileStateContext.Provider>
    </UserProfileActionsContext.Provider>
  );
}

export function useUserProfileState() {
  const ctx = useContext(UserProfileStateContext);
  if (!ctx) {
    throw new Error('useUserProfileState must be used within UserProfileProvider');
  }
  return ctx;
}

export function useUserProfileActions() {
  const ctx = useContext(UserProfileActionsContext);
  if (!ctx) {
    throw new Error('useUserProfileActions must be used within UserProfileProvider');
  }
  return ctx;
}
