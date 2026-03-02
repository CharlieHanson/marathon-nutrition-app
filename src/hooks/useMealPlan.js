// src/hooks/useMealPlan.js
import { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';

const EMPTY_DAY = {
  breakfast: '',
  lunch: '',
  dinner: '',
  dessert: '',
  snacks: '',
  breakfast_rating: 0,
  lunch_rating: 0,
  dinner_rating: 0,
  dessert_rating: 0,
  snacks_rating: 0,
};

const EMPTY_WEEK = {
  monday:    { ...EMPTY_DAY },
  tuesday:   { ...EMPTY_DAY },
  wednesday: { ...EMPTY_DAY },
  thursday:  { ...EMPTY_DAY },
  friday:    { ...EMPTY_DAY },
  saturday:  { ...EMPTY_DAY },
  sunday:    { ...EMPTY_DAY },
};

const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon,...
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export const useMealPlan = (user, isGuest, reloadKey = 0) => {
  const [mealPlan, setMealPlan] = useState(EMPTY_WEEK);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentWeekStarting, setCurrentWeekStarting] = useState(getMondayOfCurrentWeek());
  const [isLoading, setIsLoading] = useState(false);

  // -------- INITIAL / CURRENT WEEK LOAD --------
  useEffect(() => {
    let cancelled = false;

    if (!user || isGuest) {
      console.log('useMealPlan: no user or guest → reset & stop');
      setMealPlan(EMPTY_WEEK);
      setCurrentWeekStarting(getMondayOfCurrentWeek());
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        setIsLoading(true);
        const week = getMondayOfCurrentWeek();

        console.log('useMealPlan: fetching current week via /api/meal-plan', {
          userId: user.id,
          weekStarting: week,
        });

        const res = await fetch(
          `/api/meal-plan?userId=${encodeURIComponent(user.id)}&week=${encodeURIComponent(
            week
          )}`
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${text}`);
        }

        const data = await res.json();
        console.log('useMealPlan: /api/meal-plan GET data', data);
        if (cancelled) return;

        // 🔧 Support both shapes:
        // 1) { success, mealPlan: { week_starting, meals } }
        // 2) { success, week_starting, meals }
        const rawMeals =
          (data.mealPlan && data.mealPlan.meals) ||
          data.meals ||
          null;

        const weekFromData =
          (data.mealPlan && data.mealPlan.week_starting) ||
          data.week_starting ||
          week;

        if (data.success && rawMeals) {
          const merged = { ...EMPTY_WEEK };
          Object.keys(rawMeals).forEach((day) => {
            if (merged[day]) {
              merged[day] = { ...merged[day], ...rawMeals[day] };
            }
          });
          setMealPlan(merged);
          setCurrentWeekStarting(weekFromData);
        } else {
          console.log('useMealPlan: no existing mealPlan row → empty week');
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(week);
        }
      } catch (err) {
        console.error('useMealPlan: error loading meal plan', err);
        if (!cancelled) {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(getMondayOfCurrentWeek());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, reloadKey]);

  // -------- LOCAL MUTATORS --------
  const updateMeal = (day, mealType, value) => {
    if (!day || !(day in mealPlan)) return;
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: value },
    }));
  };

  const rateMeal = async (day, mealType, rating) => {
    if (!day || !(day in mealPlan)) return;
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [`${mealType}_rating`]: rating },
    }));

    if (user && !isGuest) {
      try {
        const mealDescription = mealPlan[day][mealType];
        if (mealDescription && mealDescription.trim()) {
          await fetch('/api/rate-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              mealDescription,
              mealType,
              rating,
              day,
            }),
          });
        }
      } catch {
        // ignore; local rating stands
      }
    }
  };

  const generateMeals = async (userProfile, foodPreferences, trainingPlan) => {
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsGenerating(true);
    
    // Check if we have existing meals
    const hasExistingMeals = Object.values(mealPlan).some(day =>
      day && Object.entries(day).some(([mealType, meal]) =>
        !mealType.includes('_rating') &&
        meal &&
        typeof meal === 'string' &&
        meal.trim()
      )
    );
    
    setStatusMessage(hasExistingMeals 
      ? '🔄 Generating remaining meals...' 
      : '🔄 Generating personalized meal plan...'
    );

    try {
      const data = {
        userProfile,
        foodPreferences,
        trainingPlan,
        userId: user?.id,
        weekStarting: currentWeekStarting,
        existingMeals: mealPlan,
      };

      const onProgress = (event) => {
        if (event.type === 'status' && event.message) {
          setStatusMessage(event.message);
        } else if (event.type === 'day' && event.day && event.meals) {
          setMealPlan((prev) => ({
            ...prev,
            [event.day]: { ...prev[event.day], ...event.meals },
          }));
        }
      };

      const result = await apiClient.generateMeals(data, onProgress);

      if (result.success && result.week) {
        setMealPlan((prev) => {
          const next = { ...prev };
          Object.keys(result.week).forEach((day) => {
            if (next[day]) next[day] = { ...next[day], ...result.week[day] };
          });
          return next;
        });
        setStatusMessage('✅ Meal plan generated successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else if (result.error) {
        throw new Error(result.error);
      }

      return { success: !!result.success };
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 30000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const generateDay = async (day, userProfile, foodPreferences, trainingPlan) => {
    if (!user && !isGuest) return { success: false, error: 'Not authenticated' };

    const MEAL_TYPES_LIST = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

    // Immediately mark all empty slots as generating for instant visual feedback
    const markedSlots = [];
    setMealPlan((prev) => {
      const updated = { ...prev, [day]: { ...prev[day] } };
      MEAL_TYPES_LIST.forEach((mt) => {
        const current = prev[day]?.[mt];
        if (!current || !current.trim() || current === '__generating__') {
          updated[day][mt] = '__generating__';
          markedSlots.push(mt);
        }
      });
      return updated;
    });

    setIsGenerating(true);
    setStatusMessage(`🔄 Generating meals for ${capitalize(day)}...`);

    try {
      const result = await apiClient.generateDay(
        {
          userId: user?.id,
          day,
          userProfile,
          foodPreferences,
          trainingPlan,
          weekStarting: currentWeekStarting,
        },
        (event) => {
          if (event.type === 'status') {
            if (event.message) setStatusMessage(`🔄 ${event.message}`);
          } else if (event.type === 'meal' && event.mealType && event.meal) {
            updateMeal(day, event.mealType, event.meal);
            setStatusMessage(`✅ ${capitalize(event.mealType)} done!`);
          } else if (event.type === 'done') {
            setStatusMessage(`✅ ${capitalize(day)}'s meals generated!`);
            setTimeout(() => setStatusMessage(''), 3000);
          } else if (event.type === 'error') {
            setStatusMessage(`❌ Error: ${event.message}`);
          }
        }
      );

      if (result.success && result.meals && Object.keys(result.meals).length > 0) {
        // Final pass: apply any meals that may have been missed by SSE events
        Object.keys(result.meals).forEach((mealType) => {
          updateMeal(day, mealType, result.meals[mealType]);
        });
        // Clear any slots still stuck on __generating__ (skipped/error slots)
        MEAL_TYPES_LIST.forEach((mt) => {
          if (markedSlots.includes(mt) && !result.meals[mt]) {
            updateMeal(day, mt, '');
          }
        });
        if (user && !isGuest) {
          const updatedPlan = { ...mealPlan, [day]: { ...mealPlan[day], ...result.meals } };
          await fetch('/api/meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, weekStarting: currentWeekStarting, meals: updatedPlan }),
          });
        }
      } else if (result.error) {
        throw new Error(result.error);
      }

      return { success: !!result.success };
    } catch (error) {
      // Clear any slots still showing __generating__ on failure
      markedSlots.forEach((mt) => updateMeal(day, mt, ''));
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSingleMeal = async (day, mealType, userProfile, foodPreferences, trainingPlan) => {
    if (!user && !isGuest) return { success: false, error: 'Not authenticated' };

    setStatusMessage(`🔄 Generating ${mealType} for ${capitalize(day)}...`);
    updateMeal(day, mealType, '__generating__');

    try {
      const result = await apiClient.generateSingleMeal({
        userId: user?.id,
        day,
        mealType,
        userProfile,
        foodPreferences,
        trainingPlan,
        weekStarting: currentWeekStarting,
        existingMeals: mealPlan,
      });

      if (result?.success && result.meal) {
        updateMeal(day, mealType, result.meal);
        if (user && !isGuest) {
          const updatedPlan = { ...mealPlan, [day]: { ...mealPlan[day], [mealType]: result.meal } };
          await fetch('/api/meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, weekStarting: currentWeekStarting, meals: updatedPlan }),
          });
        }
        setStatusMessage(`✅ ${capitalize(mealType)} for ${capitalize(day)} generated!`);
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      }
      throw new Error(result?.error || 'Failed to generate meal');
    } catch (error) {
      updateMeal(day, mealType, '');
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    }
  };

  const regenerateMeal = async (day, mealType, reason, context) => {
    setStatusMessage(`🔄 Regenerating ${mealType} for ${day}...`);
    try {
      const response = await fetch('/api/regenerate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...context,
          day,
          mealType,
          reason,
          currentMeal: mealPlan[day]?.[mealType] || '',
        }),
      });

      const result = await response.json();
      if (result.success) {
        updateMeal(day, mealType, result.meal);
        setStatusMessage(`✅ ${mealType} for ${day} regenerated!`);
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      }
      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    }
  };

  // -------- WEEK NAVIGATION / SAVE --------
  const loadMealPlanByWeek = async (weekStarting) => {
    if (!user || isGuest) {
      return { success: false, error: 'Guests cannot browse other weeks' };
    }
    try {
      setIsLoading(true);

      console.log('useMealPlan: loadMealPlanByWeek via /api/meal-plan', {
        userId: user.id,
        weekStarting,
      });

      const res = await fetch(
        `/api/meal-plan?userId=${encodeURIComponent(user.id)}&week=${encodeURIComponent(
          weekStarting
        )}`
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }

      const data = await res.json();
      console.log('useMealPlan: /api/meal-plan GET by week data', data);

      const rawMeals =
        (data.mealPlan && data.mealPlan.meals) ||
        data.meals ||
        null;

      const weekFromData =
        (data.mealPlan && data.mealPlan.week_starting) ||
        data.week_starting ||
        weekStarting;

      if (data.success && rawMeals) {
        const merged = { ...EMPTY_WEEK };
        Object.keys(rawMeals).forEach((day) => {
          if (merged[day]) merged[day] = { ...merged[day], ...rawMeals[day] };
        });
        setMealPlan(merged);
        setCurrentWeekStarting(weekFromData);
        return { success: true };
      } else {
        setMealPlan(EMPTY_WEEK);
        setCurrentWeekStarting(weekStarting);
        return { success: false, error: 'No meal plan found for this week' };
      }
    } catch (error) {
      console.error('useMealPlan: error loading week', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentMealPlan = async () => {
    if (!user || isGuest || !currentWeekStarting) {
      return { success: false, error: 'Cannot save meal plan' };
    }
    try {
      console.log('useMealPlan: saving meal plan via /api/meal-plan', {
        userId: user.id,
        weekStarting: currentWeekStarting,
      });

      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          weekStarting: currentWeekStarting,
          meals: mealPlan,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return { success: true };
    } catch (error) {
      console.error('useMealPlan: error saving meal plan', error);
      return { success: false, error: error.message };
    }
  };

  return {
    mealPlan,
    updateMeal,
    rateMeal,
    generateMeals,
    generateDay,
    generateSingleMeal,
    regenerateMeal,
    loadMealPlanByWeek,
    saveCurrentMealPlan,
    isGenerating,
    isLoading,
    statusMessage,
    currentWeekStarting,
  };
};
