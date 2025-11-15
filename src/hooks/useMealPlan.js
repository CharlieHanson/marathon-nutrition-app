// src/hooks/useMealPlan.js
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

// Get Monday of current week (YYYY-MM-DD)
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

  // Load the current week on mount for signed-in users
  useEffect(() => {
    let cancelled = false;

    // Guests: keep local-only state; no DB reads
    if (!user || isGuest) {
      setMealPlan(EMPTY_WEEK);
      setCurrentWeekStarting(getMondayOfCurrentWeek()); // let guests still see "Week of ..."
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchCurrentWeekMealPlan(user.id);
        if (cancelled) return;

        if (data && data.meals) {
          const merged = { ...EMPTY_WEEK };
          Object.keys(data.meals).forEach((day) => {
            if (merged[day]) merged[day] = { ...merged[day], ...data.meals[day] };
          });
          setMealPlan(merged);
          setCurrentWeekStarting(data.week_starting);
        } else {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(getMondayOfCurrentWeek());
        }
      } catch {
        if (!cancelled) {
          setMealPlan(EMPTY_WEEK);
          setCurrentWeekStarting(getMondayOfCurrentWeek());
        }
      } finally {
        if (!cancelled) setIsLoading(false);
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
    // Optimistic local update
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
        // ignore; local rating still stands
      }
    }
  };

  const generateMeals = async (userProfile, foodPreferences, trainingPlan) => {
    // Let guests generate locally; signed-in users persist
    const weekStarting = currentWeekStarting || getMondayOfCurrentWeek();
  
    setIsGenerating(true);
    setStatusMessage('🔄 Generating personalized meal plan…');
  
    try {
      const resp = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          foodPreferences,
          trainingPlan,
          userId: user && !isGuest ? user.id : null,
          weekStarting,
        }),
      });
  
      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Request failed: ${errText}`);
      }
  
      // Reset the local week so the UI can fill in day-by-day
      setMealPlan(EMPTY_WEEK);
      setCurrentWeekStarting(weekStarting);
  
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  
      const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
  
        for (const chunk of chunks) {
          const lines = chunk.split('\n');
          const evtLine = lines.find((l) => l.startsWith('event: '));
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!evtLine || !dataLine) continue;
  
          const evt = evtLine.replace('event: ', '').trim();
          const data = JSON.parse(dataLine.replace('data: ', ''));
  
          if (evt === 'status') {
            setStatusMessage(`🔄 ${data.message}`);
          } else if (evt === 'day') {
            const { day, meals } = data;
            if (!DAYS.includes(day)) continue;
            // Merge new day into state so textareas fill progressively
            setMealPlan((prev) => ({ ...prev, [day]: { ...prev[day], ...meals } }));
          } else if (evt === 'error') {
            setStatusMessage(`❌ ${data.message || 'Generation error'}`);
          } else if (evt === 'done') {
            setStatusMessage('✅ Meal plan generated!');
            setTimeout(() => setStatusMessage(''), 3000);
          }
        }
      }
  
      return { success: true };
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };
  

  const loadMealPlanByWeek = async (weekStarting) => {
    // Guests cannot load other weeks; keep them on current only
    if (!user || isGuest) {
      return { success: false, error: 'Guests cannot browse other weeks' };
    }

    try {
      const data = await fetchMealPlanByWeek(user.id, weekStarting);
      if (data && data.meals) {
        const merged = { ...EMPTY_WEEK };
        Object.keys(data.meals).forEach((day) => {
          if (merged[day]) merged[day] = { ...merged[day], ...data.meals[day] };
        });
        setMealPlan(merged);
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
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const regenerateMeal = async (day, mealType, reason, context) => {
    // Allow guests to regenerate locally too
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
      }
      throw new Error(result.error || 'Unknown error');
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
    generateMeals,          // now streaming/progressive
    regenerateMeal,
    loadMealPlanByWeek,
    saveCurrentMealPlan,
    isGenerating,
    isLoading,
    statusMessage,
    currentWeekStarting,
  };
};
