// pages/api/meal-plan.js
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';

const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, weekStarting } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const week =
      typeof weekStarting === 'string' && weekStarting.length
        ? weekStarting
        : getMondayOfCurrentWeek();

    try {
      const { data, error } = await supabaseAdmin
        .from('meal_plans')                      // 👈 USE THE REAL TABLE
        .select('week_starting, meals')
        .eq('user_id', userId)
        .eq('week_starting', week)
        .maybeSingle();

      if (error) {
        console.error('/api/meal-plan GET error', error);
        // Treat errors as "no plan yet" so the UI can still work
        return res.status(200).json({
          success: true,
          week_starting: week,
          meals: null,
        });
      }

      return res.status(200).json({
        success: true,
        week_starting: data?.week_starting || week,
        meals: data?.meals || null,
      });
    } catch (err) {
      console.error('/api/meal-plan GET exception', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Unknown error',
      });
    }
  }

  if (req.method === 'POST') {
    const { userId, weekStarting, meals } = req.body || {};

    if (!userId || !weekStarting || !meals) {
      return res.status(400).json({
        success: false,
        error: 'userId, weekStarting, and meals are required',
      });
    }

    try {
      const { error } = await supabaseAdmin
        .from('meal_plans')                      // 👈 HERE TOO
        .upsert(
          {
            user_id: userId,
            week_starting: weekStarting,
            meals,
          },
          {
            // assumes a unique index on (user_id, week_starting)
            onConflict: 'user_id,week_starting',
          }
        );

      if (error) {
        console.error('/api/meal-plan POST error', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('/api/meal-plan POST exception', err);
      return res
        .status(500)
        .json({ success: false, error: err.message || 'Unknown error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
