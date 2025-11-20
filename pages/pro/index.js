import React from 'react';
import { ProLandingPage } from '../../src/views/pro/ProLandingPage';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { supabase } from '../../src/supabaseClient';

export default function ProHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);

  // Fetch role
  React.useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      // ✅ CHANGED: read from profiles.type (new schema), not user_profiles.role
      const { data, error } = await supabase
        .from('profiles')
        .select('type')
        .eq('user_id', user.id)
        .single();

      // ✅ CHANGED: fallback to auth metadata if profiles row hasn't been created yet
      const role =
        (!error && data?.type) ? data.type : (user.user_metadata?.role || null);

      setUserRole(role);
    };
    fetchRole();
  }, [user]);

  // Redirect to dashboard if already logged in as nutritionist
  React.useEffect(() => {
    if (!loading && user && userRole === 'nutritionist') {
      router.push('/pro/dashboard');
    }
  }, [user, loading, userRole, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (user && userRole === 'nutritionist') {
    return null; // Redirecting
  }

  return <ProLandingPage />;
}
