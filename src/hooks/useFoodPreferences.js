// src/hooks/useFoodPreferences.js
import { useState, useEffect } from 'react';

const EMPTY_PREFERENCES = {
  likes: '',
  dislikes: '',
  cuisineFavorites: '',
};

export const useFoodPreferences = (user, isGuest, reloadKey = 0) => {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // If logged out or guest → clear preferences
    if (!user || isGuest) {
      setPreferences(EMPTY_PREFERENCES);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        console.log('useFoodPreferences: fetching via /api/preferences', {
          userId: user.id,
        });

        const res = await fetch(
          `/api/preferences?userId=${encodeURIComponent(user.id)}`
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, reloadKey]);

  const updatePreferences = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      console.log('useFoodPreferences: saving via /api/preferences POST', {
        userId: user.id,
        preferences,
      });

      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          preferences,
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
  };

  return {
    preferences,
    updatePreferences,
    savePreferences,
    isSaving,
  };
};

// So both `import { useFoodPreferences }` and `import useFoodPreferences` work
export default useFoodPreferences;
