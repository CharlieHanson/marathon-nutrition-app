// api/lib/supabaseAdmin.js
// Lazy-init so `node server.js` can boot (and /health works) without a .env.
// Requests that touch the client still fail clearly if env vars are missing.
import { createClient } from '@supabase/supabase-js';

let _client = null;

function createAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('supabaseAdmin: SUPABASE_URL is missing');
  }
  if (!serviceKey) {
    throw new Error('supabaseAdmin: SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_client) _client = createAdmin();
      const value = _client[prop];
      return typeof value === 'function' ? value.bind(_client) : value;
    },
  }
);
