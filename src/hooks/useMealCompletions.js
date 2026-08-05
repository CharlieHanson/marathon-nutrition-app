import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getLocalDateString } from '../dataClient';

/**
 * Today's meal completions for the authenticated user (mirrors mobile dashboard).
 */
export function useMealCompletions(user, isGuest) {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const completionsRef = useRef(completions);
  completionsRef.current = completions;

  const fetchCompletions = useCallback(async () => {
    if (!user?.id || isGuest) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const todayDate = getLocalDateString();
      const { data, error: fetchError } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', todayDate);

      if (fetchError) throw fetchError;
      setCompletions(data || []);
      setError(null);
    } catch (err) {
      console.error('useMealCompletions: fetch error', err);
      setError(err.message);
      setCompletions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isGuest]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const toggleMealCompletion = useCallback(
    async (dayOfWeek, mealType) => {
      if (!user?.id || isGuest) return;

      const todayDate = getLocalDateString();
      const existing = completionsRef.current.find(
        (c) => c.day_of_week === dayOfWeek && c.meal_type === mealType
      );

      try {
        if (existing) {
          const { error: deleteError } = await supabase
            .from('meal_completions')
            .delete()
            .eq('id', existing.id);
          if (deleteError) throw deleteError;
          setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
        } else {
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
          setCompletions((prev) => [...prev, data]);
        }
        setError(null);
      } catch (err) {
        console.error('useMealCompletions: toggle error', err);
        setError(err.message);
        throw err;
      }
    },
    [user?.id, isGuest]
  );

  return {
    completions,
    loading,
    error,
    toggleMealCompletion,
    refetch: fetchCompletions,
  };
}
