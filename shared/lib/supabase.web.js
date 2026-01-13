import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for web/Next.js
 * Uses localStorage for session persistence (default behavior)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // Save session to localStorage
    autoRefreshToken: true,     // Auto-refresh token before it expires
    detectSessionInUrl: true,   // Detect session from URL (for OAuth callbacks)
  },
});

