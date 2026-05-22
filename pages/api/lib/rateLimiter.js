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

    // 2. Try atomic RPC increment first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_action_type: actionType,
      p_date: today,
    });

    let finalCount;

    if (rpcError || typeof rpcResult !== 'number' || rpcResult === null) {
      if (rpcError) {
        console.error('[rateLimiter] increment_usage RPC error:', rpcError.message, '— using fallback');
      } else {
        console.warn('[rateLimiter] RPC returned unexpected value:', rpcResult, '— using fallback');
      }

      // Fallback: read current count, increment manually, upsert
      // Service role bypasses RLS so the write is permitted
      const { data: row } = await supabase
        .from('usage_limits')
        .select('count')
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .eq('date', today)
        .maybeSingle();

      finalCount = (row?.count ?? 0) + 1;

      const { error: upsertErr } = await supabase
        .from('usage_limits')
        .upsert(
          { user_id: userId, action_type: actionType, date: today, count: finalCount },
          { onConflict: 'user_id,action_type,date' }
        );

      if (upsertErr) {
        console.error('[rateLimiter] fallback upsert error:', upsertErr.message);
        return { allowed: true }; // Still fail open if DB is completely unavailable
      }
    } else {
      finalCount = rpcResult;
    }

    // 3. Over limit?
    if (finalCount > limit) {
      return { allowed: false, count: finalCount, limit };
    }

    return { allowed: true, count: finalCount, limit };
  } catch (err) {
    console.error('[rateLimiter] unexpected error:', err.message);
    return { allowed: true }; // fail open
  }
}
