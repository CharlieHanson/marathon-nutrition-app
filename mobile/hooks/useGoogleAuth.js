import { useEffect, useState, useRef } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../../shared/lib/supabase.native';

const SCOPES = ['openid', 'profile', 'email'];

/**
 * Google OAuth via expo-auth-session, then sign in to Supabase with id_token.
 * Requires EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in env.
 * On success, AuthContext picks up the session and the app can redirect.
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const exchangingRef = useRef(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      scopes: SCOPES,
    }
  );

  useEffect(() => {
    if (!response || exchangingRef.current) return;

    if (response.type === 'cancel' || response.type === 'dismiss') {
      setLoading(false);
      setError(null);
      return;
    }

    if (response.type === 'error') {
      setLoading(false);
      setError(response.error?.message ?? response.params?.error_description ?? 'Google sign-in failed');
      return;
    }

    if (response.type === 'success' && response.params?.id_token) {
      const idToken = response.params.id_token;
      exchangingRef.current = true;
      setError(null);

      (async () => {
        try {
          const { data, error: signInError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (signInError) {
            setError(signInError.message ?? 'Failed to sign in with Google');
          }
          // On success, AuthContext.onAuthStateChange will update user; caller can redirect
        } catch (err) {
          setError(err?.message ?? 'Failed to sign in with Google');
        } finally {
          setLoading(false);
          exchangingRef.current = false;
        }
      })();
      return;
    }

    setLoading(false);
  }, [response]);

  const handlePress = async () => {
    setError(null);
    if (!request) {
      setError('Google sign-in is not configured. Check client IDs in env.');
      return;
    }
    setLoading(true);
    try {
      await promptAsync();
      // Response is updated asynchronously; useEffect will handle success/error/cancel and clear loading
    } catch (err) {
      setError(err?.message ?? 'Google sign-in failed');
      setLoading(false);
    }
  };
  

  return { promptAsync: handlePress, loading, error };
}
