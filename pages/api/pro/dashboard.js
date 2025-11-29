import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'API /api/pro/dashboard: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    console.log('API /api/pro/dashboard called for userId:', userId);

    // 1) Find nutritionist
    const { data: nutritionist, error: nutError } = await supabase
      .from('nutritionists')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (nutError || !nutritionist) {
      console.error(
        'API /api/pro/dashboard: nutritionist error or none',
        nutError
      );
      return res.status(200).json({
        stats: { totalClients: 0, activeThisWeek: 0, pendingReviews: 0 },
        recentClients: [],
      });
    }

    // 2) Recent connections
    const { data: connections, error: connError } = await supabase
      .from('client_nutritionist')
      .select('client_user_id, created_at')
      .eq('nutritionist_id', nutritionist.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (connError) {
      console.error(
        'API /api/pro/dashboard: connections error',
        connError
      );
      return res.status(200).json({
        stats: { totalClients: 0, activeThisWeek: 0, pendingReviews: 0 },
        recentClients: [],
      });
    }

    // 3) Total count
    const { count: totalCount, error: countError } = await supabase
      .from('client_nutritionist')
      .select('*', { count: 'exact', head: true })
      .eq('nutritionist_id', nutritionist.id);

    if (countError) {
      console.error(
        'API /api/pro/dashboard: totalCount error',
        countError
      );
    }

    if (!connections || connections.length === 0) {
      return res.status(200).json({
        stats: {
          totalClients: totalCount || 0,
          activeThisWeek: 0,
          pendingReviews: 0,
        },
        recentClients: [],
      });
    }

    const clientIds = connections.map((c) => c.client_user_id);

    // 4) Profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', clientIds);

    if (profileError) {
      console.error(
        'API /api/pro/dashboard: profiles error',
        profileError
      );
      return res.status(200).json({
        stats: {
          totalClients: totalCount || 0,
          activeThisWeek: 0,
          pendingReviews: 0,
        },
        recentClients: [],
      });
    }

    const recentClients = connections.map((conn) => {
      const profile = profiles.find((p) => p.id === conn.client_user_id);
      return {
        id: conn.client_user_id,
        client_user_id: conn.client_user_id,
        created_at: conn.created_at,
        name: profile?.name || 'Unknown Client',
      };
    });

    return res.status(200).json({
      stats: {
        totalClients: totalCount || recentClients.length,
        activeThisWeek: 0, // TODO: calculate from other tables if needed
        pendingReviews: 0, // TODO: calculate from other tables if needed
      },
      recentClients,
    });
  } catch (err) {
    console.error('API /api/pro/dashboard: UNCAUGHT error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
