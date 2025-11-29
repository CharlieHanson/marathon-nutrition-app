// pages/api/profile.js
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';

export default async function handler(req, res) {
  // ========== GET: Fetch profile ==========
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId query parameter' });
    }

    try {
      console.log('[api/profile GET] fetching for userId', userId);

      // 1) Base profile from public.profiles (name + type)
      const { data: baseProfile, error: baseError } = await supabaseAdmin
        .from('profiles')
        .select('name, type')
        .eq('id', userId)
        .maybeSingle();

      if (baseError) {
        console.error('[api/profile GET] profiles error:', baseError);
      }

      // 2) Client profile from public.user_profiles
      const { data: userProfile, error: upError } = await supabaseAdmin
        .from('user_profiles')
        .select(
          'age, height, weight, goal, activity_level, dietary_restrictions, objective'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (upError) {
        console.error('[api/profile GET] user_profiles error:', upError);
        return res.status(200).json({
          success: false,
          error: upError.message,
          code: upError.code,
        });
      }

      console.log('[api/profile GET] baseProfile:', baseProfile);
      console.log('[api/profile GET] userProfile:', userProfile);

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
      console.error('[api/profile GET] unexpected error:', e);
      return res
        .status(500)
        .json({ success: false, error: e.message || 'Unknown server error' });
    }
  }

  // ========== POST: Save profile ==========
  if (req.method === 'POST') {
    const { userId, profile } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId in request body' });
    }

    if (!profile) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing profile data in request body' });
    }

    try {
      console.log('[api/profile POST] saving for userId', userId, profile);

      // 1) Update name in profiles table
      if (profile.name) {
        const { error: nameError } = await supabaseAdmin
          .from('profiles')
          .update({ name: profile.name })
          .eq('id', userId);

        if (nameError) {
          console.error('[api/profile POST] profiles update error:', nameError);
          return res.status(500).json({
            success: false,
            error: nameError.message,
          });
        }
      }

      // 2) Upsert user_profiles (client-specific fields)
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            age: profile.age ? parseInt(profile.age) : null,
            height: profile.height || null,
            weight: profile.weight || null,
            goal: profile.goal || null,
            activity_level: profile.activityLevel || null,
            objective: profile.objective || null,
            dietary_restrictions: profile.dietaryRestrictions || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select();

      if (error) {
        console.error('[api/profile POST] user_profiles upsert error:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      console.log('[api/profile POST] saved successfully:', data);

      return res.status(200).json({
        success: true,
        message: 'Profile saved successfully',
        data,
      });
    } catch (e) {
      console.error('[api/profile POST] unexpected error:', e);
      return res.status(500).json({
        success: false,
        error: e.message || 'Unknown server error',
      });
    }
  }

  // ========== Other methods not allowed ==========
  return res.status(405).json({
    success: false,
    error: 'Method not allowed. Use GET or POST.',
  });
}