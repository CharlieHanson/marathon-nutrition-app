import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { FoodPreferencesPage } from '../src/views/FoodPreferencesPage';
import { useFoodPreferences } from '../src/hooks/useFoodPreferences';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { Layout } from '../src/components/layout/Layout';

export default function Preferences() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);
  const { profile } = useUserProfile(user, isGuest, reloadKey);
  const preferences = useFoodPreferences(user, isGuest, reloadKey);

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router, router.asPath]);

  // Flush pending preference saves on route leave
  React.useEffect(() => {
    const handleRouteChange = () => {
      void preferences.flushPendingSave();
    };
    router.events?.on?.('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off?.('routeChangeStart', handleRouteChange);
      void preferences.flushPendingSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
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
      userName={profile?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="preferences"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <FoodPreferencesPage
        preferences={preferences.preferences}
        onUpdate={preferences.updatePreferences}
        isSaving={preferences.isSaving}
        isLoading={preferences.isLoading}
        isGuest={isGuest}
      />
    </Layout>
  );
}