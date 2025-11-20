import { useState, useEffect } from 'react';
import { fetchTrainingPlan, saveTrainingPlan } from '../dataClient';

const EMPTY_DAY = { type: '', distance: '', intensity: 5, notes: '' };            // ✅
const EMPTY_WEEK = {
  monday:   { workouts: [ { ...EMPTY_DAY } ] },
  tuesday:  { workouts: [ { ...EMPTY_DAY } ] },
  wednesday:{ workouts: [ { ...EMPTY_DAY } ] },
  thursday: { workouts: [ { ...EMPTY_DAY } ] },
  friday:   { workouts: [ { ...EMPTY_DAY } ] },
  saturday: { workouts: [ { ...EMPTY_DAY } ] },
  sunday:   { workouts: [ { ...EMPTY_DAY } ] },
};

export const useTrainingPlan = (user, isGuest) => {
  const [plan, setPlan] = useState(EMPTY_WEEK);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user || isGuest) {
      setPlan(EMPTY_WEEK);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const data = await fetchTrainingPlan(user.id);
        if (cancelled) return;

        // ✅ Always merge into EMPTY_WEEK so missing days/fields won’t crash pages
        if (data && typeof data === 'object') {
          const merged = { ...EMPTY_WEEK };
          Object.keys(merged).forEach((day) => {
            const incoming = data[day];
            if (incoming && typeof incoming === 'object') {
              merged[day] = {
                ...merged[day],
                ...incoming,
                workouts: Array.isArray(incoming.workouts) && incoming.workouts.length > 0
                  ? incoming.workouts
                  : [ { ...EMPTY_DAY } ],
              };
            }
          });
          setPlan(merged);
        } else {
          setPlan(EMPTY_WEEK);
        }
      } catch {
        setPlan(EMPTY_WEEK); // ✅ ensure safe fallback
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, isGuest]);

  const updatePlan = (day, field, value) => {
    // ✅ Guard for unknown day keys
    if (!day || !(day in plan)) return;
    setPlan((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { workouts: [ { ...EMPTY_DAY } ] }), [field]: value },  // ✅
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

  return { plan, updatePlan, savePlan, isSaving };
};
