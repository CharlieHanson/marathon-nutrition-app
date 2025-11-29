import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { SettingsPage } from '../src/views/SettingsPage';
import { Layout } from '../src/components/layout/Layout';

export default function Settings() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router, router.asPath]);

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
      currentView="settings"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <SettingsPage user={user} />
    </Layout>
  );
}