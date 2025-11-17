// src/App.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { Layout } from './components/layout/Layout';
import { ProfilePage } from '../pages/ProfilePage';
import { TrainingPlanPage } from '../pages/TrainingPlanPage';
import { FoodPreferencesPage } from '../pages/FoodPreferencesPage';
import { MealPlanPage } from '../pages/MealPlanPage';
import { useUserProfile } from './hooks/useUserProfile';
import { useFoodPreferences } from './hooks/useFoodPreferences';
import { useTrainingPlan } from './hooks/useTrainingPlan';
import { useMealPlan } from './hooks/useMealPlan';
import { checkOnboardingStatus } from './dataClient';
import { OnboardingFlow } from '../pages/OnboardingFlow';
import { LandingPage } from '../pages/LandingPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UpdatePasswordPage } from '../pages/UpdatePasswordPage';

const App = () => {
  // Check for update-password route BEFORE any other rendering logic
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path === '/update-password' || path.includes('update-password')) {
      return <UpdatePasswordPage />;
    }
  }

  const { user, signOut, loading, isGuest, disableGuestMode, enableGuestMode } = useAuth();
  
  // Initialize currentView from URL hash (only on client-side)
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      return hash || 'training';
    }
    return 'training';
  });
  
  const [userName, setUserName] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  const profile = useUserProfile(user, isGuest, reloadKey);
  const preferences = useFoodPreferences(user, isGuest, reloadKey);
  const trainingPlan = useTrainingPlan(user, isGuest);
  const mealPlan = useMealPlan(user, isGuest);

  const userId = user?.id;

  // Listen for hash changes (back/forward buttons, manual hash changes)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setCurrentView(hash);
      } else {
        setCurrentView('training');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation function that updates both state and URL
  const navigateToView = (view) => {
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
    setCurrentView(view);
  };

  useEffect(() => {
    if (!userId || isGuest) {
      setUserName(null);
      return;
    }

    let cancelled = false;

    const loadUserName = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', userId)
        .single();

      if (!cancelled && data && !error) {
        setUserName(data.name);
      }
    };

    loadUserName();

    return () => {
      cancelled = true;
    };
  }, [userId, isGuest]);

  useEffect(() => {
    // Force reload of all data when user changes
    setReloadKey(prev => prev + 1);
  }, [user?.id]);

  // Check if user needs onboarding
  useEffect(() => {
    async function checkOnboarding() {
      if (!user || isGuest) {
        setCheckingOnboarding(false);
        setNeedsOnboarding(false);
        return;
      }

      const status = await checkOnboardingStatus(user.id);
      setNeedsOnboarding(!status.hasCompletedOnboarding);
      setCheckingOnboarding(false);
    }

    checkOnboarding();
  }, [user, isGuest]);

  // Reset to training page whenever user logs in
  /*
  useEffect(() => {
    if (user && !isGuest && !needsOnboarding && !checkingOnboarding) {
      navigateToView('training');
    }
  }, [user, isGuest, needsOnboarding, checkingOnboarding]); */

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user && !isGuest) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />;
    }
    return (
      <LandingPage
        onSignIn={() => setShowAuth(true)}
        onSignUp={() => setShowAuth(true)}
        onViewDemo={() => {
          enableGuestMode();
        }}
      />
    );
  }

  // Show onboarding for new users
  if (needsOnboarding && !isGuest) {
    return (
      <OnboardingFlow
        user={user}
        onComplete={() => {
          setNeedsOnboarding(false);
          setReloadKey(prev => prev + 1);
          navigateToView('training');
        }}
      />
    );
  }

  return (
    <Layout
      user={user}
      userName={userName}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView={currentView}
      onViewChange={navigateToView}
    >
      {currentView === 'profile' && (
        <ProfilePage
          profile={profile.profile}
          onUpdate={profile.updateProfile}
          onSave={profile.saveProfile}
          isSaving={profile.isSaving}
          isGuest={isGuest}
        />
      )}

      {currentView === 'training' && (
        <TrainingPlanPage
          trainingPlan={trainingPlan.plan}
          onUpdate={trainingPlan.updatePlan}
        />
      )}

      {currentView === 'preferences' && (
        <FoodPreferencesPage
          preferences={preferences.preferences}
          onUpdate={preferences.updatePreferences}
          onSave={preferences.savePreferences}
          isSaving={preferences.isSaving}
          isGuest={isGuest}
        />
      )}

      {currentView === 'meals' && (
        <MealPlanPage
          mealPlan={mealPlan.mealPlan}
          onUpdate={mealPlan.updateMeal}
          onRate={mealPlan.rateMeal}
          onGenerate={() =>
            mealPlan.generateMeals(
              profile.profile,
              preferences.preferences,
              trainingPlan.plan
            )
          }
          onRegenerate={mealPlan.regenerateMeal}
          onLoadWeek={mealPlan.loadMealPlanByWeek}
          onSave={mealPlan.saveCurrentMealPlan}
          isGenerating={mealPlan.isGenerating}
          isLoading={mealPlan.isLoading}
          statusMessage={mealPlan.statusMessage}
          currentWeekStarting={mealPlan.currentWeekStarting}
          userProfile={profile.profile}
          foodPreferences={preferences.preferences}
          trainingPlan={trainingPlan.plan}
        />
      )}

      {currentView === 'settings' && (
        <SettingsPage user={user} />
      )}
    </Layout>
  );
};

export default App;