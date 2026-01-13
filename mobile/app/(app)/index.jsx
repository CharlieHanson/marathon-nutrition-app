import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard when this index route is accessed
    router.replace('/(app)/dashboard');
  }, [router]);

  return null;
}

