import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import Auth from '../src/components/Auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();

  // Redirect to app if already logged in
  React.useEffect(() => {
    if (!loading && (user || isGuest)) {
      router.push('/training');
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
    return null; // Redirecting
  }

  return <Auth />;
}