// pages/auth/redirect.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { checkOnboardingStatus } from '../../src/dataClient';

export default function AuthRedirect() {
  const router = useRouter();
  const { user, loading, getUserRole } = useAuth();
  const [showMobileChoice, setShowMobileChoice] = useState(false);

  const routeUser = async () => {
    try {
      const role = await getUserRole();

      if (role === 'nutritionist') {
        router.replace('/pro/dashboard');
        return;
      }

      const status = await checkOnboardingStatus(user.id);

      if (!status?.hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/training');
      }
    } catch (e) {
      console.error('AuthRedirect: error routing user', e);
      router.replace('/login');
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setShowMobileChoice(true);
    } else {
      routeUser();
    }
  }, [user?.id, loading]);

  const handleOpenApp = () => {
    window.location.href = 'alimenta://login';
  };

  const handleContinueInBrowser = () => {
    setShowMobileChoice(false);
    routeUser();
  };

  if (showMobileChoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">Where would you like to continue?</p>

          <div className="space-y-3">
            <button
              onClick={handleOpenApp}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              Open in App
            </button>
            <button
              onClick={handleContinueInBrowser}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors"
            >
              Continue in Browser
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <p className="text-primary font-semibold">Signing you in...</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}