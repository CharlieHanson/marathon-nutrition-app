// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;      // same as your browser client
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be set, never exposed to browser

if (!url) {
  throw new Error('supabaseAdmin: NEXT_PUBLIC_SUPABASE_URL is missing');
}
if (!serviceKey) {
  throw new Error('supabaseAdmin: SUPABASE_SERVICE_ROLE_KEY is missing');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
