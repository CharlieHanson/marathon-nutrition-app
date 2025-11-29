// pages/api/pro/clients.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANT: this must NOT be public. Set it in .env.local and on Vercel.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'API /api/pro/clients: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    console.log('API /api/pro/clients called for userId:', userId);

    // 1) Find nutritionist row
    const { data: nutritionist, error: nutError } = await supabase
      .from('nutritionists')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (nutError || !nutritionist) {
      console.error(
        'API /api/pro/clients: nutritionist error or none',
        nutError
      );
      // Return empty list instead of 500 so UI just shows "No clients yet"
      return res.status(200).json({ clients: [] });
    }

    // 2) Get all client connections
    const { data: connections, error: connError } = await supabase
      .from('client_nutritionist')
      .select(`
        client_user_id,
        created_at,
        kcal_min,
        kcal_max,
        protein_min,
        protein_max
      `)
      .eq('nutritionist_id', nutritionist.id)
      .order('created_at', { ascending: false });

    if (connError) {
      console.error(
        'API /api/pro/clients: client_nutritionist error',
        connError
      );
      return res.status(200).json({ clients: [] });
    }

    if (!connections || connections.length === 0) {
      return res.status(200).json({ clients: [] });
    }

    const clientIds = connections.map((c) => c.client_user_id);

    // 3) Profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', clientIds);

    if (profileError) {
      console.error('API /api/pro/clients: profiles error', profileError);
      return res.status(200).json({ clients: [] });
    }

    // 4) User profiles (age, goal)
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('user_id, age, goal')
      .in('user_id', clientIds);

    if (upError) {
      console.error('API /api/pro/clients: user_profiles error', upError);
      return res.status(200).json({ clients: [] });
    }

    // 5) Combine
    const clients = connections.map((conn) => {
      const profile = profiles.find((p) => p.id === conn.client_user_id);
      const userProfile = userProfiles.find(
        (up) => up.user_id === conn.client_user_id
      );

      return {
        id: conn.client_user_id,
        name: profile?.name || 'Unknown Client',
        email: null, // still placeholder
        age: userProfile?.age ?? null,
        goal: userProfile?.goal ?? null,
        connected_at: conn.created_at,
        has_macro_bounds: !!(conn.kcal_min && conn.kcal_max),
      };
    });

    return res.status(200).json({ clients });
  } catch (err) {
    console.error('API /api/pro/clients: UNCAUGHT error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
