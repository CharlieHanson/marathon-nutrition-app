import { useState, useEffect } from 'react';
import { fetchCurrentWeekMealPlan, saveMealPlan, fetchMealPlanByWeek } from '../dataClient';

const EMPTY_WEEK = {
  monday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  tuesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  wednesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  thursday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  friday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  saturday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  sunday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
};

// Helper function to get Monday of current week
const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay();
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
  const [currentWeekStarting, setCurrentWeekStarting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load meal plan from database on mount
  useEffect(() => {
    let cancelled = false;

    if (!user || isGuest) {
      setMealPlan(EMPTY_WEEK);
      setCurrentWeekStarting(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchCurrentWeekMealPlan(user.id);
        
        if (cancelled) return;

        if (data && data.meals) {
          // Merge loaded meals with EMPTY_WEEK to ensure all fields exist (including ratings)
          const mergedMeals = { ...EMPTY_WEEK };
          Object.keys(data.meals).forEach(day => {
            if (mergedMeals[day]) {
              mergedMeals[day] = { ...mergedMeals[day], ...data.meals[day] };
            }
          });
          setMealPlan(mergedMeals);
          setCurrentWeekStarting(data.week_starting);
        } else {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(null);
        }
      } catch (e) {
        if (!cancelled) {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(null);
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

  const updateMeal = (day, mealType, value) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: value },
    }));
  };

  const rateMeal = async (day, mealType, rating) => {
    // Update local state immediately
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [`${mealType}_rating`]: rating,
      },
    }));
  
    // If user is authenticated, save rating with embedding
    if (user && !isGuest) {
      try {
        const mealDescription = mealPlan[day][mealType];
        
        // Only send if there's a meal to rate
        if (mealDescription && mealDescription.trim()) {
          await fetch('/api/rate-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              mealDescription: mealDescription,
              mealType: mealType,
              rating: rating,
              day: day,
            }),
          });
        }
      } catch (error) {
        console.error('Error saving rating:', error);
        // Don't fail - rating still works locally
      }
    }
  };

  const generateMeals = async (userProfile, foodPreferences, trainingPlan) => {
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }
  
    setIsGenerating(true);
    setStatusMessage('🔄 Generating personalized meal plan...');
  
    try {
      const weekStarting = currentWeekStarting || getMondayOfCurrentWeek();
  
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userProfile, 
          foodPreferences, 
          trainingPlan,
          userId: user?.id || null,
          weekStarting: weekStarting
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        const newMealPlan = result.meals || EMPTY_WEEK;
        setMealPlan(newMealPlan);
        setCurrentWeekStarting(weekStarting);
        
        // If user is authenticated, reload from database to confirm it saved
        if (user && !isGuest) {
          // Small delay to ensure database write completed
          setTimeout(async () => {
            await loadMealPlanByWeek(weekStarting);
          }, 500);
        }
        
        setStatusMessage('✅ Meal plan generated successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const loadMealPlanByWeek = async (weekStarting) => {
    if (!user || isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const data = await fetchMealPlanByWeek(user.id, weekStarting);
      
      if (data && data.meals) {
        // Merge loaded meals with EMPTY_WEEK to ensure all fields exist (including ratings)
        const mergedMeals = { ...EMPTY_WEEK };
        Object.keys(data.meals).forEach(day => {
          if (mergedMeals[day]) {
            mergedMeals[day] = { ...mergedMeals[day], ...data.meals[day] };
          }
        });
        setMealPlan(mergedMeals);
        setCurrentWeekStarting(data.week_starting);
        return { success: true };
      } else {
        setMealPlan(EMPTY_WEEK);
        setCurrentWeekStarting(weekStarting);
        return { success: false, error: 'No meal plan found for this week' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const saveCurrentMealPlan = async () => {
    if (!user || isGuest || !currentWeekStarting) {
      return { success: false, error: 'Cannot save meal plan' };
    }

    try {
      const { error } = await saveMealPlan(user.id, mealPlan, currentWeekStarting);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const regenerateMeal = async (day, mealType, reason, context) => {
    if (!user && !isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

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
          currentMeal: mealPlan[day][mealType],
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateMeal(day, mealType, result.meal);
        setStatusMessage(`✅ ${mealType} for ${day} regenerated!`);
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    }
  };

  return {
    mealPlan,
    updateMeal,
    rateMeal,
    generateMeals,
    regenerateMeal,
    loadMealPlanByWeek,
    saveCurrentMealPlan,
    isGenerating,
    isLoading,
    statusMessage,
    currentWeekStarting,
  };
};
