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

  // Load from DB
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user || isGuest) return;

      try {
        const data = await fetchTrainingPlan(user.id);
        if (cancelled) return;

        if (data) {
          setPlan(data);
        }
      } catch (e) {
        console.error('Load training plan failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

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