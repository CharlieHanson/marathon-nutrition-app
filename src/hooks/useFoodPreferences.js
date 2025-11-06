import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveFoodPreferences } from '../dataClient';

const EMPTY_PREFERENCES = {
  likes: '',
  dislikes: '',
  cuisineFavorites: '',
};

export const useFoodPreferences = (user, isGuest) => {
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
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (data.foodPreferences) {
          setPreferences({
            likes: data.foodPreferences.likes || '',
            dislikes: data.foodPreferences.dislikes || '',
            cuisineFavorites: data.foodPreferences.cuisine_favorites || '',
          });
        } else {
          setPreferences(EMPTY_PREFERENCES);
        }
      } catch (e) {
        console.error('Load preferences failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

  const updatePreferences = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      const { error } = await saveFoodPreferences(user.id, preferences);
      return { error };
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
