import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchCurrentWeekMealPlan, fetchMealPlanByWeek, saveMealPlan } from '../../shared/lib/dataClient';
import { apiClient, authenticatedFetch, getApiUrl } from '../../shared/services/api';
import { resolveMealToggles } from '../../shared/lib/mealSlots';
import { getActiveMealTypes, isPastDay } from '../utils/mealHelpers';
import { usePostHog } from 'posthog-react-native';
import { capture } from '../lib/analytics';
import { useAuth } from './AuthContext';
import { useStaleAppStateRevalidate } from './dataCacheUtils';

const MealPlanStateContext = createContext(null);
const MealPlanActionsContext = createContext(null);

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

const getMealPlanSummary = (week = {}) => {
  let mealCount = 0;
  let hasSnacks = false;
  let hasDessert = false;

  Object.values(week || {}).forEach((dayMeals) => {
    MEAL_TYPES.forEach((mealType) => {
      const meal = dayMeals?.[mealType];
      if (meal && typeof meal === 'string' && meal.trim() && meal !== '__generating__') {
        mealCount += 1;
        if (mealType === 'snacks') hasSnacks = true;
        if (mealType === 'dessert') hasDessert = true;
      }
    });
  });

  return { meal_count: mealCount, has_snacks: hasSnacks, has_dessert: hasDessert };
};

// Helper to capitalize day name
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const initialLoadingFor = (userId, isGuest) => Boolean(userId && !isGuest);

const mergeWeekMeals = (meals) => {
  const merged = { ...EMPTY_WEEK };
  Object.keys(meals || {}).forEach((day) => {
    if (merged[day]) {
      merged[day] = { ...merged[day], ...meals[day] };
    }
  });
  return merged;
};

export function MealPlanProvider({ children }) {
  const { user, isGuest } = useAuth();
  const userId = user?.id ?? null;
  const posthog = usePostHog();

  const [cacheKey, setCacheKey] = useState(userId);
  const [mealPlan, setMealPlan] = useState(EMPTY_WEEK);
  const mealPlanRef = useRef(EMPTY_WEEK);
  mealPlanRef.current = mealPlan;

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentWeekStarting, setCurrentWeekStarting] = useState(getMondayOfCurrentWeek());
  const [isLoading, setIsLoading] = useState(() => initialLoadingFor(userId, isGuest));
  const [isValidating, setIsValidating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  /** Skip the first auto-save after a successful fetch/hydration. */
  const skipNextAutoSaveRef = useRef(false);

  const hasDataRef = useRef(false);
  const lastFetchedAtRef = useRef(null);
  const inflightRef = useRef(null);
  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);
  const currentWeekStartingRef = useRef(currentWeekStarting);

  userRef.current = user;
  isGuestRef.current = isGuest;
  currentWeekStartingRef.current = currentWeekStarting;
  hasDataRef.current = hasData;
  lastFetchedAtRef.current = lastFetchedAt;

  // Clear synchronously when userId changes (including logout → null).
  if (cacheKey !== userId) {
    setCacheKey(userId);
    setMealPlan(EMPTY_WEEK);
    mealPlanRef.current = EMPTY_WEEK;
    setIsGenerating(false);
    setStatusMessage('');
    setCurrentWeekStarting(getMondayOfCurrentWeek());
    setIsLoading(initialLoadingFor(userId, isGuest));
    setIsValidating(false);
    setFetchError(null);
    setHasData(false);
    setLastFetchedAt(null);
    hasDataRef.current = false;
    lastFetchedAtRef.current = null;
    inflightRef.current = null;
    skipNextAutoSaveRef.current = false;
  }

  const loadCurrentWeek = useCallback(async ({ background = false } = {}) => {
    const uid = userRef.current?.id;
    const guest = isGuestRef.current;

    if (!uid || guest) {
      console.log('MealPlanProvider: no user or guest → reset & stop');
      setMealPlan(EMPTY_WEEK);
      mealPlanRef.current = EMPTY_WEEK;
      setCurrentWeekStarting(getMondayOfCurrentWeek());
      setIsLoading(false);
      setIsValidating(false);
      setHasData(false);
      hasDataRef.current = false;
      return;
    }

    if (inflightRef.current) {
      console.log('MealPlanProvider: dedup — joining in-flight request');
      return inflightRef.current;
    }

    const alreadyHasData = hasDataRef.current;
    if (alreadyHasData || background) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }

    const promise = (async () => {
      try {
        const week = getMondayOfCurrentWeek();
        console.log('MealPlanProvider: fetching current week', {
          userId: uid,
          weekStarting: week,
        });

        const data = await fetchCurrentWeekMealPlan(uid);
        if (userRef.current?.id !== uid) return;

        if (data && data.meals) {
          const merged = mergeWeekMeals(data.meals);
          skipNextAutoSaveRef.current = true;
          setMealPlan(merged);
          mealPlanRef.current = merged;
          setCurrentWeekStarting(data.week_starting || week);
        } else {
          console.log('MealPlanProvider: no existing mealPlan row → empty week');
          skipNextAutoSaveRef.current = true;
          setMealPlan(EMPTY_WEEK);
          mealPlanRef.current = EMPTY_WEEK;
          setCurrentWeekStarting(week);
        }
        setFetchError(null);
        setHasData(true);
        hasDataRef.current = true;
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      } catch (err) {
        console.error('MealPlanProvider: error loading meal plan', err);
        if (userRef.current?.id !== uid) return;
        setFetchError('Failed to load meal plan');
        // Keep displayed data on error when we already have some.
        if (!hasDataRef.current) {
          setMealPlan(EMPTY_WEEK);
          mealPlanRef.current = EMPTY_WEEK;
          setCurrentWeekStarting(getMondayOfCurrentWeek());
        }
      } finally {
        if (userRef.current?.id === uid) {
          setIsLoading(false);
          setIsValidating(false);
        }
        if (inflightRef.current === promise) {
          inflightRef.current = null;
        }
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, []);

  const refetchCurrentWeek = useCallback(() => {
    setFetchError(null);
    return loadCurrentWeek({ background: hasDataRef.current });
  }, [loadCurrentWeek]);

  useEffect(() => {
    if (!userId || isGuest) {
      setIsLoading(false);
      setIsValidating(false);
      return undefined;
    }
    loadCurrentWeek({ background: false });
    return undefined;
  }, [userId, isGuest, loadCurrentWeek]);

  useStaleAppStateRevalidate(loadCurrentWeek, lastFetchedAtRef, Boolean(userId && !isGuest));

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
    capture(posthog, 'meal_rated', { rating, meal_type: mealType });

    if (user && !isGuest) {
      try {
        const mealDescription = mealPlan[day][mealType];
        if (mealDescription && mealDescription.trim()) {
          await authenticatedFetch(getApiUrl('/api/rate-meal'), {
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

    // Snapshot meal slot values before SSE so we can restore if generation fails
    // (slots may be temporarily set to '__generating__' during progress events).
    const daySnapshot = { ...(mealPlan[day] || { ...EMPTY_DAY }) };

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
        setIsGenerating(false);
        return { success: true, message: 'All meals already filled' };
      }

      // Card loading states immediately — no top-of-screen status text
      emptyMealTypes.forEach((mt) => updateMeal(day, mt, '__generating__'));

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
              updateMeal(day, event.mealType, '__generating__');
            }
          } else if (event.type === 'meal' && event.mealType && event.meal) {
            updateMeal(day, event.mealType, event.meal);
          } else if (event.type === 'error') {
            console.error('Generation error:', event.message);
            setStatusMessage(`❌ Error: ${event.message}`);
            setTimeout(() => setStatusMessage(''), 5000);
          }
        }
      );

      if (result.success) {
        // Final update with all meals (in case any events were missed)
        if (result.meals && Object.keys(result.meals).length > 0) {
          Object.keys(result.meals).forEach((mealType) => {
            updateMeal(day, mealType, result.meals[mealType]);
          });
          Object.keys(result.meals).forEach((generatedMealType) => {
            capture(posthog, 'meal_generated', { meal_type: generatedMealType, day });
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
      // Restore any slots left as '__generating__' from the pre-stream snapshot
      setMealPlan((prev) => {
        const currentDay = prev[day] || {};
        const restored = { ...currentDay };
        MEAL_TYPES.forEach((mt) => {
          if (restored[mt] === '__generating__') {
            restored[mt] = daySnapshot[mt] ?? '';
          }
        });
        return { ...prev, [day]: restored };
      });
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateMeal = async (day, mealType, reason, context) => {
    const previousMeal = mealPlan[day]?.[mealType] ?? '';
    updateMeal(day, mealType, '__generating__');
    try {
      // Ensure we have all required fields
      if (!day || !mealType || !reason) {
        throw new Error('Missing required fields: day, mealType, or reason');
      }

      // Get current meal (remove macros text for context)
      // Always ensure currentMeal is a string (empty string if meal doesn't exist)
      let currentMeal = '';
      if (previousMeal && typeof previousMeal === 'string' && previousMeal.trim() && previousMeal !== '__generating__') {
        // Remove macros text for context
        currentMeal = previousMeal.replace(/\s*\(Cal:[^)]+\)\s*$/i, '').trim();
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
        capture(posthog, 'meal_regenerated', { meal_type: mealType, day });
        return { success: true };
      }
      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      updateMeal(day, mealType, previousMeal === '__generating__' ? '' : previousMeal);
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
    const previousMeal = mealPlan[day]?.[mealType] ?? '';
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
        
        capture(posthog, 'meal_generated', { meal_type: mealType, day });
        return { success: true };
      }
      throw new Error(result?.error || 'Failed to generate meal');
    } catch (error) {
      console.error('generateSingleMeal error:', error);
      updateMeal(day, mealType, previousMeal === '__generating__' ? '' : previousMeal);
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

    // Snapshot the full week before clearing so we can restore '__generating__'
    // slots (and completed days) if generation fails mid-loop.
    const weekSnapshot = {};
    DAYS.forEach((d) => {
      weekSnapshot[d] = { ...(mealPlan[d] || { ...EMPTY_DAY }) };
    });
    
    // Clear local state first
    setMealPlan(EMPTY_WEEK);

    try {
      // Generate each day sequentially
      for (const day of DAYS) {
        const togglePayload = getDayTogglePayload(day);
        const activeUiTypes = getActiveMealTypes(togglePayload);
        activeUiTypes.forEach((mt) => updateMeal(day, mt, '__generating__'));

        const result = await apiClient.generateDay(
          { 
            userId: user?.id,
            day,
            userProfile, 
            foodPreferences,
            weekStarting: currentWeekStarting,
            ...togglePayload,
          },
          // Progress callback for SSE events
          (event) => {
            if (event.type === 'status') {
              if (event.mealType && event.status === 'processing') {
                updateMeal(day, event.mealType, '__generating__');
              }
            } else if (event.type === 'meal' && event.mealType && event.meal) {
              updateMeal(day, event.mealType, event.meal);
            } else if (event.type === 'error') {
              console.error('Generation error:', event.message);
              setStatusMessage(`❌ Error: ${event.message}`);
              setTimeout(() => setStatusMessage(''), 5000);
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

      capture(posthog, 'meal_plan_generated', getMealPlanSummary(mealPlan));
      return { success: true };
    } catch (error) {
      console.error('regenerateAllMeals error:', error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      // Restore any '__generating__' slots from the pre-regeneration snapshot.
      // Keep successfully generated meals already written to state.
      setMealPlan((prev) => {
        const restored = { ...prev };
        DAYS.forEach((d) => {
          const currentDay = restored[d] || {};
          const snapDay = weekSnapshot[d] || {};
          const nextDay = { ...currentDay };
          MEAL_TYPES.forEach((mt) => {
            if (nextDay[mt] === '__generating__') {
              nextDay[mt] = snapDay[mt] ?? '';
            }
          });
          restored[d] = nextDay;
        });
        return restored;
      });
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
    const u = userRef.current;
    if (!u || isGuestRef.current) {
      return { success: false, error: 'Guests cannot browse other weeks' };
    }
    try {
      setIsLoading(true);

      console.log('MealPlanProvider: loadMealPlanByWeek', {
        userId: u.id,
        weekStarting,
      });

      const data = await fetchMealPlanByWeek(u.id, weekStarting);

      if (data && data.meals) {
        const merged = mergeWeekMeals(data.meals);
        skipNextAutoSaveRef.current = true;
        setMealPlan(merged);
        mealPlanRef.current = merged;
        setCurrentWeekStarting(data.week_starting || weekStarting);
        setHasData(true);
        hasDataRef.current = true;
        return { success: true };
      }

      skipNextAutoSaveRef.current = true;
      setMealPlan(EMPTY_WEEK);
      mealPlanRef.current = EMPTY_WEEK;
      setCurrentWeekStarting(weekStarting);
      setHasData(true);
      hasDataRef.current = true;
      return { success: false, error: 'No meal plan found for this week' };
    } catch (error) {
      console.error('MealPlanProvider: error loading week', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentMealPlan = async () => {
    const u = userRef.current;
    const week = currentWeekStartingRef.current;
    if (!u || isGuestRef.current || !week) {
      return { success: false, error: 'Cannot save meal plan' };
    }
    try {
      console.log('MealPlanProvider: saving meal plan', {
        userId: u.id,
        weekStarting: week,
      });

      const { error } = await saveMealPlan(u.id, mealPlanRef.current, week);
      if (error) {
        throw new Error(error.message || 'Failed to save');
      }
      return { success: true };
    } catch (error) {
      console.error('MealPlanProvider: error saving meal plan', error);
      return { success: false, error: error.message };
    }
  };

  const getDayTogglePayload = useCallback((day) => {
    const dayData = mealPlanRef.current?.[day];
    return resolveMealToggles({
      includeSnacks: dayData?.include_snacks,
      includeDessert: dayData?.include_dessert,
    });
  }, []);

  const setDayMealToggles = useCallback(async (day, { includeSnacks, includeDessert }) => {
    const week = currentWeekStartingRef.current;
    if (isPastDay(day, week)) {
      console.warn('MealPlanProvider: cannot change toggles for a past day', day);
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

    const u = userRef.current;
    if (u && !isGuestRef.current) {
      try {
        const newPlan = updated(mealPlanRef.current);
        await saveMealPlan(u.id, newPlan, week);
      } catch (err) {
        console.error('MealPlanProvider: error saving toggle state', err);
      }
    }

    return { success: true };
  }, []);

  const clearFetchError = useCallback(() => setFetchError(null), []);

  // Single auto-save writer for the shared meal plan (exactly one timeout owner).
  useEffect(() => {
    if (!hasData || !userId || isGuest || !currentWeekStarting) return undefined;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      saveCurrentMealPlan();
    }, 2000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlan, currentWeekStarting, hasData, userId, isGuest]);

  const stateValue = useMemo(
    () => ({
      mealPlan,
      isGenerating,
      isLoading,
      isValidating,
      statusMessage,
      currentWeekStarting,
      fetchError,
      error: fetchError,
      hasData,
    }),
    [
      mealPlan,
      isGenerating,
      isLoading,
      isValidating,
      statusMessage,
      currentWeekStarting,
      fetchError,
      hasData,
    ]
  );

  const actionsValue = useMemo(
    () => ({
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
      clearFetchError,
      refetchCurrentWeek,
    }),
    // Mutation fns close over latest state; keep actions object stable enough for action-only use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mealPlan,
      currentWeekStarting,
      userId,
      isGuest,
      setDayMealToggles,
      getDayTogglePayload,
      clearFetchError,
      refetchCurrentWeek,
    ]
  );

  return (
    <MealPlanActionsContext.Provider value={actionsValue}>
      <MealPlanStateContext.Provider value={stateValue}>
        {children}
      </MealPlanStateContext.Provider>
    </MealPlanActionsContext.Provider>
  );
}

export function useMealPlanState() {
  const ctx = useContext(MealPlanStateContext);
  if (!ctx) {
    throw new Error('useMealPlanState must be used within MealPlanProvider');
  }
  return ctx;
}

export function useMealPlanActions() {
  const ctx = useContext(MealPlanActionsContext);
  if (!ctx) {
    throw new Error('useMealPlanActions must be used within MealPlanProvider');
  }
  return ctx;
}