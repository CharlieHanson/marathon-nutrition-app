// mobile/hooks/useMealPlan.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCurrentWeekMealPlan, fetchMealPlanByWeek, saveMealPlan } from '../../shared/lib/dataClient';
import { apiClient } from '../../shared/services/api';
import { resolveMealToggles } from '../../shared/lib/mealSlots';
import { getDayMealToggles, getActiveMealTypes, isPastDay } from '../utils/mealHelpers';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

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
  include_snacks: true,
  include_dessert: true,
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

// Helper to get API URL for mobile
const getApiUrl = (endpoint) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://alimenta-nutrition.vercel.app';
  return `${baseUrl}${endpoint}`;
};

// Helper to check if a meal slot is filled
const isMealFilled = (mealPlan, day, mealType) => {
  const meal = mealPlan?.[day]?.[mealType];
  return meal && typeof meal === 'string' && meal.trim().length > 0;
};

// Helper to count filled vs total meals
const countMeals = (mealPlan) => {
  let filled = 0;
  let total = 0;

  DAYS.forEach((day) => {
    MEAL_TYPES.forEach((mt) => {
      total++;
      if (isMealFilled(mealPlan, day, mt)) filled++;
    });
  });

  return { filled, total, allFilled: filled === total, hasAny: filled > 0 };
};

// Helper to capitalize day name
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const useMealPlan = (user, isGuest, reloadKeyProp = 0) => {
  const [mealPlan, setMealPlan] = useState(EMPTY_WEEK);
  const mealPlanRef = useRef(null);
  // Keep ref in sync so getDayTogglePayload always reads the latest plan
  mealPlanRef.current = mealPlan;
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentWeekStarting, setCurrentWeekStarting] = useState(getMondayOfCurrentWeek());
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetchCurrentWeek = useCallback(() => {
    setFetchError(null);
    setReloadKey((k) => k + 1);
  }, []);

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

        console.log('useMealPlan: fetching current week', {
          userId: user.id,
          weekStarting: week,
        });

        const data = await fetchCurrentWeekMealPlan(user.id);

        if (cancelled) return;

        if (data && data.meals) {
          const merged = { ...EMPTY_WEEK };
          Object.keys(data.meals).forEach((day) => {
            if (merged[day]) {
              merged[day] = { ...merged[day], ...data.meals[day] };
            }
          });
          setMealPlan(merged);
          setCurrentWeekStarting(data.week_starting || week);
          setFetchError(null);
        } else {
          console.log('useMealPlan: no existing mealPlan row → empty week');
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(week);
          setFetchError(null);
        }
      } catch (err) {
        console.error('useMealPlan: error loading meal plan', err);
        if (!cancelled) {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(getMondayOfCurrentWeek());
          setFetchError('Failed to load meal plan');
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
  }, [user?.id, isGuest, reloadKeyProp, reloadKey]);

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
          await fetch(getApiUrl('/api/rate-meal'), {
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

  const generateDay = async (day, userProfile, foodPreferences, trainingPlan, onDebug) => {
    console.log('🟢 generateDay called with onDebug:', !!onDebug);
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!day || !DAYS.includes(day)) {
      return { success: false, error: 'Invalid day' };
    }

    setIsGenerating(true);
    setStatusMessage(`🔄 Preparing ${capitalize(day)}'s meals...`);

    try {
      // Get existing meals for this day
      const existingDayMeals = mealPlan[day] || { ...EMPTY_DAY };
      
      // Find empty meal slots among active types only
      const togglePayload = getDayTogglePayload(day);
      const activeUiTypes = getActiveMealTypes(togglePayload);
      const emptyMealTypes = activeUiTypes.filter(mt => {
        const meal = existingDayMeals[mt];
        return !meal || typeof meal !== 'string' || !meal.trim();
      });

      if (emptyMealTypes.length === 0) {
        setStatusMessage(`✅ All meals already filled for ${capitalize(day)}!`);
        setTimeout(() => setStatusMessage(''), 3000);
        setIsGenerating(false);
        return { success: true, message: 'All meals already filled' };
      }

      const result = await apiClient.generateDay(
        { 
          userId: user?.id,
          day,
          userProfile, 
          foodPreferences,
          trainingPlan,
          weekStarting: currentWeekStarting,
          ...togglePayload,
          debug: !!onDebug, // Enable debug mode if callback provided
        },
        // Progress callback for SSE events
        (event) => {
          if (event.type === 'debug' && onDebug) {
            // Pass debug data to callback
            console.log('🟡 Debug event received in generateDay, calling onDebug');
            onDebug(event);
          } else if (event.type === 'status') {
            if (event.mealType && event.status === 'processing') {
              // Show loading indicator for this specific meal slot
              updateMeal(day, event.mealType, '__generating__');
            }
            if (event.message) {
              setStatusMessage(`🔄 ${event.message}`);
            }
          } else if (event.type === 'meal' && event.mealType && event.meal) {
            // Update meal plan as each meal arrives
            updateMeal(day, event.mealType, event.meal);
            
            // Update status to show which meal just completed
            const mealLabel = capitalize(event.mealType);
            setStatusMessage(`✅ ${mealLabel} created!`);
          } else if (event.type === 'done') {
            setStatusMessage(`✅ ${capitalize(day)}'s meals generated successfully!`);
            setTimeout(() => setStatusMessage(''), 3000);
          } else if (event.type === 'error') {
            console.error('Generation error:', event.message);
            setStatusMessage(`❌ Error: ${event.message}`);
          }
        }
      );

      if (result.success) {
        // Final update with all meals (in case any events were missed)
        if (result.meals && Object.keys(result.meals).length > 0) {
          Object.keys(result.meals).forEach((mealType) => {
            updateMeal(day, mealType, result.meals[mealType]);
          });
        }
        
        // Save to database
        if (user && !isGuest) {
          const updatedPlan = {
            ...mealPlan,
            [day]: { ...mealPlan[day], ...result.meals }
          };
          await saveMealPlan(user.id, updatedPlan, currentWeekStarting);
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to generate meals');
      }
    } catch (error) {
      console.error('generateDay error:', error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateMeal = async (day, mealType, reason, context) => {
    setStatusMessage(`🔄 Regenerating ${mealType} for ${day}...`);
    try {
      // Ensure we have all required fields
      if (!day || !mealType || !reason) {
        throw new Error('Missing required fields: day, mealType, or reason');
      }

      // Get current meal (remove macros text for context)
      // Always ensure currentMeal is a string (empty string if meal doesn't exist)
      const currentMealRaw = mealPlan[day]?.[mealType];
      let currentMeal = '';
      if (currentMealRaw && typeof currentMealRaw === 'string' && currentMealRaw.trim()) {
        // Remove macros text for context
        currentMeal = currentMealRaw.replace(/\s*\(Cal:[^)]+\)\s*$/i, '').trim();
      }

      // Extract context fields - ensure they're always objects (not undefined)
      const userProfile = context?.userProfile || null;
      const foodPreferences = context?.foodPreferences || null;
      const trainingPlan = context?.trainingPlan || null;
      const userId = context?.userId || null;

      const result = await apiClient.regenerateMeal({
        userId,
        day,
        mealType,
        reason,
        currentMeal: currentMeal, // Always a string (empty if no meal)
        userProfile,
        foodPreferences,
        trainingPlan,
        ...getDayTogglePayload(day),
      });

      if (result.success) {
        updateMeal(day, mealType, result.meal);
        setStatusMessage(`✅ ${capitalize(mealType)} for ${capitalize(day)} regenerated!`);
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

  const generateSingleMeal = async (day, mealType, context, userPrompt = null) => {
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    const { userProfile, foodPreferences, trainingPlan } = context || {};
    
    setStatusMessage(`🔄 Generating ${mealType} for ${day}...`);
    
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
        userPrompt, // Optional user suggestion/preference
        ...getDayTogglePayload(day),
      });

      if (result && result.success && result.meal) {
        updateMeal(day, mealType, result.meal);
        
        // Save to database
        if (user && !isGuest) {
          const updatedPlan = {
            ...mealPlan,
            [day]: { ...mealPlan[day], [mealType]: result.meal }
          };
          await saveMealPlan(user.id, updatedPlan, currentWeekStarting);
        }
        
        setStatusMessage(`✅ ${capitalize(mealType)} for ${capitalize(day)} generated!`);
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      }
      throw new Error(result?.error || 'Failed to generate meal');
    } catch (error) {
      console.error('generateSingleMeal error:', error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    }
  };

  // Clear all meals for the current week
  const clearAllMeals = async () => {
    setMealPlan(EMPTY_WEEK);
    
    // Also clear from database if user is logged in
    if (user && !isGuest) {
      try {
        await saveMealPlan(user.id, EMPTY_WEEK, currentWeekStarting);
      } catch (error) {
        console.error('Error clearing meals from database:', error);
      }
    }
    
    return { success: true };
  };

  // Clear and regenerate all meals (used when week is full)
  const regenerateAllMeals = async (userProfile, foodPreferences, trainingPlan) => {
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsGenerating(true);
    setStatusMessage('🔄 Clearing and regenerating all meals...');
    
    // Clear local state first
    setMealPlan(EMPTY_WEEK);

    try {
      // Generate each day sequentially
      for (const day of DAYS) {
        setStatusMessage(`🔄 Regenerating ${capitalize(day)}...`);
        
        const result = await apiClient.generateDay(
          { 
            userId: user?.id,
            day,
            userProfile, 
            foodPreferences,
            weekStarting: currentWeekStarting,
            ...getDayTogglePayload(day),
          },
          // Progress callback for SSE events
          (event) => {
            if (event.type === 'status') {
              if (event.mealType && event.status === 'processing') {
                // Show loading indicator for this specific meal slot
                updateMeal(day, event.mealType, '__generating__');
              }
              if (event.message) {
                setStatusMessage(`🔄 ${event.message}`);
              }
            } else if (event.type === 'meal' && event.mealType && event.meal) {
              updateMeal(day, event.mealType, event.meal);
              const mealLabel = capitalize(event.mealType);
              setStatusMessage(`✅ ${mealLabel} created for ${capitalize(day)}!`);
            } else if (event.type === 'done') {
              setStatusMessage(`✅ ${capitalize(day)} ready!`);
            } else if (event.type === 'error') {
              console.error('Generation error:', event.message);
              setStatusMessage(`❌ Error: ${event.message}`);
            }
          }
        );

        if (!result.success) {
          throw new Error(result.error || `Failed to regenerate ${day}`);
        }

        // Update meal plan with all meals from this day
        if (result.meals && Object.keys(result.meals).length > 0) {
          Object.keys(result.meals).forEach((mealType) => {
            updateMeal(day, mealType, result.meals[mealType]);
          });
        }
      }

      // Save to database
      if (user && !isGuest) {
        await saveMealPlan(user.id, mealPlan, currentWeekStarting);
      }

      setStatusMessage('✅ Meal plan regenerated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
      return { success: true };
    } catch (error) {
      console.error('regenerateAllMeals error:', error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear a specific day's meals
  const clearDay = async (day) => {
    if (!day || !(day in mealPlan)) return { success: false, error: 'Invalid day' };
    
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...EMPTY_DAY },
    }));
    
    // Save to database
    if (user && !isGuest) {
      try {
        const updatedPlan = { ...mealPlan, [day]: { ...EMPTY_DAY } };
        await saveMealPlan(user.id, updatedPlan, currentWeekStarting);
      } catch (error) {
        console.error('Error clearing day from database:', error);
      }
    }
    
    return { success: true };
  };

  // Clear a specific meal
  const clearMeal = async (day, mealType) => {
    if (!day || !(day in mealPlan)) return { success: false, error: 'Invalid day' };
    if (!MEAL_TYPES.includes(mealType)) return { success: false, error: 'Invalid meal type' };
    
    setMealPlan((prev) => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        [mealType]: '',
        [`${mealType}_rating`]: 0 
      },
    }));
    
    // Save to database
    if (user && !isGuest) {
      try {
        const updatedPlan = { 
          ...mealPlan, 
          [day]: { 
            ...mealPlan[day], 
            [mealType]: '',
            [`${mealType}_rating`]: 0 
          } 
        };
        await saveMealPlan(user.id, updatedPlan, currentWeekStarting);
      } catch (error) {
        console.error('Error clearing meal from database:', error);
      }
    }
    
    return { success: true };
  };

  // Get current meal count status (for UI to determine button state)
  const getMealStatus = () => countMeals(mealPlan);

  // -------- WEEK NAVIGATION / SAVE --------
  const loadMealPlanByWeek = async (weekStarting) => {
    if (!user || isGuest) {
      return { success: false, error: 'Guests cannot browse other weeks' };
    }
    try {
      setIsLoading(true);

      console.log('useMealPlan: loadMealPlanByWeek', {
        userId: user.id,
        weekStarting,
      });

      const data = await fetchMealPlanByWeek(user.id, weekStarting);

      if (data && data.meals) {
        const merged = { ...EMPTY_WEEK };
        Object.keys(data.meals).forEach((day) => {
          if (merged[day]) merged[day] = { ...merged[day], ...data.meals[day] };
        });
        setMealPlan(merged);
        setCurrentWeekStarting(data.week_starting || weekStarting);
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
      console.log('useMealPlan: saving meal plan', {
        userId: user.id,
        weekStarting: currentWeekStarting,
      });

      const { error } = await saveMealPlan(user.id, mealPlan, currentWeekStarting);
      if (error) {
        throw new Error(error.message || 'Failed to save');
      }
      return { success: true };
    } catch (error) {
      console.error('useMealPlan: error saving meal plan', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Read the current toggle state for a day and resolve to normalized booleans.
   * Reads from mealPlanRef so it always reflects the latest plan without stale closures.
   */
  const getDayTogglePayload = useCallback((day) => {
    const dayData = mealPlanRef.current?.[day];
    return resolveMealToggles({
      includeSnacks: dayData?.include_snacks,
      includeDessert: dayData?.include_dessert,
    });
  }, []);

  /**
   * Persist toggle changes for a day. Rejects past days.
   */
  const setDayMealToggles = useCallback(async (day, { includeSnacks, includeDessert }) => {
    if (isPastDay(day, currentWeekStarting)) {
      console.warn('useMealPlan: cannot change toggles for a past day', day);
      return { success: false };
    }

    const updated = (prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        include_snacks: includeSnacks,
        include_dessert: includeDessert,
      },
    });

    setMealPlan(updated);

    if (user && !isGuest) {
      try {
        const newPlan = updated(mealPlanRef.current);
        await saveMealPlan(user.id, newPlan, currentWeekStarting);
      } catch (err) {
        console.error('useMealPlan: error saving toggle state', err);
      }
    }

    return { success: true };
  }, [currentWeekStarting, isGuest, user]);

  return {
    mealPlan,
    updateMeal,
    rateMeal,
    generateDay,
    regenerateMeal,
    generateSingleMeal,
    regenerateAllMeals,
    clearAllMeals,
    clearDay,
    clearMeal,
    getMealStatus,
    loadMealPlanByWeek,
    saveCurrentMealPlan,
    setDayMealToggles,
    getDayTogglePayload,
    isGenerating,
    isLoading,
    statusMessage,
    currentWeekStarting,
    fetchError,
    clearFetchError: () => setFetchError(null),
    refetchCurrentWeek,
  };
};