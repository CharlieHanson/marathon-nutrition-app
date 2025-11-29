import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { NutritionistProfile } from '../../src/views/pro/NutritionistProfilePage';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [isNutritionist, setIsNutritionist] = React.useState(false);
  const [userName, setUserName] = React.useState(null);

  console.log('ProfilePage render', {
    loading,
    hasUser: !!user,
    checkingAuth,
    isNutritionist,
    userName,
    path: router.asPath,
    meta: user?.user_metadata,
  });

  React.useEffect(() => {
    console.log('ProfilePage useEffect fired', {
      loading,
      hasUser: !!user,
      path: router.asPath,
    });

    if (loading) {
      console.log('ProfilePage: still loading auth, skipping auth check');
      return;
    }

    if (!user) {
      console.log('ProfilePage: no user, redirecting to /pro/login');
      setCheckingAuth(false);
      router.replace('/pro/login');
      return;
    }

    const role = user.user_metadata?.role || 'client';
    const name = user.user_metadata?.name || 'Nutritionist';

    console.log('ProfilePage: resolved role/name from metadata', { role, name });

    setUserName(name);

    if (role !== 'nutritionist') {
      console.log(
        'ProfilePage: user is not nutritionist (role =',
        role,
        '), redirecting to /training'
      );
      setCheckingAuth(false);
      router.replace('/training');
      return;
    }

    console.log('ProfilePage: user is nutritionist, allowing access');
    setIsNutritionist(true);
    setCheckingAuth(false);
  }, [user, loading, router]);

  if (loading || checkingAuth) {
    console.log('ProfilePage: showing top-level Loading screen', {
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
    console.log('ProfilePage: not nutritionist or mid-redirect, rendering null');
    return null;
  }

  console.log('ProfilePage: rendering ProLayout + NutritionistProfile');

  return (
    <ProLayout userName={userName} onSignOut={signOut}>
      <NutritionistProfile currentUser={user} />
    </ProLayout>
  );
}
