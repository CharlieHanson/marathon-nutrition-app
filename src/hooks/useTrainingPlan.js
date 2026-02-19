// src/hooks/useTrainingPlan.js
import { useState, useEffect } from 'react';
import {
  fetchActiveTrainingPlan,
  fetchAllTrainingPlans,
  saveTrainingPlan,
  setActiveTrainingPlan,
  deleteTrainingPlan,
} from '../dataClient';

const EMPTY_WEEK = {
  monday:    { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  tuesday:   { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  wednesday: { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  thursday:  { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  friday:    { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  saturday:  { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
  sunday:    { workouts: [{ type: '', distance: '', intensity: 'Medium', notes: '', timing: '' }] },
};

// src/hooks/useTrainingPlan.js
export const useTrainingPlan = (user, isGuest) => {
  const [plan, setPlan] = useState(EMPTY_WEEK);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const uid = user?.id;

    console.log('useTrainingPlan effect start', { uid, isGuest });

    // Whenever user id changes, assume we need to load again
    setIsLoading(true);

    if (!uid || isGuest) {
      console.log('useTrainingPlan: no user or guest → reset & stop');
      setPlan(EMPTY_WEEK);
      setCurrentPlanId(null);
      setCurrentPlanName('');
      setSavedPlans([]);
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        console.log('useTrainingPlan: fetching active plan for', uid);
        const activePlan = await fetchActiveTrainingPlan(uid);
        if (cancelled) return;

        if (activePlan) {
          console.log('useTrainingPlan: got active plan', activePlan.id);
          setPlan(activePlan.plan_data || EMPTY_WEEK);
          setCurrentPlanId(activePlan.id);
          setCurrentPlanName(activePlan.name || '');
        } else {
          console.log('useTrainingPlan: no active plan, using empty');
          setPlan(EMPTY_WEEK);
          setCurrentPlanId(null);
          setCurrentPlanName('');
        }
      } catch (e) {
        console.error('useTrainingPlan: load failed', e);
      } finally {
        if (!cancelled) {
          console.log('useTrainingPlan: done loading');
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      console.log('useTrainingPlan: cleanup');
    };
  }, [user?.id, isGuest]);

  const loadSavedPlans = async () => {
    if (!user || isGuest) return;
    try {
      const plans = await fetchAllTrainingPlans(user.id);
      setSavedPlans(plans);
    } catch (e) {
      console.error('Load saved plans failed:', e);
    }
  };

  const updatePlan = (day, field, value) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const savePlan = async (planName) => {
    if (!user || isGuest) return { error: 'Not authenticated' };
    if (!planName || planName.trim() === '') {
      return { error: 'Plan name is required' };
    }

    setIsSaving(true);
    try {
      const { data, error } = await saveTrainingPlan(
        user.id,
        plan,
        planName.trim(),
        currentPlanId
      );

      if (!error && data) {
        setCurrentPlanId(data.id);
        setCurrentPlanName(data.name);
        await loadSavedPlans();
      }

      return { error };
    } finally {
      setIsSaving(false);
    }
  };

  const loadPlan = async (planId) => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    setIsLoading(true);
    try {
      const { data, error } = await setActiveTrainingPlan(user.id, planId);

      if (!error && data) {
        setPlan(data.plan_data);
        setCurrentPlanId(data.id);
        setCurrentPlanName(data.name);
        await loadSavedPlans();
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlan = async (planId) => {
    if (!user || isGuest) return { error: 'Not authenticated' };

    try {
      const { error } = await deleteTrainingPlan(user.id, planId);

      if (!error) {
        if (planId === currentPlanId) {
          setPlan(EMPTY_WEEK);
          setCurrentPlanId(null);
          setCurrentPlanName('');
        }
        await loadSavedPlans();
      }

      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const createNewPlan = () => {
    setPlan(EMPTY_WEEK);
    setCurrentPlanId(null);
    setCurrentPlanName('');
  };

  return {
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
    isLoading,
  };
};
