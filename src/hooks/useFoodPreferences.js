import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveFoodPreferences } from '../dataClient';

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

    if (!user || isGuest) {
      setPreferences(EMPTY_PREFERENCES);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        const fp = data?.foodPreferences || null;
        setPreferences(fp
          ? {
              likes: fp.likes || '',
              dislikes: fp.dislikes || '',
              cuisineFavorites: fp.cuisine_favorites || '',
            }
          : EMPTY_PREFERENCES
        );
      } catch {
        // keep current/empty
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, isGuest, reloadKey]);

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

  return { preferences, updatePreferences, savePreferences, isSaving };
};
