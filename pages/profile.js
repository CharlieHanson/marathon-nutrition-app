import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProfilePage } from '../src/views/ProfilePage';
import { Layout } from '../src/components/layout/Layout';
import { ProfileSkeleton } from '../src/components/shared/LoadingSkeleton';
import { authenticatedFetch, getApiUrl } from '../shared/services/api';

const DEBOUNCE_MS = 600;

const defaultProfile = {
  name: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  goal: '',
  activityLevel: '',
  objective: '',
  dietaryRestrictions: '',
};

export default function Profile() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();

  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [profile, setProfile] = React.useState(defaultProfile);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const profileRef = React.useRef(profile);
  const userIdRef = React.useRef(user?.id);
  const isGuestRef = React.useRef(isGuest);
  const debounceTimerRef = React.useRef(null);
  const pendingProfileRef = React.useRef(null);
  const skipAutoSaveRef = React.useRef(true);

  React.useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  React.useEffect(() => {
    userIdRef.current = user?.id;
    isGuestRef.current = isGuest;
  }, [user?.id, isGuest]);

  const clearDebounceTimer = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const persistProfile = React.useCallback(async (nextProfile, uid) => {
    if (!uid || isGuestRef.current) return { error: null };

    setIsSaving(true);
    try {
      console.log('Profile page: saving profile via /api/profile');
      const res = await authenticatedFetch(getApiUrl('/api/profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          profile: nextProfile,
        }),
      });

      if (!res.ok) {
        console.error('Profile page: /api/profile POST not ok', res.status);
        return { error: new Error('Failed to save profile') };
      }

      const data = await res.json();
      if (!data.success) {
        console.error('Profile page: /api/profile POST error payload', data);
        return { error: new Error(data.message || 'Failed to save profile') };
      }

      return { error: null };
    } catch (e) {
      console.error('Profile page: error saving profile', e);
      return { error: e };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const flushPendingSave = React.useCallback(async () => {
    clearDebounceTimer();
    const payload = pendingProfileRef.current;
    pendingProfileRef.current = null;
    if (payload === null) return { error: null };

    const uid = userIdRef.current;
    if (!uid || isGuestRef.current) return { error: null };

    return persistProfile(payload, uid);
  }, [clearDebounceTimer, persistProfile]);

  const schedulePersist = React.useCallback(
    (nextProfile) => {
      pendingProfileRef.current = nextProfile;
      clearDebounceTimer();

      if (!userIdRef.current || isGuestRef.current) return;

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const payload = pendingProfileRef.current;
        pendingProfileRef.current = null;
        if (payload === null) return;
        const uid = userIdRef.current;
        if (!uid || isGuestRef.current) return;
        void persistProfile(payload, uid);
      }, DEBOUNCE_MS);
    },
    [clearDebounceTimer, persistProfile]
  );

  // ===== Auth guard =====
  React.useEffect(() => {
    if (loading) return;

    if (!user && !isGuest) {
      router.replace('/login');
      return;
    }

    setCheckingAuth(false);
  }, [user, loading, isGuest, router]);

  // ===== Load profile via API =====
  React.useEffect(() => {
    if (loading || checkingAuth) return;

    // Guest: just use local empty profile
    if (!user && isGuest) {
      skipAutoSaveRef.current = true;
      setProfile(defaultProfile);
      setProfileLoading(false);
      return;
    }

    if (!user) {
      // logged-out non-guest is already handled by auth guard
      return;
    }

    let cancelled = false;
    skipAutoSaveRef.current = true;

    const loadProfile = async () => {
      try {
        console.log('Profile page: fetching profile via /api/profile', {
          userId: user.id,
        });

        const res = await authenticatedFetch(getApiUrl(`/api/profile?userId=${encodeURIComponent(user.id)}`));
        if (!res.ok) {
          console.error('Profile page: /api/profile GET not ok', res.status);
          if (!cancelled) setProfile(defaultProfile);
          return;
        }

        const data = await res.json();
        console.log('Profile page: /api/profile GET data', data);

        if (cancelled) return;

        setProfile({
          name: data.name || '',
          age: data.age ?? '',
          gender: data.gender || '',
          height: data.height || '',
          weight: data.weight || '',
          goal: data.goal || '',
          activityLevel: data.activityLevel || '',
          objective: data.objective || '',
          dietaryRestrictions: data.dietaryRestrictions || '',
        });
      } catch (e) {
        console.error('Profile page: error fetching profile', e);
        if (!cancelled) setProfile(defaultProfile);
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          requestAnimationFrame(() => {
            if (!cancelled) skipAutoSaveRef.current = false;
          });
        }
      }
    };

    setProfileLoading(true);
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, loading, checkingAuth, isGuest]);

  // Debounced auto-save whenever profile changes after hydration
  React.useEffect(() => {
    if (skipAutoSaveRef.current || profileLoading) return;
    if (!user?.id || isGuest) return;

    schedulePersist(profile);
  }, [profile, profileLoading, user?.id, isGuest, schedulePersist]);

  // Flush pending saves on route leave
  React.useEffect(() => {
    const handleRouteChange = () => {
      void flushPendingSave();
    };
    router.events?.on?.('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off?.('routeChangeStart', handleRouteChange);
      void flushPendingSave();
      clearDebounceTimer();
    };
  }, [router.events, flushPendingSave, clearDebounceTimer]);

  // ===== Handlers passed to ProfilePage =====
  const handleUpdate = (field, value) => {
    setProfile((prev) => {
      if (prev[field] === value) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // ===== Render =====
  if (loading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    // Redirecting
    return null;
  }

  return (
    <Layout
      user={user}
      userName={profile.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="profile"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      {profileLoading ? (
        <ProfileSkeleton />
      ) : (
        <ProfilePage
          profile={profile}
          onUpdate={handleUpdate}
          isSaving={isSaving}
          isGuest={isGuest}
        />
      )}
    </Layout>
  );
}
