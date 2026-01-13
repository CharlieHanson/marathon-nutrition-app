import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();

  // Redirect to app if already logged in or guest
  useEffect(() => {
    if (loading) return;

    if (user) {
      // Any authenticated user goes to the dashboard
      router.replace('/(app)/dashboard');
    } else if (isGuest) {
      // Guest mode goes to the dashboard as well
      router.replace('/(app)/dashboard');
    } else {
      // Not logged in, not guest -> redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, loading, isGuest, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F6921D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user || isGuest) {
    // Redirecting away, show loading while redirect happens
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F6921D" />
      </View>
    );
  }

  // This shouldn't be reached due to useEffect redirect, but show loading as fallback
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#F6921D" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF7ED', // orange-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#F6921D', // primary orange
  },
});

