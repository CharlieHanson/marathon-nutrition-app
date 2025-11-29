// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';

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
  const [profileType, setProfileType] = useState(null); // if you want it later
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user || isGuest) {
      setProfile(EMPTY_PROFILE);
      setProfileType(null);
      setLoadingProfile(false);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(
          `/api/profile?userId=${encodeURIComponent(user.id)}`
        );
        if (!res.ok) {
          console.error('useUserProfile: /api/profile GET not ok', res.status);
          if (!cancelled) {
            setProfile(EMPTY_PROFILE);
            setProfileType(null);
          }
          return;
        }

        const data = await res.json();
        console.log('useUserProfile: /api/profile GET data', data);

        if (cancelled) return;
        if (!data.success) {
          setProfile(EMPTY_PROFILE);
          setProfileType(null);
          return;
        }

        setProfileType(data.type ?? null);

        const next = {
          name: data.name || '',
          age: data.age || '',
          height: data.height || '',
          weight: data.weight || '',
          goal: data.goal || '',
          activityLevel: data.activityLevel || '',
          objective: data.objective || '',
          dietaryRestrictions: data.dietaryRestrictions || '',
        };

        setProfile(next);
      } catch (e) {
        console.error('useUserProfile: error fetching profile', e);
        if (!cancelled) {
          setProfile(EMPTY_PROFILE);
          setProfileType(null);
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
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profile,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        // ignore json parse errors
      }

      if (!res.ok || !data.success) {
        const msg = data?.message || `Request failed with status ${res.status}`;
        console.error('useUserProfile: /api/profile POST error', msg);
        return { error: msg };
      }

      return { error: null };
    } catch (e) {
      console.error('useUserProfile: save error', e);
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
    profileType,
    loadingProfile,
  };
};
