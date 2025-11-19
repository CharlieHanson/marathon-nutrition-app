import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';

export default function ClientsPage() {
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
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  if (!user || userRole !== 'nutritionist') {
    return null;
  }

  return (
    <ProLayout userName={user.user_metadata?.name} onSignOut={signOut}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">All Clients</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Client list coming soon...</p>
        </div>
      </div>
    </ProLayout>
  );
}