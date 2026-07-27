import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../shared/lib/supabase.native';

/** Write Apple-provided name to profiles without overwriting an existing name. */
async function seedAppleProfileName(userId, fullName) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.warn('useAppleAuth: profiles fetch error:', fetchErr.message);
      return;
    }

    if (!existing) {
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: userId,
        name: fullName,
        type: 'client',
      });

      if (insertErr?.code === '23505') {
        // ensureProfile may have inserted first; fill name if still empty
        const { data: raced, error: racedFetchErr } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', userId)
          .maybeSingle();

        if (racedFetchErr) {
          console.warn('useAppleAuth: profiles refetch error:', racedFetchErr.message);
          return;
        }

        if (raced && !raced.name) {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ name: fullName })
            .eq('id', userId);
          if (updateErr) {
            console.warn('useAppleAuth: profiles name update error:', updateErr.message);
          }
        }
      } else if (insertErr) {
        console.warn('useAppleAuth: profiles insert error:', insertErr.message);
      }
      return;
    }

    if (!existing.name) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ name: fullName })
        .eq('id', userId);
      if (updateErr) {
        console.warn('useAppleAuth: profiles name update error:', updateErr.message);
      }
    }
  } catch (e) {
    console.warn('useAppleAuth: seedAppleProfileName failed:', e.message);
  }
}

/**
 * Apple Sign In via expo-apple-authentication, then sign in to Supabase with identityToken.
 * iOS only. On success, AuthContext picks up the session and the app can redirect.
 */
export function useAppleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    setLoading(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setError('Apple sign-in failed: no identity token');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (signInError) {
        setError(signInError.message ?? 'Failed to sign in with Apple');
        return;
      }

      // Store Apple refresh token for account-deletion revocation (best-effort).
      // authorizationCode may be null on repeat sign-ins.
      // userId is derived server-side from the Bearer JWT — do not send it in the body.
      try {
        const authorizationCode = credential.authorizationCode;
        if (authorizationCode) {
          const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
          if (baseUrl) {
            const headers = { 'Content-Type': 'application/json' };
            const accessToken = signInData?.session?.access_token;
            if (accessToken) {
              headers.Authorization = `Bearer ${accessToken}`;
            }
            await fetch(`${baseUrl}/api/auth/apple-exchange`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ authorizationCode }),
            });
          }
        }
      } catch (exchangeErr) {
        console.warn('useAppleAuth: apple-exchange failed:', exchangeErr?.message);
      }

      if (credential.fullName) {
        const fullName = AppleAuthentication.formatFullName(credential.fullName);
        if (fullName) {
          const { error: updateMetaError } = await supabase.auth.updateUser({
            data: { full_name: fullName },
          });
          if (updateMetaError) {
            console.warn('useAppleAuth: updateUser full_name error:', updateMetaError.message);
          }

          const userId = signInData?.user?.id;
          if (userId) {
            await seedAppleProfileName(userId, fullName);
          }
        }
      }
    } catch (err) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.error('Apple sign-in error:', err);
      setError(err?.message ?? 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  }, []);

  return { signInWithApple, loading, error };
}

/**
 * Native "Continue with Apple" button. Returns null on non-iOS platforms.
 */
export function AppleSignInButton({ onPress, disabled }) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={6}
      style={{ width: '100%', height: 48 }}
      onPress={disabled ? () => {} : onPress}
    />
  );
}
