// mobile/components/AppLayout.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from './layout/Layout';

import { fetchBaseProfile } from '../../shared/lib/dataClient';

export const AppLayout = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const { colors } = useTheme();
  const [userName, setUserName] = useState(null);
  const [fetchingName, setFetchingName] = useState(false);

  const styles = getStyles(colors);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.replace('/(auth)/login');
    }
  }, [user, loading, isGuest, router]);

  // Fetch user name from profiles table
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user || isGuest || fetchingName) return;

      setFetchingName(true);
      try {
        const profile = await fetchBaseProfile(user.id);
        if (profile?.name) {
          setUserName(profile.name);
        } else {
          // Fallback to email if no name
          setUserName(null);
        }
      } catch (error) {
        console.warn('AppLayout: failed to fetch user name', error);
        setUserName(null);
      } finally {
        setFetchingName(false);
      }
    };

    fetchUserName();
  }, [user, isGuest, fetchingName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user && !isGuest) {
    return null; // Redirecting...
  }

  // Determine current view from segments
  // segments will be like ['(app)', 'index'] or ['(app)', 'meals']
  const currentView = segments[segments.length - 1] || 'dashboard';
  
  // Map route names to view names
  const viewMap = {
    'index': 'dashboard',
    'dashboard': 'dashboard',
    'training': 'training',
    'meals': 'meals',
    'profile': 'profile',
    'preferences': 'preferences',
    'settings': 'settings',
  };
  
  const mappedView = viewMap[currentView] || 'dashboard';

  const handleViewChange = (view) => {
    // Map view names to routes
    const routeMap = {
      'dashboard': '/(app)/dashboard',
      'training': '/(app)/training',
      'meals': '/(app)/meals',
      'preferences': '/(app)/preferences',
      'profile': '/(app)/profile',
      'settings': '/(app)/settings',
    };
    
    const route = routeMap[view] || '/(app)/dashboard';
    router.push(route);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login after sign out
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('AppLayout: signOut error', error);
      // Still redirect even if there's an error
      router.replace('/(auth)/login');
    }
  };

  const handleDisableGuestMode = async () => {
    try {
      await disableGuestMode();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('AppLayout: disableGuestMode error', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <Layout
      user={user}
      userName={userName}
      isGuest={isGuest}
      onSignOut={handleSignOut}
      onDisableGuestMode={handleDisableGuestMode}
      currentView={mappedView}
      onViewChange={handleViewChange}
    >
      {children}
    </Layout>
  );
};

const getStyles = (colors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

