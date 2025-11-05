import { supabase } from './supabaseClient';

// Load profile + preferences for a user (or null if missing)
export async function fetchPersonalInfo(userId) {
  try {
    const [{ data: up, error: upErr }, { data: fp, error: fpErr }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('food_preferences').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    // Don't throw on missing data - that's normal for new users
    if (upErr && upErr.code !== 'PGRST116') console.error('Profile error:', upErr);
    if (fpErr && fpErr.code !== 'PGRST116') console.error('Preferences error:', fpErr);

    return {
      userProfile: up || null,
      foodPreferences: fp || null,
    };
  } catch (error) {
    console.error('fetchPersonalInfo error:', error);
    return {
      userProfile: null,
      foodPreferences: null,
    };
  }
}

export async function saveUserProfile(userId, profileData) {
  console.log('💾 Saving profile:', { userId, profileData });
  
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
        onConflict: 'user_id' // THIS IS THE FIX!
      }
    )
    .select();

  if (error) {
    console.error('❌ Save profile error:', error);
  } else {
    console.log('✅ Profile saved:', data);
  }

  return { data, error };
}

export async function saveFoodPreferences(userId, prefs) {
  console.log('💾 Saving preferences:', { userId, prefs });
  
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
        onConflict: 'user_id' // THIS IS THE FIX!
      }
    )
    .select();

  if (error) {
    console.error('❌ Save preferences error:', error);
  } else {
    console.log('✅ Preferences saved:', data);
  }

  return { data, error };
}

export async function saveTrainingPlan(userId, planData) {
  console.log('💾 Saving training plan:', { userId, planData });
  
  const { data, error } = await supabase
    .from('training_plans')
    .upsert(
      {
        user_id: userId,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id' // THIS IS THE FIX!
      }
    )
    .select();

  if (error) {
    console.error('❌ Save training plan error:', error);
  } else {
    console.log('✅ Training plan saved:', data);
  }

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
    console.error('Error fetching training plan:', error);
    return null;
  }

  return data?.plan_data || null;
}