// pages/login.js
import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import Auth from '../src/components/Auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();

  // ✅ Only redirect guests -> /training
  //    Do NOT redirect logged-in users here; Auth + /auth/redirect handles that.
  React.useEffect(() => {
    if (!loading && isGuest) {
      router.push('/training');
    }
  }, [loading, isGuest, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  // While guest is being redirected, render nothing
  if (isGuest) {
    return null;
  }

  // For:
  // - normal login
  // - already-logged-in users who happen to hit /login
  // Auth's submit handler will call router.replace('/auth/redirect')
  // and /auth/redirect will route by role (client vs nutritionist)
  return <Auth />;
}
