import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { SettingsPage } from '../../src/views/SettingsPage';

export default function ProSettings() {
  const router = useRouter();
  const { user, loading, getUserRole, signOut } = useAuth();
  const [userRole, setUserRole] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      getUserRole().then(setUserRole);
    }
  }, [user, getUserRole]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/pro/login');
    } else if (!loading && user && userRole && userRole !== 'nutritionist') {
      router.push('/training');
    }
  }, [user, loading, userRole, router]);

  if (loading || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user || userRole !== 'nutritionist') {
    return null;
  }

  return (
    <ProLayout userName={user.user_metadata?.name} onSignOut={signOut}>
      <SettingsPage user={user} />
    </ProLayout>
  );
}