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
  // ✅ Always call hooks first, in the same order
  const { user, signOut, loading, isGuest, disableGuestMode, enableGuestMode } = useAuth();

  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      return hash || 'training';
    }
    return 'training';
  });

  const [isUpdatePasswordRoute, setIsUpdatePasswordRoute] = useState(false);
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

  // Detect /update-password route after mount (no conditional hooks)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setIsUpdatePasswordRoute(path === '/update-password' || path.includes('update-password'));
    }
  }, []);

  // Keep currentView synced with hash changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentView(hash || 'training');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple navigate helper (updates hash + state)
  const navigateToView = (view) => {
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
    setCurrentView(view);
  };

  // Fetch display name
  useEffect(() => {
    if (!userId || isGuest) {
      setUserName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', userId)
        .single();
      if (!cancelled && data && !error) setUserName(data.name);
    })();
    return () => { cancelled = true; };
  }, [userId, isGuest]);

  // Force reload when user changes
  useEffect(() => {
    setReloadKey((prev) => prev + 1);
  }, [user?.id]);

  // Onboarding check
  useEffect(() => {
    (async () => {
      if (!user || isGuest) {
        setCheckingOnboarding(false);
        setNeedsOnboarding(false);
        return;
      }
      const status = await checkOnboardingStatus(user.id);
      setNeedsOnboarding(!status.hasCompletedOnboarding);
      setCheckingOnboarding(false);
    })();
  }, [user, isGuest]);

  /* --------------------------- Render branches --------------------------- */

  // Show password update page when on that route
  if (isUpdatePasswordRoute) {
    return <UpdatePasswordPage />;
  }

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  // Not signed in & not guest → Landing or Auth
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

  // Onboarding flow
  if (needsOnboarding && !isGuest) {
    return (
      <OnboardingFlow
        user={user}
        onComplete={() => {
          setNeedsOnboarding(false);
          setReloadKey((prev) => prev + 1);
          navigateToView('training');
        }}
      />
    );
  }

  // Main app layout
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

      {currentView === 'settings' && <SettingsPage user={user} />}
    </Layout>
  );
};

export default App;
