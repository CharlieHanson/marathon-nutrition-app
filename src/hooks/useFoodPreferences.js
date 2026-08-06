// src/hooks/useFoodPreferences.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { authenticatedFetch, getApiUrl } from '../../shared/services/api';

const EMPTY_PREFERENCES = {
  likes: '',
  dislikes: '',
  cuisineFavorites: '',
};

const DEBOUNCE_MS = 600;

export const useFoodPreferences = (user, isGuest, reloadKey = 0) => {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && !isGuest));

  const preferencesRef = useRef(preferences);
  const userIdRef = useRef(user?.id);
  const isGuestRef = useRef(isGuest);
  const debounceTimerRef = useRef(null);
  const pendingPrefsRef = useRef(null);
  const skipAutoSaveRef = useRef(true);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    userIdRef.current = user?.id;
    isGuestRef.current = isGuest;
  }, [user?.id, isGuest]);

  const persistPreferences = useCallback(async (prefs, uid) => {
    if (!uid || isGuestRef.current) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      console.log('useFoodPreferences: saving via /api/preferences POST', {
        userId: uid,
        preferences: prefs,
      });

      const res = await authenticatedFetch(getApiUrl('/api/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          preferences: prefs,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || `HTTP ${res.status}`;
        console.error('useFoodPreferences: save error', errMsg);
        return { error: errMsg };
      }

      return { error: null };
    } catch (err) {
      console.error('useFoodPreferences: save exception', err);
      return { error: err.message || 'Unknown error' };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushPendingSave = useCallback(async () => {
    clearDebounceTimer();
    const prefs = pendingPrefsRef.current;
    pendingPrefsRef.current = null;
    if (prefs === null) return { error: null };

    const uid = userIdRef.current;
    if (!uid || isGuestRef.current) return { error: null };

    return persistPreferences(prefs, uid);
  }, [clearDebounceTimer, persistPreferences]);

  const schedulePersist = useCallback(
    (prefs) => {
      pendingPrefsRef.current = prefs;
      clearDebounceTimer();

      if (!userIdRef.current || isGuestRef.current) return;

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const payload = pendingPrefsRef.current;
        pendingPrefsRef.current = null;
        if (payload === null) return;
        const uid = userIdRef.current;
        if (!uid || isGuestRef.current) return;
        void persistPreferences(payload, uid);
      }, DEBOUNCE_MS);
    },
    [clearDebounceTimer, persistPreferences]
  );

  useEffect(() => {
    let cancelled = false;

    // If logged out or guest → clear preferences
    if (!user || isGuest) {
      skipAutoSaveRef.current = true;
      clearDebounceTimer();
      pendingPrefsRef.current = null;
      setPreferences(EMPTY_PREFERENCES);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    skipAutoSaveRef.current = true;
    setIsLoading(true);
    (async () => {
      try {
        console.log('useFoodPreferences: fetching via /api/preferences', {
          userId: user.id,
        });

        const res = await authenticatedFetch(
          getApiUrl(`/api/preferences?userId=${encodeURIComponent(user.id)}`)
        );

        if (!res.ok) {
          console.error(
            'useFoodPreferences: /api/preferences GET not ok',
            res.status
          );
          if (!cancelled) {
            setPreferences(EMPTY_PREFERENCES);
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        console.log('useFoodPreferences: /api/preferences GET data', data);

        if (data && data.success) {
          // ✅ Handle both shapes:
          // 1) { success, preferences: { ... } }
          // 2) { success, likes, dislikes, cuisineFavorites }
          const fp = data.preferences
            ? data.preferences
            : {
                likes: data.likes,
                dislikes: data.dislikes,
                cuisine_favorites:
                  data.cuisine_favorites || data.cuisineFavorites,
              };

          setPreferences({
            likes: fp?.likes || '',
            dislikes: fp?.dislikes || '',
            cuisineFavorites:
              fp?.cuisine_favorites || fp?.cuisineFavorites || '',
          });
        } else {
          setPreferences(EMPTY_PREFERENCES);
        }
      } catch (err) {
        console.error('useFoodPreferences: fetch error', err);
        if (!cancelled) {
          setPreferences(EMPTY_PREFERENCES);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          // Allow the FoodPreferencesPage sync effect to settle before auto-save
          requestAnimationFrame(() => {
            if (!cancelled) skipAutoSaveRef.current = false;
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, reloadKey, clearDebounceTimer]);

  // Debounced auto-save whenever preferences change after hydration
  useEffect(() => {
    if (skipAutoSaveRef.current || isLoading) return;
    if (!user?.id || isGuest) return;

    schedulePersist(preferences);
  }, [preferences, isLoading, user?.id, isGuest, schedulePersist]);

  useEffect(() => {
    return () => {
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  const updatePreferences = (field, value) => {
    setPreferences((prev) => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  };

  const savePreferences = async () => {
    clearDebounceTimer();
    pendingPrefsRef.current = null;
    const prefs = preferencesRef.current;
    const uid = userIdRef.current;
    return persistPreferences(prefs, uid);
  };

  return {
    preferences,
    updatePreferences,
    savePreferences,
    flushPendingSave,
    isSaving,
    isLoading,
  };
};

// So both `import { useFoodPreferences }` and `import useFoodPreferences` work
export default useFoodPreferences;
