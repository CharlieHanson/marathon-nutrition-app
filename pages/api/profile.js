// pages/api/profile.js
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing userId query parameter' });
  }

  try {
    console.log('[api/profile] fetching for userId', userId);

    // 1) Base profile from public.profiles (name + type)
    const { data: baseProfile, error: baseError } = await supabaseAdmin
      .from('profiles')
      .select('name, type')
      .eq('id', userId) // profiles.id = auth.users.id
      .maybeSingle();

    if (baseError) {
      console.error('[api/profile] profiles error:', baseError);
    }

    // 2) Client profile from public.user_profiles
    const { data: userProfile, error: upError } = await supabaseAdmin
      .from('user_profiles')
      .select(
        'age, height, weight, goal, activity_level, dietary_restrictions, objective'
      )
      .eq('user_id', userId) // ✅ IMPORTANT: user_id, not id
      .maybeSingle();

    if (upError) {
      console.error('[api/profile] user_profiles error:', upError);
      return res.status(200).json({
        success: false,
        error: upError.message,
        code: upError.code,
      });
    }

    console.log('[api/profile] baseProfile:', baseProfile);
    console.log('[api/profile] userProfile:', userProfile);

    const response = {
      success: true,
      name: baseProfile?.name || '',
      age: userProfile?.age ?? '',
      height: userProfile?.height ?? '',
      weight: userProfile?.weight ?? '',
      goal: userProfile?.goal ?? '',
      activityLevel: userProfile?.activity_level ?? '',
      dietaryRestrictions: userProfile?.dietary_restrictions ?? '',
      objective: userProfile?.objective ?? '',
    };

    return res.status(200).json(response);
  } catch (e) {
    console.error('[api/profile] unexpected error:', e);
    return res
      .status(500)
      .json({ success: false, error: e.message || 'Unknown server error' });
  }
}
