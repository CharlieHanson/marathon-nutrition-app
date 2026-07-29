import { useState, useCallback } from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { usePostHog } from 'posthog-react-native';
import { supabase } from '../../shared/lib/supabase.native';
import { isNewlyCreatedUser } from '../../shared/lib/analyticsUser';
import { capture } from '../lib/analytics';

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
  const posthog = usePostHog();
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

      if (isNewlyCreatedUser(signInData?.user)) {
        capture(posthog, 'signup_completed', {
          persona: 'athlete',
          method: 'apple',
        });
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
  }, [posthog]);

  return { signInWithApple, loading, error };
}

/**
 * "Continue/Sign up with Apple" button. Returns null on non-iOS platforms.
 * Custom button so label size matches Google/Email auth buttons.
 */
export function AppleSignInButton({
  onPress,
  disabled,
  label = 'Continue with Apple',
}) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[appleButtonStyles.button, disabled && appleButtonStyles.disabled]}
    >
      <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
      <Text style={appleButtonStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const appleButtonStyles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
