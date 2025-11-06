import { useState, useEffect } from 'react';

const EMPTY_WEEK = {
  monday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  tuesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  wednesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  thursday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  friday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  saturday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
  sunday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '', rating: 0 },
};

export const useMealPlan = (user, isGuest) => {
  const [mealPlan, setMealPlan] = useState(EMPTY_WEEK);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Reset meal plan whenever we lose auth or enter guest mode
  useEffect(() => {
    if (!user || isGuest) {
      setMealPlan(EMPTY_WEEK);
    }
  }, [user?.id, isGuest]);

  const updateMeal = (day, mealType, value) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: value },
    }));
  };

  const rateMeal = (day, mealType, rating) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [`${mealType}_rating`]: rating,
      },
    }));
  };

  const generateMeals = async (userProfile, foodPreferences, trainingPlan) => {
    if (!user || isGuest) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsGenerating(true);
    setStatusMessage('🔄 Generating personalized meal plan...');

    try {
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile, foodPreferences, trainingPlan }),
      });

      const result = await response.json();

      if (result.success) {
        setMealPlan(result.meals || EMPTY_WEEK);
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

  const regenerateMeal = async (day, mealType, reason, context) => {
    if (!user || isGuest) {
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
    isGenerating,
    statusMessage,
  };
};
