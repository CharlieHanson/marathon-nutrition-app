// pages/index.js
import React from 'react';
import { LandingPage } from '../src/views/LandingPage';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();

  // Redirect to app if already logged in or guest
  React.useEffect(() => {
    if (loading) return;

    if (user) {
      // ✅ Any authenticated user goes through the central redirect
      router.replace('/auth/redirect');
    } else if (isGuest) {
      // ✅ Guest mode still goes straight to the client experience
      router.replace('/training');
    }
  }, [user, loading, isGuest, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (user || isGuest) {
    // Redirecting away, don't show the landing
    return null;
  }

  // Not logged in, not guest -> show marketing landing page
  return <LandingPage />;
}
