import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { FoodPreferencesPage } from '../src/views/FoodPreferencesPage';
import { useFoodPreferences } from '../src/hooks/useFoodPreferences';
import { Layout } from '../src/components/layout/Layout';

export default function Preferences() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);
  const preferences = useFoodPreferences(user, isGuest, reloadKey);

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
      currentView="preferences"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <FoodPreferencesPage
        preferences={preferences.preferences}
        onUpdate={preferences.updatePreferences}
        onSave={preferences.savePreferences}
        isSaving={preferences.isSaving}
        isGuest={isGuest}
      />
    </Layout>
  );
}