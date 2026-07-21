// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;                 // Supabase project URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be set, never exposed to browser

if (!url) {
  throw new Error('supabaseAdmin: SUPABASE_URL is missing');
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
