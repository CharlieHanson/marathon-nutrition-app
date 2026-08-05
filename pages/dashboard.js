import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { Layout } from '../src/components/layout/Layout';
import { DashboardPage } from '../src/views/DashboardPage';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useMealPlan } from '../src/hooks/useMealPlan';
import { useWorkoutLog } from '../src/hooks/useWorkoutLog';
import { useMealCompletions } from '../src/hooks/useMealCompletions';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const { profile } = useUserProfile(user, isGuest);
  const mealPlan = useMealPlan(user, isGuest);
  const workoutLog = useWorkoutLog(user, isGuest);
  const mealCompletions = useMealCompletions(user, isGuest);

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
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
      userName={profile?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="dashboard"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <DashboardPage
        profile={profile}
        isGuest={isGuest}
        user={user}
        mealPlan={mealPlan.mealPlan}
        mealPlanLoading={mealPlan.isLoading}
        getWorkoutsForDate={workoutLog.getWorkoutsForDate}
        workoutLoading={workoutLog.isLoading}
        completions={mealCompletions.completions}
        toggleMealCompletion={mealCompletions.toggleMealCompletion}
        onNavigate={(view) => router.push(`/${view}`)}
      />
    </Layout>
  );
}
