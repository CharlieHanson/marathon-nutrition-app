import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { OnboardingFlow } from '../src/views/OnboardingFlow';

export default function Onboarding() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, router.asPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user || isGuest) {
    return null;
  }

  return (
    <OnboardingFlow
      user={user}
      onComplete={() => {
        setReloadKey((prev) => prev + 1);
        router.push('/training');
      }}
    />
  );
}