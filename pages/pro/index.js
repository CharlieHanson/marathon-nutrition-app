// pages/pro/index.js
import React from 'react';
import { ProLandingPage } from '../../src/views/pro/ProLandingPage';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';

export default function ProHome() {
  const router = useRouter();
  const { user, loading, getUserRole } = useAuth();
  const [userRole, setUserRole] = React.useState(null);
  const [checkingRole, setCheckingRole] = React.useState(true);

  // Resolve role for logged-in users
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loading) return;

      if (!user) {
        if (!cancelled) {
          setUserRole(null);
          setCheckingRole(false);
        }
        return;
      }

      try {
        const role = await getUserRole();
        if (cancelled) return;
        setUserRole(role);
      } catch (e) {
        console.warn('ProHome: getUserRole failed, treating as non-nutritionist', e);
        if (!cancelled) {
          setUserRole(null);
        }
      } finally {
        if (!cancelled) setCheckingRole(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user, loading, getUserRole]);

  // If already a nutritionist, send them straight to dashboard
  React.useEffect(() => {
    if (loading || checkingRole) return;
    if (user && userRole === 'nutritionist') {
      router.replace('/pro/dashboard');
    }
  }, [user, userRole, loading, checkingRole, router]);

  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (user && userRole === 'nutritionist') {
    // Redirecting to /pro/dashboard
    return null;
  }

  return <ProLandingPage />;
}
