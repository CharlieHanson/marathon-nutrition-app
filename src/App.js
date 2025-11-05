// src/App.js
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import { Layout } from './components/layout/Layout';
import { ProfilePage } from './pages/ProfilePage';
import { TrainingPlanPage } from './pages/TrainingPlanPage';
import { FoodPreferencesPage } from './pages/FoodPreferencesPage';
import { MealPlanPage } from './pages/MealPlanPage';
import { useUserProfile } from './hooks/useUserProfile';
import { useFoodPreferences } from './hooks/useFoodPreferences';
import { useTrainingPlan } from './hooks/useTrainingPlan';
import { useMealPlan } from './hooks/useMealPlan';

const App = () => {
  const { user, signOut, loading, isGuest, disableGuestMode } = useAuth();
  const [currentView, setCurrentView] = useState('training');

  const profile = useUserProfile(user, isGuest);
  const preferences = useFoodPreferences(user, isGuest);
  const trainingPlan = useTrainingPlan(user, isGuest);
  const mealPlan = useMealPlan();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Auth />;
  }

  return (
    <Layout
      user={user}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView={currentView}
      onViewChange={setCurrentView}
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
          isGenerating={mealPlan.isGenerating}
          userProfile={profile.profile}
          foodPreferences={preferences.preferences}
          trainingPlan={trainingPlan.plan}
        />
      )}
    </Layout>
  );
};

export default App;