// pages/training.js
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { Layout } from '../src/components/layout/Layout';
import { TrainingPlanPage } from '../src/views/TrainingPlanPage';
import { useTrainingPlan } from '../src/hooks/useTrainingPlan';
import { useUserProfile } from '../src/hooks/useUserProfile';

export default function TrainingPage() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const { profile } = useUserProfile(user, isGuest);

  const {
    plan,
    currentPlanId,
    currentPlanName,
    savedPlans,
    updatePlan,
    savePlan,
    loadPlan,
    deletePlan,
    createNewPlan,
    loadSavedPlans,
    isSaving,
    isLoading: trainingIsLoading,
  } = useTrainingPlan(user, isGuest);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router]);

  // 🔸 Only gate on auth loading here
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    );
  }

  // Redirect in progress
  if (!user && !isGuest) {
    return null;
  }

  return (
    <Layout
      user={user}
      userName={profile?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="training"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <TrainingPlanPage
        trainingPlan={plan}
        currentPlanName={currentPlanName}
        savedPlans={savedPlans}
        onUpdate={updatePlan}
        onSave={savePlan}
        onLoadPlan={loadPlan}
        onDeletePlan={deletePlan}
        onCreateNew={createNewPlan}
        onLoadSavedPlans={loadSavedPlans}
        isSaving={isSaving}
        isLoading={trainingIsLoading}
      />
    </Layout>
  );
}
