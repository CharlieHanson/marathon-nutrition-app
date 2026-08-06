// pages/auth/redirect.js
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { checkOnboardingStatus } from '../../src/dataClient';
import { capture } from '../../src/lib/posthog';
import { isNewlyCreatedUser, getAuthProvider } from '../../shared/lib/analyticsUser';

export default function AuthRedirect() {
  const router = useRouter();
  const { user, loading, getUserRole } = useAuth();
  const [showMobileChoice, setShowMobileChoice] = useState(false);
  const signupCapturedRef = useRef(false);

  const maybeCaptureOAuthSignup = async () => {
    if (!user?.id || signupCapturedRef.current) return;
    if (typeof window === 'undefined') return;

    const dedupeKey = `ph_signup_${user.id}`;
    if (sessionStorage.getItem(dedupeKey)) {
      signupCapturedRef.current = true;
      return;
    }

    if (!isNewlyCreatedUser(user)) return;
    if (getAuthProvider(user) !== 'google') return;

    signupCapturedRef.current = true;
    sessionStorage.setItem(dedupeKey, '1');

    try {
      const role = await getUserRole();
      capture('signup_completed', {
        persona: role === 'nutritionist' ? 'nutritionist' : 'athlete',
        method: 'google',
      });
    } catch (e) {
      console.warn('AuthRedirect: signup_completed capture failed', e);
      capture('signup_completed', {
        persona: 'athlete',
        method: 'google',
      });
    }
  };

  const routeUser = async () => {
    try {
      await maybeCaptureOAuthSignup();

      const role = await getUserRole();

      if (role === 'nutritionist') {
        router.replace('/pro/dashboard');
        return;
      }

      const status = await checkOnboardingStatus(user.id);

      if (!status?.hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
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
      maybeCaptureOAuthSignup();
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">Where would you like to continue?</p>

          <div className="space-y-3">
            <button
              onClick={handleOpenApp}
              className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
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
    <div className="flex items-center justify-center min-h-screen bg-cream">
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
