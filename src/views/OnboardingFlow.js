// src/pages/OnboardingFlow.js
import React, { useState } from 'react';
import { WelcomeStep } from '../components/onboarding/WelcomeStep';
import { ProfileStep } from '../components/onboarding/ProfileStep';
import { PreferencesStep } from '../components/onboarding/PreferencesStep';
import { ProgressIndicator } from '../components/onboarding/ProgressIndicator';
import { saveUserProfile, saveFoodPreferences } from '../dataClient';

export const OnboardingFlow = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    age: '',
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

  const handleProfileNext = async () => {
    setIsSaving(true);
    try {
      const { error } = await saveUserProfile(user.id, profile);
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
        alert('Failed to save preferences. Please try again.');
      } else {
        // Mark onboarding as complete
        onComplete();
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-12 px-4">
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
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default OnboardingFlow;