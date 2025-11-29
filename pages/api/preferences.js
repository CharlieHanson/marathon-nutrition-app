// pages/api/preferences.js
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId query parameter' });
    }

    try {
      console.log('[api/preferences] GET for userId:', userId);

      const { data, error } = await supabaseAdmin
        .from('food_preferences') // <-- table: adjust if your name differs
        .select('likes, dislikes, cuisine_favorites')
        .eq('user_id', userId)    // <-- important: user_id, not id
        .maybeSingle();

      if (error) {
        console.error('[api/preferences] select error:', error);
        return res.status(200).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      const response = {
        success: true,
        likes: data?.likes || '',
        dislikes: data?.dislikes || '',
        cuisineFavorites: data?.cuisine_favorites || '',
      };

      console.log('[api/preferences] response:', response);
      return res.status(200).json(response);
    } catch (e) {
      console.error('[api/preferences] unexpected error:', e);
      return res
        .status(500)
        .json({ success: false, error: e.message || 'Unknown server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, preferences } = req.body || {};

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, error: 'Missing userId in body' });
      }

      const likes = preferences?.likes ?? '';
      const dislikes = preferences?.dislikes ?? '';
      const cuisineFavorites = preferences?.cuisineFavorites ?? '';

      console.log('[api/preferences] POST upsert', {
        userId,
        likes,
        dislikes,
        cuisineFavorites,
      });

      const { error } = await supabaseAdmin
        .from('food_preferences') // <-- same table
        .upsert(
          {
            user_id: userId,
            likes,
            dislikes,
            cuisine_favorites: cuisineFavorites,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('[api/preferences] upsert error:', error);
        return res.status(200).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('[api/preferences] unexpected POST error:', e);
      return res
        .status(500)
        .json({ success: false, error: e.message || 'Unknown server error' });
    }
  }

  return res
    .status(405)
    .json({ success: false, error: 'Method not allowed' });
}
