import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProfilePage } from '../src/views/ProfilePage';
import { Layout } from '../src/components/layout/Layout';

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
      setProfile(defaultProfile);
      setProfileLoading(false);
      return;
    }

    if (!user) {
      // logged-out non-guest is already handled by auth guard
      return;
    }

    const loadProfile = async () => {
      try {
        console.log('Profile page: fetching profile via /api/profile', {
          userId: user.id,
        });

        const res = await fetch(`/api/profile?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          console.error('Profile page: /api/profile GET not ok', res.status);
          setProfile(defaultProfile);
          return;
        }

        const data = await res.json();
        console.log('Profile page: /api/profile GET data', data);

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
        setProfile(defaultProfile);
      } finally {
        setProfileLoading(false);
      }
    };

    setProfileLoading(true);
    loadProfile();
  }, [user, loading, checkingAuth]);

  // ===== Handlers passed to ProfilePage =====
  const handleUpdate = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Guests can't save; mimic hook API (no error)
    if (isGuest || !user) {
      return { error: null };
    }

    setIsSaving(true);
    try {
      console.log('Profile page: saving profile via /api/profile');
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profile,
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
  };

  // ===== Render =====
  if (loading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
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
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      ) : (
        <ProfilePage
          profile={profile}
          onUpdate={handleUpdate}
          onSave={handleSave}
          isSaving={isSaving}
          isGuest={isGuest}
        />
      )}
    </Layout>
  );
}
