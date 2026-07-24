// pages/api/auth/apple-exchange.js
// Exchanges an Apple authorization code for a refresh token and stores it
// on user_profiles for later revocation on account deletion.
import { createClient } from '@supabase/supabase-js';
import { generateAppleClientSecret } from '../../lib/appleClientSecret.js';

const APPLE_CLIENT_ID = 'com.charliehanson.alimenta';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Never fail the sign-in flow — always return 200 after logging errors.
  try {
    const { authorizationCode } = req.body || {};

    if (!authorizationCode) {
      console.error('[apple-exchange] missing authorizationCode');
      return res.status(200).json({ success: true });
    }

    const clientSecret = generateAppleClientSecret();

    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('[apple-exchange] Apple token exchange failed:', tokenData);
      return res.status(200).json({ success: true });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ apple_refresh_token: tokenData.refresh_token })
      .eq('user_id', userId);

    if (error) {
      console.error('[apple-exchange] failed to store refresh token:', error);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[apple-exchange] error:', error);
    return res.status(200).json({ success: true });
  }
}
