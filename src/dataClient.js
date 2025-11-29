import { supabase } from './supabaseClient';

// ================================================
// Helpers
// ================================================

/* ✅ NEW: fetch a user's base profile (name + type) from public.profiles */
async function fetchBaseProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, type')
    .eq('id', userId) // profiles.id == auth.user.id
    .maybeSingle();

  if (error && error.code !== 'PGRST116') return null;
  return data || null;
}

/* ✅ NEW: update the user's display name in public.profiles */
async function updateProfileName(userId, name) {
  if (typeof name !== 'string') return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', userId)
    .select()
    .maybeSingle();
  return { data, error };
}

// ================================================
// Combined personal info loaders/savers
// ================================================

export async function fetchPersonalInfo(userId) {
  try {
    // ✅ NEW: get base profile (name/type) from profiles
    const baseProfile = await fetchBaseProfile(userId);

    const [{ data: up }, { data: fp }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('food_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    // ✅ CHANGED: ensure callers still get a name even though it's now in profiles
    // If you want to refactor callers later, expose baseProfile separately.
    const mergedUserProfile = up
      ? { ...up, name: baseProfile?.name ?? null } // inject name from profiles
      : (baseProfile ? { name: baseProfile.name } : null);

    return {
      userProfile: mergedUserProfile || null,
      foodPreferences: fp || null,
      // ✅ NEW: also return base profile for newer code paths
      baseProfile: baseProfile || null,
    };
  } catch (_error) {
    return {
      userProfile: null,
      foodPreferences: null,
      baseProfile: null, // ✅ NEW
    };
  }
}

export async function saveUserProfile(userId, profileData) {
  // ✅ CHANGED: split writes:
  //   - profiles.name  <- profileData.name
  //   - user_profiles  <- client-only fields (no name/role)
  const writes = [];

  // ✅ write name to profiles
  if (profileData?.name) {
    writes.push(updateProfileName(userId, profileData.name));
  }

  // ✅ write client fields to user_profiles
  writes.push(
    supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          // 🚫 name removed (lives in profiles)
          // 🚫 role removed (lives in profiles.type)
          age: profileData.age ? parseInt(profileData.age) : null,
          height: profileData.height || null,
          weight: profileData.weight || null,
          goal: profileData.goal || null,
          activity_level: profileData.activityLevel || null,
          objective: profileData.objective || null,
          dietary_restrictions: profileData.dietaryRestrictions || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
  );

  const results = await Promise.allSettled(writes);

  // ✅ normalize result (prefer user_profiles payload for compatibility)
  const upResult = results.find(
    (r) => r.status === 'fulfilled' && r.value?.data && Array.isArray(r.value.data)
  );
  const data = upResult?.value?.data ?? null;
  const error =
    results.find((r) => r.status === 'fulfilled' && r.value?.error)?.value?.error ||
    results.find((r) => r.status === 'rejected')?.reason ||
    null;

  return { data, error };
}

export async function saveFoodPreferences(userId, prefs) {
  const { data, error } = await supabase
    .from('food_preferences')
    .upsert(
      {
        user_id: userId,
        likes: prefs.likes || '',
        dislikes: prefs.dislikes || '',
        cuisine_favorites: prefs.cuisineFavorites || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select();

  return { data, error };
}

// ================================================
// Training Plans (NEW SCHEMA)
// ================================================

export async function saveTrainingPlan(userId, planData, name, planId = null) {
  console.log('💾 Saving training plan:', { userId, name, planId });

  try {
    // If updating existing plan
    if (planId) {
      const { data, error } = await supabase
        .from('training_plans')
        .update({
          name: name,
          plan_data: planData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }

    // Creating new plan - first deactivate all other plans
    await supabase
      .from('training_plans')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Insert new plan as active
    const { data, error } = await supabase
      .from('training_plans')
      .insert({
        user_id: userId,
        name: name,
        plan_data: planData,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Training plan saved:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Save training plan error:', error);
    return { data: null, error };
  }
}

export async function fetchActiveTrainingPlan(userId) {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active training plan:', error);
    return null;
  }

  return data;
}

export async function fetchAllTrainingPlans(userId) {
  const { data, error } = await supabase
    .from('training_plans')
    .select('id, name, created_at, is_active')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all training plans:', error);
    return [];
  }

  return data || [];
}

export async function setActiveTrainingPlan(userId, planId) {
  try {
    // Deactivate all plans
    await supabase
      .from('training_plans')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Activate selected plan
    const { data, error } = await supabase
      .from('training_plans')
      .update({ is_active: true })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error setting active training plan:', error);
    return { data: null, error };
  }
}

export async function deleteTrainingPlan(userId, planId) {
  const { error } = await supabase
    .from('training_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId);

  return { error };
}

// DEPRECATED - keeping for backwards compatibility during migration
export async function fetchTrainingPlan(userId) {
  return fetchActiveTrainingPlan(userId);
}

// ================================================
// Onboarding status
// ================================================
export async function checkOnboardingStatus(userId) {
  try {
    // 1) Core profile fields from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('age, height, weight, objective')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('checkOnboardingStatus: user_profiles error:', profileError);
    }

    const hasCoreProfile =
      !!profile &&
      profile.age != null &&
      profile.height &&
      profile.weight &&
      profile.objective;

    // 2) Preferences exist?
    const { data: preferences, error: prefsError } = await supabase
      .from('food_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('checkOnboardingStatus: food_preferences error:', prefsError);
    }

    const hasPreferences = !!preferences?.id;

    const hasCompletedOnboarding = hasCoreProfile && hasPreferences;

    return {
      hasCompletedOnboarding,
      hasProfile: hasCoreProfile,   // keep this key for backward compat
      hasPreferences,
    };
  } catch (error) {
    console.error('checkOnboardingStatus: unexpected error:', error);
    return {
      hasCompletedOnboarding: false,
      hasProfile: false,
      hasPreferences: false,
    };
  }
}


// ================================================
// Meal Plans
// ================================================

export async function saveMealPlan(userId, meals, weekStarting) {
  // First try to find existing record
  const { data: existing } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  let data, error;

  if (existing) {
    ({ data, error } = await supabase
      .from('meal_plans')
      .update({
        meals: meals,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select());
  } else {
    ({ data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        meals: meals,
        week_starting: weekStarting,
        updated_at: new Date().toISOString(),
      })
      .select());
  }

  return { data, error };
}

// Get Monday of current week
function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export async function fetchCurrentWeekMealPlan(userId) {
  const weekStarting = getMondayOfCurrentWeek();

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return null;
  }

  return data;
}

export async function fetchMealPlanByWeek(userId, weekStarting) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return null;
  }

  return data;
}

export async function fetchAllMealPlans(userId) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .order('week_starting', { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}
