import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { MealPlanPage } from '../src/views/MealPlanPage';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useFoodPreferences } from '../src/hooks/useFoodPreferences';
import { useTrainingPlan } from '../src/hooks/useTrainingPlan';
import { useMealPlan } from '../src/hooks/useMealPlan';
import { useSavedMeals } from '../src/hooks/useSavedMeals';
import { Layout } from '../src/components/layout/Layout';

export default function MealsPage() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);
  
  const profile = useUserProfile(user, isGuest, reloadKey);
  const preferences = useFoodPreferences(user, isGuest, reloadKey);
  const trainingPlan = useTrainingPlan(user, isGuest);
  const mealPlan = useMealPlan(user, isGuest);
  const savedMeals = useSavedMeals(user, isGuest);

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router, router.asPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return null;
  }

  return (
    <Layout
      user={user}
      userName={profile.profile?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="meals"
      onViewChange={(view) => router.push(`/${view}`)}
    >
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
        onSaveMeal={savedMeals.saveMealToFavorites}
        isMealSaved={savedMeals.isMealSaved}
        isGuest={isGuest}
        savedMeals={savedMeals.savedMeals}
        onUseSavedMeal={savedMeals.useSavedMeal}
        onDeleteSavedMeal={savedMeals.removeSavedMeal}
      />
    </Layout>
  );
}