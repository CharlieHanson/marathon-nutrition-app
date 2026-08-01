// pages/training.js
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { Layout } from '../src/components/layout/Layout';
import { TrainingPlanPage } from '../src/views/TrainingPlanPage';
import { useWorkoutLog } from '../src/hooks/useWorkoutLog';
import { useUserProfile } from '../src/hooks/useUserProfile';

export default function TrainingPage() {
  const router = useRouter();
  const { user, loading, isGuest, signOut, disableGuestMode } = useAuth();
  const { profile } = useUserProfile(user, isGuest);

  const workoutLog = useWorkoutLog(user, isGuest);

  React.useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, isGuest, router]);

  // Flush all pending saves on route leave
  useEffect(() => {
    const handleRouteChange = () => {
      void workoutLog.flushPendingSaves();
    };
    router.events?.on?.('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off?.('routeChangeStart', handleRouteChange);
      void workoutLog.flushPendingSaves();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
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
      currentView="training"
      onViewChange={(view) => router.push(`/${view}`)}
    >
      <TrainingPlanPage
        selectedDate={workoutLog.selectedDate}
        weekStarting={workoutLog.weekStarting}
        getWorkoutsForDate={workoutLog.getWorkoutsForDate}
        updateDayWorkouts={workoutLog.updateDayWorkouts}
        setSelectedDate={workoutLog.setSelectedDate}
        goToPreviousWeek={workoutLog.goToPreviousWeek}
        goToNextWeek={workoutLog.goToNextWeek}
        isSaving={workoutLog.isSaving}
        isLoading={workoutLog.isLoading}
        error={workoutLog.error}
        onClearError={workoutLog.clearError}
      />
    </Layout>
  );
}
