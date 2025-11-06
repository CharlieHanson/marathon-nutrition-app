import { useState, useEffect } from 'react';
import { fetchTrainingPlan, saveTrainingPlan } from '../dataClient';

const EMPTY_WEEK = {
  monday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  tuesday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  wednesday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  thursday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  friday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  saturday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
  sunday: { workouts: [{ type: '', distance: '', intensity: 5, notes: '' }] },
};

export const useTrainingPlan = (user, isGuest) => {
  const [plan, setPlan] = useState(EMPTY_WEEK);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // If logged out or guest → clear plan
    if (!user || isGuest) {
      setPlan(EMPTY_WEEK);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const data = await fetchTrainingPlan(user.id);
        if (cancelled) return;

        if (data) {
          setPlan(data);
        } else {
          setPlan(EMPTY_WEEK);
        }
      } catch (e) {
        console.error('Load training plan failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

  const updatePlan = (day, field, value) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const savePlan = async () => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsSaving(true);
    try {
      const { error } = await saveTrainingPlan(user.id, plan);
      return { error };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    plan,
    updatePlan,
    savePlan,
    isSaving,
  };
};
