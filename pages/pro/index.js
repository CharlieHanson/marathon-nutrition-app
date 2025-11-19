import React from 'react';
import { ProLandingPage } from '../../src/views/ProLandingPage';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';

export default function ProHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);

  // Fetch role
  React.useEffect(() => {
    if (user) {
      // Get role from user_profiles
      // setUserRole(...)
    }
  }, [user]);

  // Redirect to dashboard if already logged in as nutritionist
  React.useEffect(() => {
    if (!loading && user && userRole === 'nutritionist') {
      router.push('/pro/dashboard');
    }
  }, [user, loading, userRole, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (user && userRole === 'nutritionist') {
    return null; // Redirecting
  }

  return <ProLandingPage />;
}