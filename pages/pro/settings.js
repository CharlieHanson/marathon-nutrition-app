// pages/pro/settings.js
import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { ProLayout } from '../../src/views/pro/ProLayout';
import { ProSettingsPage } from '../../src/views/pro/ProSettingsPage';
import { supabase } from '../../src/supabaseClient';

export default function ProSettings() {
  const router = useRouter();
  const { user, loading, getUserRole, signOut } = useAuth();
  const [userRole, setUserRole] = React.useState(null);
  const [userName, setUserName] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      getUserRole().then(setUserRole);
    }
  }, [user, getUserRole]);

  // Fetch user name for ProLayout
  React.useEffect(() => {
    async function fetchUserName() {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        setUserName(data?.name || user.user_metadata?.name || 'Nutritionist');
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName(user.user_metadata?.name || 'Nutritionist');
      }
    }
    
    fetchUserName();
  }, [user]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/pro/login');
    } else if (!loading && user && userRole && userRole !== 'nutritionist') {
      router.push('/training');
    }
  }, [user, loading, userRole, router]);

  if (loading || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user || userRole !== 'nutritionist') {
    return null;
  }

  return (
    <ProLayout userName={userName} onSignOut={signOut}>
      <ProSettingsPage user={user} />
    </ProLayout>
  );
}