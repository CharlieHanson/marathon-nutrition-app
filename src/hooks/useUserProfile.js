import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveUserProfile } from '../dataClient';

export const useUserProfile = (user, isGuest) => {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
    objective: '', // NEW
    dietaryRestrictions: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load from DB
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user || isGuest) return;

      try {
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (data.userProfile) {
          setProfile({
            name: data.userProfile.name || '',
            age: data.userProfile.age || '',
            height: data.userProfile.height || '',
            weight: data.userProfile.weight || '',
            goal: data.userProfile.goal || '',
            activityLevel: data.userProfile.activity_level || '',
            objective: data.userProfile.objective || '', // NEW
            dietaryRestrictions: data.userProfile.dietary_restrictions || '',
          });
        }
      } catch (e) {
        console.error('Load profile failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      const { error } = await saveUserProfile(user.id, profile);
      return { error };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    updateProfile,
    saveProfile,
    isSaving,
  };
};