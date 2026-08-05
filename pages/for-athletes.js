import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old marketing URL → Pricing */
export default function ForAthletesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/pricing');
  }, [router]);
  return null;
}
