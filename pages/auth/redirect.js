// pages/auth/redirect.js
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { checkOnboardingStatus } from '../../src/dataClient'; 

export default function AuthRedirect() {
  const router = useRouter();
  const { user, loading, getUserRole } = useAuth();

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loading) return; // wait for AuthContext to restore session

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const role = await getUserRole();
        if (cancelled) return;

        if (role === 'nutritionist') {
          // nutritionists always go to pro dashboard
          router.replace('/pro/dashboard');
          return;
        }

        // client: check onboarding completeness
        const status = await checkOnboardingStatus(user.id);
        if (cancelled) return;

        if (!status?.hasCompletedOnboarding) {
          router.replace('/onboarding');
        } else {
          router.replace('/training');
        }
      } catch (e) {
        console.error('AuthRedirect: error getting role/onboarding status', e);
        router.replace('/login');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loading, getUserRole, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <p className="text-primary font-semibold">Signing you in...</p>
    </div>
  );
}

