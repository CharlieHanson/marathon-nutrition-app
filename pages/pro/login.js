import React from 'react';
import { useRouter } from 'next/router';

export default function ProLogin() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to /login with role parameter
    router.replace('/login?role=nutritionist');
  }, [router]); // remove router.asPath

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <p className="text-primary font-semibold">Redirecting...</p>
    </div>
  );
}