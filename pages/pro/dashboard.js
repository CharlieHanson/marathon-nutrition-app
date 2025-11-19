import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { NutritionistDashboard } from '../../src/views/NutritionistDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, getUserRole, signOut } = useAuth();
  const [userRole, setUserRole] = React.useState(null);

  // Fetch role
  React.useEffect(() => {
    if (user) {
      getUserRole().then(setUserRole);
    }
  }, [user, getUserRole]);

  // Redirect if not logged in or not a nutritionist
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/pro/login');
    } else if (!loading && user && userRole && userRole !== 'nutritionist') {
      router.push('/training'); // Redirect clients to app
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
    <NutritionistDashboard
      user={user}
      userName={user?.user_metadata?.name}
      onSignOut={signOut}
    />
  );
}