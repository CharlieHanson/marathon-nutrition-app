import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { NutritionistDashboard } from '../../src/views/pro/NutritionistDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [isNutritionist, setIsNutritionist] = React.useState(false);
  const [userName, setUserName] = React.useState(null);

  console.log('Dashboard render', {
    loading,
    hasUser: !!user,
    checkingAuth,
    isNutritionist,
    userName,
    path: router.asPath,
    meta: user?.user_metadata,
  });

  React.useEffect(() => {
    console.log('Dashboard useEffect fired', {
      loading,
      hasUser: !!user,
      path: router.asPath,
    });

    if (loading) {
      console.log('Dashboard: still loading auth, skipping auth check');
      return;
    }

    if (!user) {
      console.log('Dashboard: no user, redirecting to /pro/login');
      setCheckingAuth(false);
      router.replace('/pro/login');
      return;
    }

    const role = user.user_metadata?.role || 'client';
    const name = user.user_metadata?.name || 'Nutritionist';

    console.log('Dashboard: resolved role/name from metadata', { role, name });

    setUserName(name);

    if (role !== 'nutritionist') {
      console.log(
        'Dashboard: user is not nutritionist (role =',
        role,
        '), redirecting to /training'
      );
      setCheckingAuth(false);
      router.replace('/training');
      return;
    }

    console.log('Dashboard: user is nutritionist, allowing access');
    setIsNutritionist(true);
    setCheckingAuth(false);
  }, [user, loading, router]);

  if (loading || checkingAuth) {
    console.log('Dashboard: showing top-level Loading screen', {
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
    console.log('Dashboard: not nutritionist or mid-redirect, rendering null');
    return null;
  }

  console.log('Dashboard: rendering ProLayout + NutritionistDashboard');

  return (
    <ProLayout userName={userName} onSignOut={signOut}>
      <NutritionistDashboard currentUser={user} />
    </ProLayout>
  );
}
