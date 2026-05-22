export const LIMITS = {
  meal_generation: 10,
  recipe_generation: 5,
  grocery_list: 3,
};

export async function checkAndIncrementUsage(supabase, userId, actionType) {
  if (!userId) return { allowed: true };

  try {
    // userId = auth UUID; fetch profile.id (PK) which is what usage_limits FK expects
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, is_unlimited')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[rateLimiter] profile fetch error:', profileError.message);
      return { allowed: true };
    }

    if (!profile) {
      console.warn('[rateLimiter] no profile found for userId:', userId);
      return { allowed: true };
    }

    if (profile.is_unlimited) return { allowed: true };

    const limit = LIMITS[actionType];
    if (!limit) return { allowed: true };

    const today = new Date().toISOString().split('T')[0];

    // Use profile.id (PK) — not userId (auth UUID) — for usage_limits FK
    const { data: newCount, error: rpcError } = await supabase.rpc('increment_usage', {
      p_user_id: profile.id,
      p_action_type: actionType,
      p_date: today,
    });

    if (rpcError) {
      console.error('[rateLimiter] increment_usage RPC error:', rpcError.message);
      return { allowed: true };
    }

    if (typeof newCount !== 'number') {
      console.warn('[rateLimiter] RPC returned unexpected value:', newCount);
      return { allowed: true };
    }

    if (newCount > limit) {
      return { allowed: false, count: newCount, limit };
    }

    return { allowed: true, count: newCount, limit };

  } catch (err) {
    console.error('[rateLimiter] unexpected error:', err.message);
    return { allowed: true };
  }
}