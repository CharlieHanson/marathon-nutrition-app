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

export const useUserProfile = (user, isGuest, reloadKey = 0) => {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [profileType, setProfileType] = useState(null); // ✅ NEW: keep track of profiles.type (client/nutritionist)

  useEffect(() => {
    let cancelled = false;

    // If logged out or guest → clear profile
    if (!user || isGuest) {
      setProfile(EMPTY_PROFILE);
      setProfileType(null); // ✅ NEW
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        // ✅ CHANGED: fetch now returns { userProfile, foodPreferences, baseProfile }
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        const base = data?.baseProfile || null; // { name, type } from public.profiles
        const up = data?.userProfile || null;   // client-only row (we inject name there in dataClient, but we prefer base)

        // ✅ NEW: remember profile type to let UI react if needed
        setProfileType(base?.type ?? null);

        // Build the UI profile shape:
        // - name from profiles
        // - client fields from user_profiles
        // - if nutritionist (no client row), keep client fields empty
        const next = {
          name: base?.name || '',
          age: (up && up.age) || '',
          height: (up && up.height) || '',
          weight: (up && up.weight) || '',
          goal: (up && up.goal) || '',
          activityLevel: (up && up.activity_level) || '',
          objective: (up && up.objective) || '',
          dietaryRestrictions: (up && up.dietary_restrictions) || '',
        };

        // ✅ NEW: if this is a nutritionist account, zero out client-only fields to avoid confusion
        if (base?.type === 'nutritionist') {
          next.age = '';
          next.height = '';
          next.weight = '';
          next.goal = '';
          next.activityLevel = '';
          next.objective = '';
          next.dietaryRestrictions = '';
        }

        setProfile(next);
      } catch {
        // Error loading profile - use empty
        setProfile(EMPTY_PROFILE);           // ✅ CHANGED: ensure clean state on failure
        setProfileType(null);                // ✅ NEW
      }
    })();

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
      // ✅ CHANGED: saveUserProfile now splits the write:
      // - profiles.name (if provided)
      // - user_profiles (client-only fields)
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
    profileType, // ✅ NEW: expose type if your UI wants it (safe to ignore elsewhere)
  };
};
