// pages/api/meal-plan.js
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, week } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId query parameter' });
    }

    // 👇 Respect the week param; only fallback if missing
    const weekParam = Array.isArray(week) ? week[0] : week;
    const weekStarting = weekParam && weekParam.length
      ? weekParam
      : getMondayOfCurrentWeek();

    console.log('[api/meal-plan GET] userId:', userId, 'weekStarting:', weekStarting);

    try {
      const { data, error } = await supabaseAdmin
        .from('meal_plans')
        .select('id, week_starting, meals')
        .eq('user_id', userId)
        .eq('week_starting', weekStarting)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[api/meal-plan GET] error:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      // No row for this week → return success with null meals
      if (!data) {
        console.log('[api/meal-plan GET] no row for week, returning empty');
        return res.status(200).json({
          success: true,
          week_starting: weekStarting,
          meals: null,
        });
      }

      console.log('[api/meal-plan GET] found row:', data.id);
      return res.status(200).json({
        success: true,
        week_starting: data.week_starting,
        meals: data.meals || null,
      });
    } catch (e) {
      console.error('[api/meal-plan GET] unexpected error:', e);
      return res.status(500).json({
        success: false,
        error: e.message || 'Unknown server error',
      });
    }
  }

  if (req.method === 'POST') {
    const { userId, weekStarting, meals } = req.body || {};

    if (!userId || !weekStarting) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or weekStarting in request body',
      });
    }

    if (!meals || typeof meals !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid meals in request body',
      });
    }

    console.log('[api/meal-plan POST] saving', { userId, weekStarting });

    try {
      // Manual "upsert": check if row exists
      const { data: existing, error: selectError } = await supabaseAdmin
        .from('meal_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('week_starting', weekStarting)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('[api/meal-plan POST] select error:', selectError);
        return res.status(500).json({
          success: false,
          error: selectError.message,
        });
      }

      let data, error;

      if (existing) {
        ({ data, error } = await supabaseAdmin
          .from('meal_plans')
          .update({
            meals,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle());
      } else {
        ({ data, error } = await supabaseAdmin
          .from('meal_plans')
          .insert({
            user_id: userId,
            week_starting: weekStarting,
            meals,
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle());
      }

      if (error) {
        console.error('[api/meal-plan POST] upsert error:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      console.log('[api/meal-plan POST] saved id:', data.id);

      return res.status(200).json({
        success: true,
        week_starting: data.week_starting,
        meals: data.meals || null,
      });
    } catch (e) {
      console.error('[api/meal-plan POST] unexpected error:', e);
      return res.status(500).json({
        success: false,
        error: e.message || 'Unknown server error',
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    error: 'Method not allowed. Use GET or POST.',
  });
}
