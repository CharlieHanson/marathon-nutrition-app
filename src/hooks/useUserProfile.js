import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveUserProfile } from '../dataClient';

const EMPTY_PROFILE = {
  name: '',
  age: '',
  height: '',
  weight: '',
  goal: '',
  activityLevel: '',
  objective: '',
  dietaryRestrictions: '',
};

export const useUserProfile = (user, isGuest) => {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // If logged out or guest → clear profile
    if (!user || isGuest) {
      setProfile(EMPTY_PROFILE);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
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
            objective: data.userProfile.objective || '',
            dietaryRestrictions: data.userProfile.dietary_restrictions || '',
          });
        } else {
          setProfile(EMPTY_PROFILE);
        }
      } catch (e) {
        console.error('Load profile failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

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
