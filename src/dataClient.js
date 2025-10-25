import { supabase } from './supabaseClient';

// Load profile + preferences for a user (or null if missing)
export async function fetchPersonalInfo(userId) {
  const [{ data: up, error: upErr }, { data: fp, error: fpErr }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('food_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (upErr) throw upErr;
  if (fpErr) throw fpErr;

  return {
    userProfile: up || null,
    foodPreferences: fp || null,
  };
}


export async function saveUserProfile(userId, profile) {
  return supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        height: profile.height ?? null,
        weight: profile.weight ?? null,
        goal: profile.goal ?? null,
        activity_level: profile.activityLevel ?? null,
        dietary_restrictions: profile.dietaryRestrictions ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' } // <-- IMPORTANT
    );
}

export async function saveFoodPreferences(userId, prefs) {
  return supabase
    .from('food_preferences')
    .upsert(
      {
        user_id: userId,
        likes: prefs.likes ?? '',
        dislikes: prefs.dislikes ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' } // <-- IMPORTANT
    );
}