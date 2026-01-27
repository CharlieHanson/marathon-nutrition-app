// pages/auth/redirect.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { checkOnboardingStatus } from '../../src/dataClient'; 

export default function AuthRedirect() {
  const router = useRouter();
  const { user, loading, getUserRole } = useAuth();
  const [isMobile, setIsMobile] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);

    if (mobile) {
      window.location.href = 'alimenta://login';
      const timeout = setTimeout(() => setShowFallback(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    
    let cancelled = false;

    const run = async () => {
      if (loading) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const role = await getUserRole();
        if (cancelled) return;

        if (role === 'nutritionist') {
          router.replace('/pro/dashboard');
          return;
        }

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
    return () => { cancelled = true; };
  }, [isMobile, user?.id, loading, getUserRole, router]);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmed!</h1>
          <p className="text-gray-600 mb-6">Opening Alimenta...</p>
          
          {showFallback && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Didn't open automatically?</p>
              <a
                href="alimenta://login"
                className="block w-full py-3 px-4 bg-primary text-white rounded-lg font-medium text-center"
              >
                Open App
              </a>
              <button
                onClick={() => router.push('/login')}
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Continue on Web
              </button>
            </div>
          )}
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
