// src/components/AppLayout.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Layout } from './layout/Layout';

export const AppLayout = ({ children }) => {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const [userName, setUserName] = React.useState(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router]);

  // Fetch user name
  React.useEffect(() => {
    if (user && !isGuest) {
      // Fetch userName from database
      // setUserName(...)
    }
  }, [user, isGuest]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && !isGuest) {
    return null; // Redirecting...
  }

  return (
    <Layout
      user={user}
      userName={userName}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView={router.pathname.slice(1) || 'training'}
      onViewChange={(view) => router.push(`/${view}`)}
    >
      {children}
    </Layout>
  );
};