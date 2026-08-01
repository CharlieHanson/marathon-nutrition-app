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
  fetchWorkoutLogsForRange,
  upsertWorkoutLog,
  deleteWorkoutLog,
  getLocalDateString,
} from '../../shared/lib/dataClient';
import { getMondayOfCurrentWeek, getNextWeek, getPreviousWeek } from '../utils/mealHelpers';
import { useAuth } from './AuthContext';
import { useStaleAppStateRevalidate } from './dataCacheUtils';

const DEBOUNCE_MS = 600;

const WorkoutLogStateContext = createContext(null);
const WorkoutLogActionsContext = createContext(null);

const initialLoadingFor = (userId, isGuest) => Boolean(userId && !isGuest);

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function filterMeaningfulWorkouts(workouts) {
  if (!Array.isArray(workouts)) return [];
  return workouts.filter((w) => typeof w?.type === 'string' && w.type.trim() !== '');
}

export function WorkoutLogProvider({ children }) {
  const { user, isGuest } = useAuth();
  const userId = user?.id ?? null;

  const [weekStarting, setWeekStarting] = useState(() => getMondayOfCurrentWeek());
  const [selectedDate, setSelectedDateState] = useState(() => getLocalDateString());
  const [logsByDate, setLogsByDate] = useState({});
  const [draftByDate, setDraftByDate] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(() => initialLoadingFor(userId, isGuest));
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const debounceTimersRef = useRef(new Map());
  const pendingPayloadRef = useRef(new Map());
  const streakFiredForDatesRef = useRef(new Set());
  const logsByDateRef = useRef(logsByDate);
  const lastFetchedAtRef = useRef(null);
  const inflightLoadRef = useRef(null);
  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);
  const prevUserIdRef = useRef(undefined);
  const weekStartingRef = useRef(weekStarting);
  const savingCountRef = useRef(0);

  userRef.current = user;
  isGuestRef.current = isGuest;
  logsByDateRef.current = logsByDate;
  lastFetchedAtRef.current = lastFetchedAt;
  weekStartingRef.current = weekStarting;

  const clearDebounceTimers = useCallback(() => {
    for (const id of debounceTimersRef.current.values()) {
      clearTimeout(id);
    }
    debounceTimersRef.current.clear();
  }, []);

  const beginSaving = useCallback(() => {
    savingCountRef.current += 1;
    setIsSaving(true);
  }, []);

  const endSaving = useCallback(() => {
    savingCountRef.current = Math.max(0, savingCountRef.current - 1);
    if (savingCountRef.current === 0) setIsSaving(false);
  }, []);

  const persistDay = useCallback(
    async (localDate, filteredWorkouts, uid) => {
      if (!uid || isGuestRef.current) return { error: null };

      beginSaving();
      try {
        if (!filteredWorkouts.length) {
          const { error: delError } = await deleteWorkoutLog(uid, localDate);
          if (delError) {
            setError('Failed to save workout log');
            return { error: delError };
          }
          setLogsByDate((prev) => {
            if (!(localDate in prev)) return prev;
            const next = { ...prev };
            delete next[localDate];
            return next;
          });
          setError(null);
          return { error: null };
        }

        const shouldStreak = !streakFiredForDatesRef.current.has(localDate);
        const { data, error: upsertError } = await upsertWorkoutLog(
          uid,
          localDate,
          filteredWorkouts,
          { recordStreak: shouldStreak }
        );

        if (upsertError) {
          setError('Failed to save workout log');
          return { error: upsertError };
        }

        if (shouldStreak) {
          streakFiredForDatesRef.current.add(localDate);
        }

        setLogsByDate((prev) => ({
          ...prev,
          [localDate]: data?.workouts ?? filteredWorkouts,
        }));
        setError(null);
        return { error: null };
      } finally {
        endSaving();
      }
    },
    [beginSaving, endSaving]
  );

  const flushPendingSaves = useCallback(
    async (localDate, uidOverride) => {
      const uid = uidOverride ?? userRef.current?.id ?? null;
      // When flushing an outgoing user (uidOverride set), do not consult the
      // current session's isGuest flag — that may already be the new user.
      const skipNetwork = uidOverride != null ? !uid : !uid || isGuestRef.current;

      const dates = localDate
        ? pendingPayloadRef.current.has(localDate) ||
          debounceTimersRef.current.has(localDate)
          ? [localDate]
          : []
        : [
            ...new Set([
              ...pendingPayloadRef.current.keys(),
              ...debounceTimersRef.current.keys(),
            ]),
          ];

      for (const date of dates) {
        const timer = debounceTimersRef.current.get(date);
        if (timer) {
          clearTimeout(timer);
          debounceTimersRef.current.delete(date);
        }
      }

      if (skipNetwork) {
        for (const date of dates) {
          pendingPayloadRef.current.delete(date);
        }
        return;
      }

      await Promise.all(
        dates.map(async (date) => {
          const payload = pendingPayloadRef.current.get(date);
          pendingPayloadRef.current.delete(date);
          if (payload === undefined) return;
          await persistDay(date, payload, uid);
        })
      );
    },
    [persistDay]
  );

  const schedulePersist = useCallback(
    (localDate, filteredWorkouts) => {
      const existingTimer = debounceTimersRef.current.get(localDate);
      if (existingTimer) clearTimeout(existingTimer);

      pendingPayloadRef.current.set(localDate, filteredWorkouts);

      if (!userRef.current?.id || isGuestRef.current) {
        return;
      }

      const timerId = setTimeout(() => {
        debounceTimersRef.current.delete(localDate);
        const payload = pendingPayloadRef.current.get(localDate);
        pendingPayloadRef.current.delete(localDate);
        if (payload === undefined) return;
        const uid = userRef.current?.id;
        if (!uid || isGuestRef.current) return;
        void persistDay(localDate, payload, uid);
      }, DEBOUNCE_MS);

      debounceTimersRef.current.set(localDate, timerId);
    },
    [persistDay]
  );

  const updateDayWorkouts = useCallback(
    (localDate, workouts) => {
      const nextWorkouts = Array.isArray(workouts) ? workouts : [];
      setDraftByDate((prev) => ({ ...prev, [localDate]: nextWorkouts }));

      const filtered = filterMeaningfulWorkouts(nextWorkouts);
      const hasRow = Object.prototype.hasOwnProperty.call(
        logsByDateRef.current,
        localDate
      );

      if (!filtered.length) {
        if (hasRow) {
          schedulePersist(localDate, []);
        } else {
          const timer = debounceTimersRef.current.get(localDate);
          if (timer) {
            clearTimeout(timer);
            debounceTimersRef.current.delete(localDate);
          }
          pendingPayloadRef.current.delete(localDate);
        }
        return;
      }

      schedulePersist(localDate, filtered);
    },
    [schedulePersist]
  );

  const getWorkoutsForDate = useCallback(
    (localDate) => draftByDate[localDate] ?? logsByDate[localDate] ?? [],
    [draftByDate, logsByDate]
  );

  const loadWeek = useCallback(async (monday, { background = false } = {}) => {
    const uid = userRef.current?.id;
    const guest = isGuestRef.current;
    const week = monday || weekStartingRef.current;

    if (!uid || guest) {
      setIsLoading(false);
      return;
    }

    if (inflightLoadRef.current) {
      return inflightLoadRef.current;
    }

    if (background || lastFetchedAtRef.current != null) {
      // soft revalidate — keep existing UI
    } else {
      setIsLoading(true);
    }

    const endDate = addDaysToDateString(week, 6);
    const promise = (async () => {
      try {
        const { data, error: fetchError } = await fetchWorkoutLogsForRange(
          uid,
          week,
          endDate
        );

        if (userRef.current?.id !== uid) return;

        if (fetchError) {
          // Background revalidate failures should not interrupt the user — keep
          // cached logs and retry on the next successful fetch.
          if (background) {
            console.warn('WorkoutLogProvider: background load failed', fetchError);
          } else {
            setError('Failed to load workout logs');
          }
          return;
        }

        setLogsByDate((prev) => {
          const next = { ...prev };
          for (let i = 0; i < 7; i += 1) {
            const d = addDaysToDateString(week, i);
            if (data && Object.prototype.hasOwnProperty.call(data, d)) {
              next[d] = data[d];
            } else {
              delete next[d];
            }
          }
          return next;
        });
        setError(null);
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      } catch (e) {
        console.error('WorkoutLogProvider: loadWeek failed', e);
        if (userRef.current?.id === uid) {
          if (background) {
            console.warn('WorkoutLogProvider: background load exception suppressed');
          } else {
            setError('Failed to load workout logs');
          }
        }
      } finally {
        if (userRef.current?.id === uid) {
          setIsLoading(false);
        }
        if (inflightLoadRef.current === promise) {
          inflightLoadRef.current = null;
        }
      }
    })();

    inflightLoadRef.current = promise;
    return promise;
  }, []);

  // userId change: flush outgoing user, then clear refs/state; also load on week change.
  useEffect(() => {
    let alive = true;

    (async () => {
      const prev = prevUserIdRef.current;
      const userChanged = prev !== undefined && prev !== userId;

      if (userChanged) {
        if (prev) {
          await flushPendingSaves(undefined, prev);
        }
        if (!alive) return;

        clearDebounceTimers();
        pendingPayloadRef.current.clear();
        streakFiredForDatesRef.current.clear();
        setLogsByDate({});
        setDraftByDate({});
        setError(null);
        setIsSaving(false);
        savingCountRef.current = 0;
        setLastFetchedAt(null);
        lastFetchedAtRef.current = null;
        inflightLoadRef.current = null;
      }

      prevUserIdRef.current = userId;

      if (!userId || isGuest) {
        setIsLoading(false);
        return;
      }

      await loadWeek(weekStarting);
    })();

    return () => {
      alive = false;
    };
  }, [
    userId,
    isGuest,
    weekStarting,
    flushPendingSaves,
    clearDebounceTimers,
    loadWeek,
  ]);

  useStaleAppStateRevalidate(
    useCallback(
      ({ background } = {}) => loadWeek(weekStartingRef.current, { background }),
      [loadWeek]
    ),
    lastFetchedAtRef,
    Boolean(userId && !isGuest)
  );

  const setSelectedDate = useCallback((localDate) => {
    if (!localDate) return;
    setSelectedDateState(localDate);

    const d = new Date(`${localDate}T00:00:00`);
    const jsDay = d.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    const mondayStr = `${y}-${m}-${day}`;

    setWeekStarting((prev) => (prev === mondayStr ? prev : mondayStr));
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setWeekStarting((prev) => {
      const next = getPreviousWeek(prev);
      if (!next) return prev;
      setSelectedDateState((sel) => {
        const idx =
          (new Date(`${sel}T00:00:00`) - new Date(`${prev}T00:00:00`)) /
          (24 * 60 * 60 * 1000);
        const dayIndex = Math.min(6, Math.max(0, Math.round(idx)));
        return addDaysToDateString(next, dayIndex);
      });
      return next;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStarting((prev) => {
      const next = getNextWeek(prev);
      if (!next) return prev;
      setSelectedDateState((sel) => {
        const idx =
          (new Date(`${sel}T00:00:00`) - new Date(`${prev}T00:00:00`)) /
          (24 * 60 * 60 * 1000);
        const dayIndex = Math.min(6, Math.max(0, Math.round(idx)));
        return addDaysToDateString(next, dayIndex);
      });
      return next;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const stateValue = useMemo(
    () => ({
      selectedDate,
      weekStarting,
      logsByDate,
      draftByDate,
      isSaving,
      isLoading,
      error,
    }),
    [
      selectedDate,
      weekStarting,
      logsByDate,
      draftByDate,
      isSaving,
      isLoading,
      error,
    ]
  );

  const actionsValue = useMemo(
    () => ({
      updateDayWorkouts,
      getWorkoutsForDate,
      flushPendingSaves,
      setSelectedDate,
      loadWeek,
      clearError,
      goToPreviousWeek,
      goToNextWeek,
      setWeekStarting,
    }),
    [
      updateDayWorkouts,
      getWorkoutsForDate,
      flushPendingSaves,
      setSelectedDate,
      loadWeek,
      clearError,
      goToPreviousWeek,
      goToNextWeek,
    ]
  );

  return (
    <WorkoutLogActionsContext.Provider value={actionsValue}>
      <WorkoutLogStateContext.Provider value={stateValue}>
        {children}
      </WorkoutLogStateContext.Provider>
    </WorkoutLogActionsContext.Provider>
  );
}

export function useWorkoutLogState() {
  const ctx = useContext(WorkoutLogStateContext);
  if (!ctx) {
    throw new Error('useWorkoutLogState must be used within WorkoutLogProvider');
  }
  return ctx;
}

export function useWorkoutLogActions() {
  const ctx = useContext(WorkoutLogActionsContext);
  if (!ctx) {
    throw new Error('useWorkoutLogActions must be used within WorkoutLogProvider');
  }
  return ctx;
}

export { filterMeaningfulWorkouts, addDaysToDateString };
