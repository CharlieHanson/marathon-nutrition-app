// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState('Verifying your email...');

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');            // magic-link / recovery (PKCE)
        const tokenHash = params.get('token_hash'); // email confirmation
        const type = params.get('type');            // e.g. 'signup', 'recovery'
        const errDesc = params.get('error_description');

        if (errDesc) throw new Error(errDesc);

        if (code) {
          // Magic link / recovery code
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          // Email confirmation flow
          const { error } = await supabase.auth.verifyOtp({
            type: type || 'signup',
            token_hash: tokenHash,
          });
          if (error) throw error;
        }

        // At this point we should have a session (or we already had one)
        const {
          data: { session },
          error: sErr,
        } = await supabase.auth.getSession();

        if (sErr) throw sErr;
        if (!session) throw new Error('No session after verification');

        // ✅ Don't decide route here; let /auth/redirect handle role + routing
        router.replace('/auth/redirect');
      } catch (e) {
        console.error('[auth/callback] verify error:', e);
        setMsg('Verification failed. Redirecting to login…');
        setTimeout(() => router.replace('/login'), 1200);
      }
    };

    if (router.isReady) run();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="text-primary font-semibold">{msg}</div>
    </div>
  );
}
