// mobile/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { fetchPersonalInfo, saveUserProfile } from '../../shared/lib/dataClient';

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

// Helper to get API URL for mobile
const getApiUrl = (endpoint) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://alimenta-nutrition.vercel.app';
  return `${baseUrl}${endpoint}`;
};

export const useUserProfile = (user, isGuest, reloadKey = 0) => {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user || isGuest) {
      setProfile(EMPTY_PROFILE);
      setLoadingProfile(false);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoadingProfile(true);
      try {
        console.log('useUserProfile: fetching profile', {
          userId: user.id,
        });

        const personalInfo = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (personalInfo?.userProfile) {
          const up = personalInfo.userProfile;
          setProfile({
            name: up.name || '',
            age: up.age ? String(up.age) : '',
            height: up.height || '',
            weight: up.weight || '',
            goal: up.goal || '',
            activityLevel: up.activity_level || '',
            objective: up.objective || '',
            dietaryRestrictions: up.dietary_restrictions || '',
          });
        } else {
          setProfile(EMPTY_PROFILE);
        }
      } catch (e) {
        console.error('useUserProfile: error fetching profile', e);
        if (!cancelled) {
          setProfile(EMPTY_PROFILE);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, reloadKey]);

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      console.log('useUserProfile: saving profile', {
        userId: user.id,
        profile,
      });

      const { error } = await saveUserProfile(user.id, {
        name: profile.name,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        objective: profile.objective,
        dietaryRestrictions: profile.dietaryRestrictions,
      });

      if (error) {
        console.error('useUserProfile: save error', error);
        return { error: error.message || 'Failed to save profile' };
      }

      return { error: null };
    } catch (e) {
      console.error('useUserProfile: save exception', e);
      return { error: e.message || 'Unknown error' };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    updateProfile,
    saveProfile,
    isSaving,
    loadingProfile,
  };
};

