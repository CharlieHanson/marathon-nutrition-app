// pages/api/pro/profile.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'API /api/pro/profile: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      console.log('API /api/pro/profile (GET) for userId:', userId);

      const { data, error } = await supabase
        .from('nutritionists')
        .select('name, business_name, website, location, invite_code')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('API /api/pro/profile: GET error', error);
        return res.status(200).json({ profile: null });
      }

      return res.status(200).json({ profile: data || null });
    }

    if (req.method === 'PUT') {
      const { userId, name, business_name, website, location } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      console.log('API /api/pro/profile (PUT) for userId:', userId, {
        name,
        business_name,
        website,
        location,
      });

      const { error } = await supabase
        .from('nutritionists')
        .update({
          name,
          business_name,
          website,
          location,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('API /api/pro/profile: PUT error', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error('API /api/pro/profile: UNCAUGHT error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
