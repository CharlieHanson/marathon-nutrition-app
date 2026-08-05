// src/pages/OnboardingFlow.js
import React, { useState } from 'react';
import { WelcomeStep } from '../components/onboarding/WelcomeStep';
import { ProfileStep } from '../components/onboarding/ProfileStep';
import { PreferencesStep } from '../components/onboarding/PreferencesStep';
import { ProgressIndicator } from '../components/onboarding/ProgressIndicator';
import { saveUserProfile, saveFoodPreferences } from '../dataClient';
import { capture } from '../lib/posthog';
import { PageDecor } from '../components/shared/PageDecor';

const daysSinceSignup = (user) => {
  const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
  if (!Number.isFinite(createdAt)) return 0;
  return Math.max(0, Math.ceil((Date.now() - createdAt) / 86400000));
};

export const OnboardingFlow = ({ user, onComplete }) => {
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

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updatePreferences = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileNext = async (profileToSave) => {
    setIsSaving(true);
    try {
      const profileData = profileToSave ?? profile;
      const { error } = await saveUserProfile(user.id, profileData);
      if (error) {
        alert('Failed to save profile. Please try again.');
      } else {
        setCurrentStep(3);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const { error } = await saveFoodPreferences(user.id, preferences);
      if (error) {
        console.warn('OnboardingFlow: saveFoodPreferences failed', error);
        alert('Preferences could not be saved, but your setup is complete. You can update them later in settings.');
      }
      capture('onboarding_completed', {
        persona: 'athlete',
        days_to_complete: daysSinceSignup(user),
      });
      onComplete();
    } catch (error) {
      console.warn('OnboardingFlow: handleComplete error', error);
      capture('onboarding_completed', {
        persona: 'athlete',
        days_to_complete: daysSinceSignup(user),
      });
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cream py-12 px-4 overflow-hidden">
      <PageDecor />
      <div className="relative z-10">
      {currentStep > 1 && (
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />
      )}

      {currentStep === 1 && <WelcomeStep onNext={() => setCurrentStep(2)} />}

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
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default OnboardingFlow;