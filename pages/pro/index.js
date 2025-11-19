import React from 'react';
import { ProLandingPage } from '../../src/views/pro/ProLandingPage';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';

export default function ProHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);

  // Fetch role
  React.useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setUserRole(data?.role);
      }
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