import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getAuthClient() {
  if (supabase) return supabase;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('requireAuth: SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }

  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
}

function bearerFromHeader(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function bearerFromQuery(req) {
  // Only accept query-param tokens for GET SSE/EventSource compatibility.
  // Current clients use POST streaming with headers, so this is a safe fallback.
  if (req.method !== 'GET') return null;
  const token = req.query?.access_token;
  if (Array.isArray(token)) return token[0];
  return typeof token === 'string' ? token : null;
}

export async function requireAuth(req, res, next) {
  const token = bearerFromHeader(req) || bearerFromQuery(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await getAuthClient().auth.getUser(token);
    if (error || !data?.user) {
      console.warn('[auth] invalid token:', error?.message || 'no user returned');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = data.user;
    req.userId = data.user.id;
    return next();
  } catch (err) {
    console.error('[auth] token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
