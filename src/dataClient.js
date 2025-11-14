import { supabase } from './supabaseClient';

// Load profile + preferences for a user (or null if missing)
export async function fetchPersonalInfo(userId) {
  try {
    const [{ data: up, error: upErr }, { data: fp, error: fpErr }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('food_preferences').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    // Don't throw on missing data - that's normal for new users
    // Errors are handled by returning null values

    return {
      userProfile: up || null,
      foodPreferences: fp || null,
    };
  } catch (error) {
    return {
      userProfile: null,
      foodPreferences: null,
    };
  }
}

export async function saveUserProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        name: profileData.name || null,
        age: profileData.age ? parseInt(profileData.age) : null,
        height: profileData.height || null,
        weight: profileData.weight || null,
        goal: profileData.goal || null,
        activity_level: profileData.activityLevel || null,
        objective: profileData.objective || null,
        dietary_restrictions: profileData.dietaryRestrictions || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id'
      }
    )
    .select();

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
      {
        onConflict: 'user_id'
      }
    )
    .select();

  return { data, error };
}

export async function saveTrainingPlan(userId, planData) {
  const { data, error } = await supabase
    .from('training_plans')
    .upsert(
      {
        user_id: userId,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id'
      }
    )
    .select();

  return { data, error };
}

// Training Plan
export async function fetchTrainingPlan(userId) {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle() instead of single()

  if (error && error.code !== 'PGRST116') {
    return null;
  }

  return data?.plan_data || null;
}

export async function checkOnboardingStatus(userId) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: preferences, error: prefsError } = await supabase
      .from('food_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // User has completed onboarding if they have both profile and preferences
    const hasCompletedOnboarding = !!(profile?.name && preferences?.id);

    return {
      hasCompletedOnboarding,
      hasProfile: !!profile,
      hasPreferences: !!preferences,
    };
  } catch (error) {
    return {
      hasCompletedOnboarding: false,
      hasProfile: false,
      hasPreferences: false,
    };
  }
}