// pages/settings.js
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { SettingsPage } from '../src/views/SettingsPage';
import { Layout } from '../src/components/layout/Layout';

export default function Settings() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();

  // Guard: if no auth and not a guest, redirect to /login once loading is done
  React.useEffect(() => {
    if (loading) return; // don't decide until auth is resolved

    if (!user && !isGuest) {
      // avoid pushing multiple entries into history
      if (router.pathname !== '/login') {
        router.replace('/login');
      }
    }
  }, [loading, user, isGuest, router]);

  // While auth is still resolving, show a lightweight in-app loader
  if (loading) {
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
        <div className="flex items-center justify-center py-16">
          <p className="text-primary font-semibold">Loading settings…</p>
        </div>
      </Layout>
    );
  }

  // Redirect in progress / not allowed here
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
