import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../../shared/lib/supabase.native';
import { useAuth } from './AuthContext';
import { useStaleAppStateRevalidate } from './dataCacheUtils';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealCompletionsStateContext = createContext(null);
const MealCompletionsActionsContext = createContext(null);

const initialLoadingFor = (userId, isGuest) => Boolean(userId && !isGuest);

export function MealCompletionsProvider({ children }) {
  const { user, isGuest } = useAuth();
  const userId = user?.id ?? null;

  const [cacheKey, setCacheKey] = useState(userId);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(() => initialLoadingFor(userId, isGuest));
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const hasDataRef = useRef(false);
  const lastFetchedAtRef = useRef(null);
  const inflightRef = useRef(null);
  const completionsRef = useRef(completions);
  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);

  userRef.current = user;
  isGuestRef.current = isGuest;
  completionsRef.current = completions;
  hasDataRef.current = hasData;
  lastFetchedAtRef.current = lastFetchedAt;

  if (cacheKey !== userId) {
    setCacheKey(userId);
    setCompletions([]);
    setLoading(initialLoadingFor(userId, isGuest));
    setIsValidating(false);
    setError(null);
    setHasData(false);
    setLastFetchedAt(null);
    hasDataRef.current = false;
    lastFetchedAtRef.current = null;
    inflightRef.current = null;
  }

  const fetchCompletions = useCallback(async ({ background = false } = {}) => {
    const uid = userRef.current?.id;
    const guest = isGuestRef.current;

    if (!uid || guest) {
      setCompletions([]);
      setLoading(false);
      setIsValidating(false);
      setHasData(false);
      hasDataRef.current = false;
      return;
    }

    if (inflightRef.current) {
      console.log('MealCompletionsProvider: dedup — joining in-flight request');
      return inflightRef.current;
    }

    const alreadyHasData = hasDataRef.current;
    if (alreadyHasData || background) {
      setIsValidating(true);
    } else {
      setLoading(true);
    }

    const promise = (async () => {
      try {
        const todayDate = getTodayDate();
        const { data, error: fetchError } = await supabase
          .from('meal_completions')
          .select('*')
          .eq('user_id', uid)
          .eq('completion_date', todayDate);

        if (fetchError) throw fetchError;
        if (userRef.current?.id !== uid) return;

        setCompletions(data || []);
        setError(null);
        setHasData(true);
        hasDataRef.current = true;
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      } catch (err) {
        console.error('MealCompletionsProvider: Error fetching meal completions', err);
        if (userRef.current?.id !== uid) return;
        setError(err.message);
        // Keep displayed completions on error when we already have data.
        if (!hasDataRef.current) {
          setCompletions([]);
        }
      } finally {
        if (userRef.current?.id === uid) {
          setLoading(false);
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

  useEffect(() => {
    if (!userId || isGuest) {
      setLoading(false);
      setIsValidating(false);
      return undefined;
    }
    fetchCompletions({ background: false });
    return undefined;
  }, [userId, isGuest, fetchCompletions]);

  useStaleAppStateRevalidate(fetchCompletions, lastFetchedAtRef, Boolean(userId && !isGuest));

  const toggleMealCompletion = useCallback(async (dayOfWeek, mealType) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return;

    try {
      const todayDate = getTodayDate();
      const existing = completionsRef.current.find(
        (c) => c.day_of_week === dayOfWeek && c.meal_type === mealType
      );

      if (existing) {
        const { error: deleteError } = await supabase
          .from('meal_completions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        const { data, error: insertError } = await supabase
          .from('meal_completions')
          .insert({
            user_id: u.id,
            completion_date: todayDate,
            day_of_week: dayOfWeek,
            meal_type: mealType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setCompletions((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Error toggling meal completion:', err);
      setError(err.message);
      fetchCompletions({ background: true });
    }
  }, [fetchCompletions]);

  const removeMealCompletion = useCallback(async (dayOfWeek, mealType) => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return;

    const existing = completionsRef.current.find(
      (c) => c.day_of_week === dayOfWeek && c.meal_type === mealType
    );
    if (!existing) return;

    try {
      const { error: deleteError } = await supabase
        .from('meal_completions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;

      setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
    } catch (err) {
      console.error('Error removing meal completion:', err);
      setError(err.message);
      fetchCompletions({ background: true });
    }
  }, [fetchCompletions]);

  const stateValue = useMemo(
    () => ({
      completions,
      loading,
      isLoading: loading,
      isValidating,
      error,
      completedCount: completions.length,
      hasData,
    }),
    [completions, loading, isValidating, error, hasData]
  );

  const actionsValue = useMemo(
    () => ({
      toggleMealCompletion,
      removeMealCompletion,
      refetch: () => fetchCompletions({ background: hasDataRef.current }),
    }),
    [toggleMealCompletion, removeMealCompletion, fetchCompletions]
  );

  return (
    <MealCompletionsActionsContext.Provider value={actionsValue}>
      <MealCompletionsStateContext.Provider value={stateValue}>
        {children}
      </MealCompletionsStateContext.Provider>
    </MealCompletionsActionsContext.Provider>
  );
}

export function useMealCompletionsState() {
  const ctx = useContext(MealCompletionsStateContext);
  if (!ctx) {
    throw new Error('useMealCompletionsState must be used within MealCompletionsProvider');
  }
  return ctx;
}

export function useMealCompletionsActions() {
  const ctx = useContext(MealCompletionsActionsContext);
  if (!ctx) {
    throw new Error('useMealCompletionsActions must be used within MealCompletionsProvider');
  }
  return ctx;
}
