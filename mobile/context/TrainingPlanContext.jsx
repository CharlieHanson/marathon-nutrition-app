import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchActiveTrainingPlan,
  fetchAllTrainingPlans,
  saveTrainingPlan,
  setActiveTrainingPlan,
  deleteTrainingPlan,
} from '../../shared/lib/dataClient';
import { useAuth } from './AuthContext';
import { useStaleAppStateRevalidate } from './dataCacheUtils';

const EMPTY_WEEK = {
  monday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  tuesday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  wednesday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  thursday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  friday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  saturday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
  sunday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '' }] },
};

const TrainingPlanStateContext = createContext(null);
const TrainingPlanActionsContext = createContext(null);

const initialLoadingFor = (userId, isGuest) => Boolean(userId && !isGuest);

export function TrainingPlanProvider({ children }) {
  const { user, isGuest } = useAuth();
  const userId = user?.id ?? null;

  const [cacheKey, setCacheKey] = useState(userId);
  const [plan, setPlan] = useState(EMPTY_WEEK);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(() => initialLoadingFor(userId, isGuest));
  const [isValidating, setIsValidating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const currentPlanIdRef = useRef(null);
  const hasDataRef = useRef(false);
  const lastFetchedAtRef = useRef(null);
  const inflightRef = useRef(null);
  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);

  userRef.current = user;
  isGuestRef.current = isGuest;
  currentPlanIdRef.current = currentPlanId;
  hasDataRef.current = hasData;
  lastFetchedAtRef.current = lastFetchedAt;

  // Clear synchronously when userId changes (including logout → null).
  if (cacheKey !== userId) {
    setCacheKey(userId);
    setPlan(EMPTY_WEEK);
    setCurrentPlanId(null);
    setCurrentPlanName('');
    setSavedPlans([]);
    setIsSaving(false);
    setIsLoading(initialLoadingFor(userId, isGuest));
    setIsValidating(false);
    setFetchError(null);
    setHasData(false);
    setLastFetchedAt(null);
    hasDataRef.current = false;
    lastFetchedAtRef.current = null;
    currentPlanIdRef.current = null;
    inflightRef.current = null;
  }

  const mapPlansForEditor = useCallback((plans, loadedPlanId) => {
    return plans.map((p) => ({
      ...p,
      is_active: loadedPlanId != null && p.id === loadedPlanId,
    }));
  }, []);

  const loadActivePlan = useCallback(async ({ background = false } = {}) => {
    const uid = userRef.current?.id;
    const guest = isGuestRef.current;

    if (!uid || guest) {
      setPlan(EMPTY_WEEK);
      setCurrentPlanId(null);
      setCurrentPlanName('');
      setSavedPlans([]);
      setIsLoading(false);
      setIsValidating(false);
      setHasData(false);
      hasDataRef.current = false;
      return;
    }

    if (inflightRef.current) {
      console.log('TrainingPlanProvider: dedup — joining in-flight request');
      return inflightRef.current;
    }

    const alreadyHasData = hasDataRef.current;
    if (alreadyHasData || background) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }

    const promise = (async () => {
      try {
        console.log('TrainingPlanProvider: fetching active plan for', uid);
        const activePlan = await fetchActiveTrainingPlan(uid);

        // Drop stale responses after user switch.
        if (userRef.current?.id !== uid) return;

        if (activePlan) {
          setPlan(activePlan.plan_data || EMPTY_WEEK);
          setCurrentPlanId(activePlan.id);
          setCurrentPlanName(activePlan.name || '');
          currentPlanIdRef.current = activePlan.id;
        } else {
          setPlan(EMPTY_WEEK);
          setCurrentPlanId(null);
          setCurrentPlanName('');
          currentPlanIdRef.current = null;
        }
        setFetchError(null);
        setHasData(true);
        hasDataRef.current = true;
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      } catch (e) {
        console.error('TrainingPlanProvider: load failed', e);
        if (userRef.current?.id !== uid) return;
        setFetchError('Failed to load training plan');
        // Keep displayed data on error when we already have some.
      } finally {
        if (userRef.current?.id === uid) {
          setIsLoading(false);
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

  const refetchTrainingPlan = useCallback(() => {
    setFetchError(null);
    return loadActivePlan({ background: hasDataRef.current });
  }, [loadActivePlan]);

  useEffect(() => {
    if (!userId || isGuest) {
      setIsLoading(false);
      setIsValidating(false);
      return undefined;
    }
    loadActivePlan({ background: false });
    return undefined;
  }, [userId, isGuest, loadActivePlan]);

  useStaleAppStateRevalidate(loadActivePlan, lastFetchedAtRef, Boolean(userId && !isGuest));

  const loadSavedPlans = useCallback(async (loadedPlanId = currentPlanIdRef.current) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return [];
    try {
      const plans = await fetchAllTrainingPlans(u.id);
      setSavedPlans(mapPlansForEditor(plans, loadedPlanId));
      return plans;
    } catch (e) {
      console.error('Load saved plans failed:', e);
      return [];
    }
  }, [mapPlansForEditor]);

  const updatePlan = useCallback((day, field, value) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }, []);

  const savePlan = useCallback(async (planName) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return { error: 'Not authenticated' };
    if (!planName || planName.trim() === '') {
      return { error: 'Plan name is required' };
    }

    setIsSaving(true);
    try {
      const { data, error } = await saveTrainingPlan(
        u.id,
        plan,
        planName.trim(),
        currentPlanIdRef.current
      );

      if (!error && data) {
        setCurrentPlanId(data.id);
        setCurrentPlanName(data.name);
        currentPlanIdRef.current = data.id;
        await loadSavedPlans(data.id);
      }

      return { error };
    } finally {
      setIsSaving(false);
    }
  }, [plan, loadSavedPlans]);

  const loadPlan = useCallback(async (planId) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return { error: 'Not authenticated' };

    setIsLoading(true);
    try {
      const { data, error } = await setActiveTrainingPlan(u.id, planId);

      if (!error && data) {
        setPlan(data.plan_data);
        setCurrentPlanId(data.id);
        setCurrentPlanName(data.name);
        currentPlanIdRef.current = data.id;
        setHasData(true);
        hasDataRef.current = true;
        await loadSavedPlans(data.id);
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  }, [loadSavedPlans]);

  const deletePlan = useCallback(async (planId) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return { error: 'Not authenticated' };

    try {
      const { error } = await deleteTrainingPlan(u.id, planId);

      if (!error) {
        const wasLoadedPlan = planId === currentPlanIdRef.current;
        if (wasLoadedPlan) {
          setPlan(EMPTY_WEEK);
          setCurrentPlanId(null);
          setCurrentPlanName('');
          currentPlanIdRef.current = null;
        }
        await loadSavedPlans(wasLoadedPlan ? null : currentPlanIdRef.current);
      }

      return { error };
    } catch (e) {
      return { error: e };
    }
  }, [loadSavedPlans]);

  const createNewPlan = useCallback(() => {
    setPlan(EMPTY_WEEK);
    setCurrentPlanId(null);
    setCurrentPlanName('');
    currentPlanIdRef.current = null;
    setSavedPlans((prev) => mapPlansForEditor(prev, null));
  }, [mapPlansForEditor]);

  const clearFetchError = useCallback(() => setFetchError(null), []);

  const stateValue = useMemo(
    () => ({
      plan,
      currentPlanId,
      currentPlanName,
      isLoadedSavedPlan: currentPlanId != null,
      savedPlans,
      isSaving,
      isLoading,
      isValidating,
      fetchError,
      error: fetchError,
      hasData,
    }),
    [
      plan,
      currentPlanId,
      currentPlanName,
      savedPlans,
      isSaving,
      isLoading,
      isValidating,
      fetchError,
      hasData,
    ]
  );

  const actionsValue = useMemo(
    () => ({
      updatePlan,
      savePlan,
      loadPlan,
      deletePlan,
      createNewPlan,
      loadSavedPlans,
      clearFetchError,
      refetchTrainingPlan,
    }),
    [
      updatePlan,
      savePlan,
      loadPlan,
      deletePlan,
      createNewPlan,
      loadSavedPlans,
      clearFetchError,
      refetchTrainingPlan,
    ]
  );

  return (
    <TrainingPlanActionsContext.Provider value={actionsValue}>
      <TrainingPlanStateContext.Provider value={stateValue}>
        {children}
      </TrainingPlanStateContext.Provider>
    </TrainingPlanActionsContext.Provider>
  );
}

export function useTrainingPlanState() {
  const ctx = useContext(TrainingPlanStateContext);
  if (!ctx) {
    throw new Error('useTrainingPlanState must be used within TrainingPlanProvider');
  }
  return ctx;
}

export function useTrainingPlanActions() {
  const ctx = useContext(TrainingPlanActionsContext);
  if (!ctx) {
    throw new Error('useTrainingPlanActions must be used within TrainingPlanProvider');
  }
  return ctx;
}
