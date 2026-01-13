// mobile/hooks/useFoodPreferences.js
import { useState, useEffect } from 'react';
import { saveFoodPreferences, fetchPersonalInfo } from '../../shared/lib/dataClient';

const EMPTY_PREFERENCES = {
  likes: '',
  dislikes: '',
  cuisineFavorites: '',
};

// Helper to get API URL for mobile
const getApiUrl = (endpoint) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://alimenta-nutrition.vercel.app';
  return `${baseUrl}${endpoint}`;
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
        console.log('useFoodPreferences: fetching preferences', {
          userId: user.id,
        });

        const personalInfo = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (personalInfo?.foodPreferences) {
          const fp = personalInfo.foodPreferences;
          setPreferences({
            likes: fp?.likes || '',
            dislikes: fp?.dislikes || '',
            cuisineFavorites: fp?.cuisine_favorites || fp?.cuisineFavorites || '',
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
      console.log('useFoodPreferences: saving preferences', {
        userId: user.id,
        preferences,
      });

      const { error } = await saveFoodPreferences(user.id, {
        likes: preferences.likes,
        dislikes: preferences.dislikes,
        cuisineFavorites: preferences.cuisineFavorites,
      });

      if (error) {
        console.error('useFoodPreferences: save error', error);
        return { error: error.message || 'Failed to save preferences' };
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

