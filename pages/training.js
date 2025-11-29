import React from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/router';
import { TrainingPlanPage } from '../src/views/TrainingPlanPage';
import { useTrainingPlan } from '../src/hooks/useTrainingPlan';
import { Layout } from '../src/components/layout/Layout';

export default function TrainingPage() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const trainingPlan = useTrainingPlan(user, isGuest);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router, router.asPath]);

  // Show loading state
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
      userName={user?.user_metadata?.name}
      isGuest={isGuest}
      onSignOut={signOut}
      onDisableGuestMode={disableGuestMode}
      currentView="training"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <TrainingPlanPage
        trainingPlan={trainingPlan.plan}
        onUpdate={trainingPlan.updatePlan}
      />
    </Layout>
  );
}