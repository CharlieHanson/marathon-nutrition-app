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
// Training Plan
// ================================================

export async function saveTrainingPlan(userId, planData) {
  const { data, error } = await supabase
    .from('training_plans')
    .upsert(
      {
        user_id: userId,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select();

  return { data, error };
}

export async function fetchTrainingPlan(userId) {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return null;
  }
  return data?.plan_data || null;
}

// ================================================
// Onboarding status
// ================================================

export async function checkOnboardingStatus(userId) {
  try {
    // ✅ CHANGED: name now lives in profiles
    const { data: base } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle();

    const { data: preferences } = await supabase
      .from('food_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const hasCompletedOnboarding = !!(base?.name && preferences?.id);

    return {
      hasCompletedOnboarding,
      hasProfile: !!base?.name, // ✅ CHANGED: reflect profiles.name
      hasPreferences: !!preferences,
    };
  } catch (_error) {
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
