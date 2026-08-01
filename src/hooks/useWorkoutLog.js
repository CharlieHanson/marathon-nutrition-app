import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchWorkoutLogsForRange,
  upsertWorkoutLog,
  deleteWorkoutLog,
  getLocalDateString,
} from '../dataClient';

const DEBOUNCE_MS = 600;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPreviousWeek(currentWeek) {
  if (!currentWeek) return null;
  return addDaysToDateString(currentWeek, -7);
}

function getNextWeek(currentWeek) {
  if (!currentWeek) return null;
  return addDaysToDateString(currentWeek, 7);
}

function filterMeaningfulWorkouts(workouts) {
  if (!Array.isArray(workouts)) return [];
  return workouts.filter((w) => typeof w?.type === 'string' && w.type.trim() !== '');
}

function mondayContaining(localDate) {
  const d = new Date(`${localDate}T00:00:00`);
  const jsDay = d.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  return addDaysToDateString(localDate, mondayOffset);
}

/**
 * Web workout-log hook (date-keyed). Same public API as mobile WorkoutLogContext.
 */
export const useWorkoutLog = (user, isGuest) => {
  const userId = user?.id ?? null;

  const [weekStarting, setWeekStarting] = useState(() => getMondayOfCurrentWeek());
  const [selectedDate, setSelectedDateState] = useState(() => getLocalDateString());
  const [logsByDate, setLogsByDate] = useState({});
  const [draftByDate, setDraftByDate] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(userId && !isGuest));
  const [error, setError] = useState(null);

  const debounceTimersRef = useRef(new Map());
  const pendingPayloadRef = useRef(new Map());
  const streakFiredForDatesRef = useRef(new Set());
  const logsByDateRef = useRef(logsByDate);
  const userIdRef = useRef(userId);
  const isGuestRef = useRef(isGuest);
  const prevUserIdRef = useRef(undefined);
  const weekStartingRef = useRef(weekStarting);
  const savingCountRef = useRef(0);
  const inflightLoadRef = useRef(null);

  logsByDateRef.current = logsByDate;
  userIdRef.current = userId;
  isGuestRef.current = isGuest;
  weekStartingRef.current = weekStarting;

  const clearDebounceTimers = useCallback(() => {
    for (const id of debounceTimersRef.current.values()) clearTimeout(id);
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
        if (shouldStreak) streakFiredForDatesRef.current.add(localDate);
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
      const uid = uidOverride ?? userIdRef.current ?? null;
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
        for (const date of dates) pendingPayloadRef.current.delete(date);
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

      if (!userIdRef.current || isGuestRef.current) return;

      const timerId = setTimeout(() => {
        debounceTimersRef.current.delete(localDate);
        const payload = pendingPayloadRef.current.get(localDate);
        pendingPayloadRef.current.delete(localDate);
        if (payload === undefined) return;
        const uid = userIdRef.current;
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

  const loadWeek = useCallback(async (monday) => {
    const uid = userIdRef.current;
    const guest = isGuestRef.current;
    const week = monday || weekStartingRef.current;

    if (!uid || guest) {
      setIsLoading(false);
      return;
    }

    if (inflightLoadRef.current) return inflightLoadRef.current;

    setIsLoading(true);
    const endDate = addDaysToDateString(week, 6);
    const promise = (async () => {
      try {
        const { data, error: fetchError } = await fetchWorkoutLogsForRange(
          uid,
          week,
          endDate
        );
        if (userIdRef.current !== uid) return;
        if (fetchError) {
          setError('Failed to load workout logs');
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
      } catch (e) {
        console.error('useWorkoutLog: loadWeek failed', e);
        if (userIdRef.current === uid) setError('Failed to load workout logs');
      } finally {
        if (userIdRef.current === uid) setIsLoading(false);
        if (inflightLoadRef.current === promise) inflightLoadRef.current = null;
      }
    })();

    inflightLoadRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const prev = prevUserIdRef.current;
      const userChanged = prev !== undefined && prev !== userId;

      if (userChanged) {
        if (prev) await flushPendingSaves(undefined, prev);
        if (!alive) return;
        clearDebounceTimers();
        pendingPayloadRef.current.clear();
        streakFiredForDatesRef.current.clear();
        setLogsByDate({});
        setDraftByDate({});
        setError(null);
        setIsSaving(false);
        savingCountRef.current = 0;
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
  }, [userId, isGuest, weekStarting, flushPendingSaves, clearDebounceTimers, loadWeek]);

  // Flush all pending on page unload
  useEffect(() => {
    const onUnload = () => {
      void flushPendingSaves();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onUnload);
      return () => window.removeEventListener('beforeunload', onUnload);
    }
    return undefined;
  }, [flushPendingSaves]);

  const setSelectedDate = useCallback((localDate) => {
    if (!localDate) return;
    setSelectedDateState(localDate);
    const mondayStr = mondayContaining(localDate);
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

  return {
    selectedDate,
    weekStarting,
    logsByDate,
    draftByDate,
    isSaving,
    isLoading,
    error,
    updateDayWorkouts,
    getWorkoutsForDate,
    flushPendingSaves,
    setSelectedDate,
    loadWeek,
    goToPreviousWeek,
    goToNextWeek,
    clearError,
    setWeekStarting,
  };
};

export { addDaysToDateString, DAYS, getMondayOfCurrentWeek };
