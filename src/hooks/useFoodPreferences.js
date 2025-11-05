import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveFoodPreferences } from '../dataClient';

export const useFoodPreferences = (user, isGuest) => {
  const [preferences, setPreferences] = useState({
    likes: '',
    dislikes: '',
    cuisineFavorites: '', // NEW for your feature list
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      if (!user || isGuest) return;
      
      try {
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (data.foodPreferences) {
          setPreferences({
            likes: data.foodPreferences.likes || '',
            dislikes: data.foodPreferences.dislikes || '',
            cuisineFavorites: data.foodPreferences.cuisine_favorites || '',
          });
        }
      } catch (e) {
        console.error('Load preferences failed:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isGuest]);

  const updatePreferences = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
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