/**
 * Server-side daily rate limiter.
 * Uses the increment_usage RPC (atomic upsert) to avoid read-then-write races.
 *
 * Usage:
 *   import { checkAndIncrementUsage } from '../lib/rateLimiter.js';
 *   const { allowed, limit } = await checkAndIncrementUsage(supabase, userId, 'meal_generation');
 *   if (!allowed) return res.status(429).json({ success: false, error: 'Daily limit reached.', limitReached: true, limit });
 */

export const LIMITS = {
  meal_generation: 10,
  recipe_generation: 5,
  grocery_list: 3,
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Service role client
 * @param {string|null|undefined} userId
 * @param {'meal_generation'|'recipe_generation'|'grocery_list'} actionType
 * @returns {Promise<{ allowed: boolean, count?: number, limit?: number }>}
 */
export async function checkAndIncrementUsage(supabase, userId, actionType) {
  // Guests / unauthenticated requests are not rate-limited server-side
  if (!userId) return { allowed: true };

  try {
    // 1. Check is_unlimited on user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_unlimited')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile?.is_unlimited) return { allowed: true };

    const limit = LIMITS[actionType];
    if (!limit) return { allowed: true }; // unknown action type — fail open

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)

    // 2. Atomically increment via RPC — returns the new count
    const { data: newCount, error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_action_type: actionType,
      p_date: today,
    });

    if (error) {
      console.error('[rateLimiter] increment_usage RPC error:', error.message);
      // Fail open so a DB hiccup never blocks a user entirely
      return { allowed: true };
    }

    // 3. Over limit? The DB count is already incremented, which is acceptable.
    if (newCount > limit) {
      return { allowed: false, count: newCount, limit };
    }

    return { allowed: true, count: newCount, limit };
  } catch (err) {
    console.error('[rateLimiter] unexpected error:', err.message);
    return { allowed: true }; // fail open
  }
}
