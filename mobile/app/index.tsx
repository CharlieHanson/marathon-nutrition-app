import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { checkOnboardingStatus } from '../../shared/lib/dataClient';

const ONBOARDING_STORAGE_KEY = 'hasSeenOnboarding';

export default function Index() {
  const router = useRouter();
  const { user, loading, isGuest, getUserRole } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  // When unauthenticated, read AsyncStorage for onboarding flag
  useEffect(() => {
    if (loading || user || isGuest) return;
    let cancelled = false;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (cancelled) return;
        setHasSeenOnboarding(value === 'true');
      } catch {
        if (cancelled) return;
        setHasSeenOnboarding(true); // on error, skip carousel
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, isGuest]);

  // Redirect based on auth and onboarding status
  useEffect(() => {
    if (loading) return;

    if (isGuest) {
      router.replace('/(app)/dashboard');
      return;
    }

    if (!user) {
      if (hasSeenOnboarding === null) return; // still reading AsyncStorage
      if (hasSeenOnboarding === false) {
        router.replace('/(onboarding)/carousel');
        return;
      }
      router.replace('/(auth)/login');
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const role = await getUserRole?.();
        if (cancelled) return;
        if (role === 'nutritionist') {
          router.replace('/(app)/dashboard');
          return;
        }
        const status = await checkOnboardingStatus(user.id);
        if (cancelled) return;
        if (!status?.hasCompletedOnboarding) {
          router.replace('/(onboarding)');
        } else {
          router.replace('/(app)/dashboard');
        }
      } catch (e) {
        if (!cancelled) router.replace('/(app)/dashboard');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loading, isGuest, hasSeenOnboarding, router, getUserRole]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F6921D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user || isGuest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F6921D" />
      </View>
    );
  }

  // Waiting for hasSeenOnboarding read or redirecting to carousel/login
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

