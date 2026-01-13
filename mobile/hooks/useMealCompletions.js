import { useState, useEffect } from 'react';
import { supabase } from '../../shared/lib/supabase.native';

// Get current day of week in lowercase (e.g., 'monday')
const getCurrentDayOfWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon,...
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[day];
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

export const useMealCompletions = (user, isGuest) => {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalMeals = 5;

  // Fetch today's completions
  const fetchCompletions = async () => {
    if (isGuest || !user?.id) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const todayDate = getTodayDate();
      const { data, error: fetchError } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', todayDate);

      if (fetchError) throw fetchError;

      setCompletions(data || []);
    } catch (err) {
      console.error('Error fetching meal completions:', err);
      setError(err.message);
      setCompletions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [user?.id, isGuest]);

  // Toggle meal completion: insert if not exists, delete if exists
  const toggleMealCompletion = async (dayOfWeek, mealType) => {
    if (isGuest || !user?.id) return;

    try {
      const todayDate = getTodayDate();
      
      // Check if completion exists
      const existing = completions.find(
        (c) => c.day_of_week === dayOfWeek && c.meal_type === mealType
      );

      if (existing) {
        // Delete completion
        const { error: deleteError } = await supabase
          .from('meal_completions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        // Update local state
        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        // Insert completion
        const { data, error: insertError } = await supabase
          .from('meal_completions')
          .insert({
            user_id: user.id,
            completion_date: todayDate,
            day_of_week: dayOfWeek,
            meal_type: mealType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update local state
        setCompletions((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Error toggling meal completion:', err);
      setError(err.message);
      // Refetch to ensure consistency
      fetchCompletions();
    }
  };

  const completedCount = completions.length;

  return {
    completions,
    loading,
    error,
    toggleMealCompletion,
    completedCount,
    totalMeals,
    refetch: fetchCompletions,
  };
};

export { getCurrentDayOfWeek, getTodayDate, MEAL_TYPES };
