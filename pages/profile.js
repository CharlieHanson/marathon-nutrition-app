import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProfilePage } from '../src/views/ProfilePage';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { Layout } from '../src/components/layout/Layout';

export default function Profile() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);
  const profile = useUserProfile(user, isGuest, reloadKey);

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return null;
  }

  return (
    <Layout
      user={user}
      userName={user?.user_metadata?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="profile"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <ProfilePage
        profile={profile.profile}
        onUpdate={profile.updateProfile}
        onSave={profile.saveProfile}
        isSaving={profile.isSaving}
        isGuest={isGuest}
      />
    </Layout>
  );
}