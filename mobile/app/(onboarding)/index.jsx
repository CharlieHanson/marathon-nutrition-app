import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { WelcomeStep } from '../../components/onboarding/WelcomeStep';
import { ProfileStep } from '../../components/onboarding/ProfileStep';
import { PreferencesStep } from '../../components/onboarding/PreferencesStep';
import { ProgressIndicator } from '../../components/onboarding/ProgressIndicator';
import { saveUserProfile, saveFoodPreferences } from '../../../shared/lib/dataClient';
import { usePostHog } from 'posthog-react-native';
import { capture } from '../../lib/analytics';

const BG_GRADIENT_START = '#FFF7ED'; // orange-50
const BG_GRADIENT_END = '#FFFBEB';   // yellow-50-ish

const ONBOARDING_STEP_KEY = 'onboarding_step';
const ONBOARDING_PROFILE_KEY = 'onboarding_profile';
const ONBOARDING_PREFERENCES_KEY = 'onboarding_preferences';

const daysSinceSignup = (user) => {
  const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
  if (!Number.isFinite(createdAt)) return 0;
  return Math.max(0, Math.ceil((Date.now() - createdAt) / 86400000));
};

export default function OnboardingScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { user, signOut } = useAuth();
  const { isConnected } = useNetwork();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
    objective: '',
    dietaryRestrictions: '',
  });

  const [preferences, setPreferences] = useState({
    likes: '',
    dislikes: '',
    cuisineFavorites: '',
  });

  useEffect(() => {
    const loadProgress = async () => {
      const savedStep = await AsyncStorage.getItem(ONBOARDING_STEP_KEY);
      const savedProfile = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
      const savedPreferences = await AsyncStorage.getItem(ONBOARDING_PREFERENCES_KEY);
      if (savedStep) setCurrentStep(parseInt(savedStep, 10));
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
    };
    loadProgress();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updatePreferences = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleErrorReset = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleProfileNext = async (profileOverride) => {
    if (!user?.id) return;
    if (isConnected === false) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }
    const profileToSave = profileOverride || profile;
    // Keep parent state in sync when ProfileStep passes built height/weight strings
    if (profileOverride) {
      setProfile(profileOverride);
    }
    setIsSaving(true);
    try {
      const { error } = await saveUserProfile(user.id, profileToSave);
      if (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.', [
          { text: 'OK', onPress: handleErrorReset },
        ]);
      } else {
        setCurrentStep(3);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.', [
        { text: 'OK', onPress: handleErrorReset },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    if (isConnected === false) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await saveFoodPreferences(user.id, preferences);
      if (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.', [
          { text: 'OK', onPress: handleErrorReset },
        ]);
      } else {
        await AsyncStorage.multiRemove([ONBOARDING_STEP_KEY, ONBOARDING_PROFILE_KEY, ONBOARDING_PREFERENCES_KEY]);
        capture(posthog, 'onboarding_completed', {
          persona: 'athlete',
          days_to_complete: daysSinceSignup(user),
        });
        router.replace('/(app)/dashboard');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.', [
        { text: 'OK', onPress: handleErrorReset },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F6921D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentStep > 1 && (
          <ProgressIndicator currentStep={currentStep} totalSteps={3} />
        )}

        {currentStep === 1 && (
          <WelcomeStep onNext={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && (
          <ProfileStep
            profile={profile}
            onUpdate={updateProfile}
            onNext={handleProfileNext}
            onBack={() => setCurrentStep(1)}
            isSaving={isSaving}
          />
        )}

        {currentStep === 3 && (
          <PreferencesStep
            preferences={preferences}
            onUpdate={updatePreferences}
            onComplete={handleComplete}
            onBack={() => setCurrentStep(2)}
            isSaving={isSaving}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_GRADIENT_START,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 0,
  },
});
