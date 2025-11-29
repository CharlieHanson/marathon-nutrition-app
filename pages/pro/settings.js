// pages/pro/settings.js
import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { ProSettingsPage } from '../../src/views/pro/ProSettingsPage';

export default function ProSettings() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [isNutritionist, setIsNutritionist] = React.useState(false);
  const [userName, setUserName] = React.useState(null);

  console.log('ProSettings render', {
    loading,
    hasUser: !!user,
    checkingAuth,
    isNutritionist,
    userName,
    path: router.asPath,
    meta: user?.user_metadata,
  });

  React.useEffect(() => {
    console.log('ProSettings useEffect fired', {
      loading,
      hasUser: !!user,
      path: router.asPath,
    });

    if (loading) {
      console.log('ProSettings: still loading auth, skipping auth check');
      return;
    }

    if (!user) {
      console.log('ProSettings: no user, redirecting to /pro/login');
      setCheckingAuth(false);
      router.replace('/pro/login');
      return;
    }

    const role = user.user_metadata?.role || 'client';
    const name = user.user_metadata?.name || 'Nutritionist';

    console.log('ProSettings: resolved role/name from metadata', { role, name });

    setUserName(name);

    if (role !== 'nutritionist') {
      console.log(
        'ProSettings: user is not nutritionist (role =',
        role,
        '), redirecting to /training'
      );
      setCheckingAuth(false);
      router.replace('/training');
      return;
    }

    console.log('ProSettings: user is nutritionist, allowing access');
    setIsNutritionist(true);
    setCheckingAuth(false);
  }, [user, loading, router]);

  if (loading || checkingAuth) {
    console.log('ProSettings: showing top-level Loading screen', {
      loading,
      checkingAuth,
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!isNutritionist) {
    console.log('ProSettings: not nutritionist or mid-redirect, rendering null');
    return null;
  }

  console.log('ProSettings: rendering ProLayout + ProSettingsPage');

  return (
    <ProLayout userName={userName} onSignOut={signOut}>
      <ProSettingsPage currentUser={user} />
    </ProLayout>
  );
}
