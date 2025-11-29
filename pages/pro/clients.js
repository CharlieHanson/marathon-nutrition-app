// pages/pro/clients.js
import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { ClientListPage } from '../../src/views/pro/ClientListPage';

export default function ClientsPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [userName, setUserName] = React.useState(null);
  const [isNutritionist, setIsNutritionist] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  console.log('ClientsPage render', {
    loading,
    hasUser: !!user,
    checkingAuth,
    isNutritionist,
    userName,
    path: router.asPath,
    meta: user?.user_metadata,
  });

  React.useEffect(() => {
    console.log('ClientsPage useEffect fired', {
      loading,
      hasUser: !!user,
      path: router.asPath,
    });

    if (loading) {
      console.log('ClientsPage: still loading auth, skipping checkAuth');
      return;
    }

    if (!user) {
      console.log('ClientsPage: no user, redirecting to /pro/login');
      setCheckingAuth(false);
      router.replace('/pro/login');
      return;
    }

    const role = user.user_metadata?.role || 'client';
    const name = user.user_metadata?.name || 'Nutritionist';

    console.log('ClientsPage: resolved role/name from metadata', {
      role,
      name,
    });

    setUserName(name);

    if (role !== 'nutritionist') {
      console.log(
        'ClientsPage: user is not nutritionist (role =',
        role,
        '), redirecting to /training'
      );
      setCheckingAuth(false);
      router.replace('/training');
      return;
    }

    console.log('ClientsPage: user is nutritionist, allowing access');
    setIsNutritionist(true);
    setCheckingAuth(false);
  }, [user, loading, router]);

  if (loading || checkingAuth) {
    console.log('ClientsPage: showing top-level Loading screen', {
      loading,
      checkingAuth,
    });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isNutritionist) {
    console.log(
      'ClientsPage: not nutritionist or redirect in progress, rendering null'
    );
    return null;
  }

  console.log('ClientsPage: rendering ProLayout + ClientListPage');

  return (
    <ProLayout userName={userName} onSignOut={signOut}>
      {/* ✅ pass the current user down instead of calling supabase.auth.getUser() inside */}
      <ClientListPage currentUser={user} />
    </ProLayout>
  );
}
