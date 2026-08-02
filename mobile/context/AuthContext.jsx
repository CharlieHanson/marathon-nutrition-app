// mobile/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { usePostHog } from 'posthog-react-native';
import { supabase } from '../../shared/lib/supabase.native';
import { identify as identifyPostHog, reset as resetPostHog } from '../lib/analytics';
import { registerPushTokenAsync } from '../lib/pushNotifications';

const AuthContext = createContext(undefined);

const toAnalyticsPersona = (role) =>
  role === 'nutritionist' ? 'nutritionist' : 'athlete';

const getAnalyticsPersona = async (authedUser) => {
  if (!authedUser) return null;

  try {
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', authedUser.id)
      .maybeSingle();

    if (!error && prof?.type) {
      return toAnalyticsPersona(prof.type);
    }
  } catch (e) {
    console.warn('getAnalyticsPersona: profiles query failed', e);
  }

  return toAnalyticsPersona(authedUser.user_metadata?.role);
};

/**
 * Seed / ensure base profile data for any authenticated user.
 * - profiles.id = auth.user.id
 * - New users: name + type seeded from auth metadata
 * - Existing users: only type updated if needed; name is never overwritten
 * - user_profiles row for clients
 *
 * This function is *best effort* and must never block the app from loading.
 */
const ensureProfile = async (authedUser) => {
  try {
    if (!authedUser) return;

    const meta = authedUser.user_metadata || {};
    const seedName = meta.full_name ?? meta.name ?? null;
    const seedType = meta.role === 'nutritionist' ? 'nutritionist' : 'client';

    // 1) Check if profile already exists (do not overwrite saved name)
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', authedUser.id)
      .maybeSingle();

    if (fetchErr) {
      console.warn('ensureProfile: profiles fetch error:', fetchErr.message);
      return;
    }

    if (!existing) {
      // No profile: insert with name from signup/OAuth metadata
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: authedUser.id,
          name: seedName,
          type: seedType,
        });

      if (insertErr) {
        console.warn('ensureProfile: profiles insert error:', insertErr.message);
      }
    } else {
      // Profile exists: only update type if needed, never touch name
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ type: seedType })
        .eq('id', authedUser.id);

      if (updateErr) {
        console.warn('ensureProfile: profiles type update error:', updateErr.message);
      }
    }

    // 2) If client, ensure there is a user_profiles row
    if (seedType === 'client') {
      const { error: upErr } = await supabase
        .from('user_profiles')
        .insert({ user_id: authedUser.id })
        .select()
        .maybeSingle();

      // ignore duplicate key errors (row already exists)
      if (upErr && upErr.code !== '23505') {
        console.warn('ensureProfile: user_profiles insert error:', upErr.message);
      }
    }
  } catch (e) {
    console.warn('ensureProfile() failed:', e.message);
  }
};

export const AuthProvider = ({ children }) => {
  const posthog = usePostHog();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const signOutIntentionalRef = useRef(false);
  const userRef = useRef(user);

  userRef.current = user;

  const clearSessionExpired = () => setSessionExpired(false);

  const identifyMonitoringUser = async (authedUser) => {
    if (!authedUser?.id) return;

    try {
      const persona = await getAnalyticsPersona(authedUser);
      identifyPostHog(posthog, authedUser.id, {
        email: authedUser.email,
        persona,
      });
    } catch (e) {
      console.warn('AuthContext: analytics identify failed', e);
    }

    try {
      Sentry.setUser({ id: authedUser.id });
    } catch (e) {
      console.warn('AuthContext: Sentry setUser failed', e);
    }
  };

  const resetMonitoringUser = () => {
    resetPostHog(posthog);
    try {
      Sentry.setUser(null);
    } catch (e) {
      console.warn('AuthContext: Sentry clear user failed', e);
    }
  };

  // ---------- Initial session restore + listener ----------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Restore session from Supabase (AsyncStorage)
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('AuthContext: getSession error', error);
          setUser(null);
          setIsGuest(false);
          return;
        }

        const session = data?.session;

        if (session?.user) {
          setUser(session.user);
          setIsGuest(false);
          await AsyncStorage.removeItem('guestMode');
          // Fire-and-forget; do not block loading on this
          ensureProfile(session.user).catch((e) =>
            console.warn('ensureProfile on init failed:', e)
          );
          identifyMonitoringUser(session.user).catch((e) =>
            console.warn('monitoring identify on init failed:', e)
          );
          registerPushTokenAsync(session.user.id).catch(() => {});
        } else {
          setUser(null);
          resetMonitoringUser();
        }
      } catch (e) {
        console.error('AuthContext: init crashed', e);
        if (mounted) {
          setUser(null);
          setIsGuest(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Subscribe to auth changes (sign in/out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          setUser(session.user);
          setIsGuest(false);
          setSessionExpired(false);
          AsyncStorage.removeItem('guestMode').catch(() => {});
          // Again, fire-and-forget
          ensureProfile(session.user).catch((e) =>
            console.warn('ensureProfile on auth change failed:', e)
          );
          identifyMonitoringUser(session.user).catch((e) =>
            console.warn('monitoring identify on auth change failed:', e)
          );
          registerPushTokenAsync(session.user.id).catch(() => {});
        } else {
          const hadUser = userRef.current !== null;
          setUser(null);
          resetMonitoringUser();

          // Unexpected sign out (e.g. token refresh failed) - show session expired message
          if (event === 'SIGNED_OUT' && hadUser && !signOutIntentionalRef.current) {
            setSessionExpired(true);
          }
        }
      } catch (e) {
        console.error('AuthContext: onAuthStateChange error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------- Initialize guest mode from AsyncStorage ----------
  useEffect(() => {
    const initGuestMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('guestMode');
        setIsGuest(stored === 'true');
      } catch (e) {
        console.warn('AuthContext: failed to read guestMode from AsyncStorage', e);
      }
    };

    initGuestMode();
  }, []);

  // ---------- Auth API ----------

  // Sign up: seed metadata; profiles row is created by ensureProfile()
  const signUp = async (email, password, name, role = 'client', metadata = {}) => {
    try {
      // Web app origin for email redirects (auth callback lives on Next.js, not the Express API)
      const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;
      if (!siteUrl || !String(siteUrl).trim()) {
        throw new Error(
          'Missing EXPO_PUBLIC_SITE_URL. Set it in mobile/.env (local) and as an EAS secret for cloud builds.'
        );
      }
      const redirectUrl = `${String(siteUrl).trim().replace(/\/$/, '')}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, role, ...metadata },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      await AsyncStorage.removeItem('guestMode');
      setIsGuest(false);

      if (data?.user) {
        // Don't block UI on this
        ensureProfile(data.user).catch((e) =>
          console.warn('ensureProfile on signIn failed:', e)
        );
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Canonical role from profiles.type, fallback to user_metadata.role
  const getUserRole = async () => {
    if (!user) return null;

    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (!error && prof?.type) {
        return prof.type;
      }
    } catch (e) {
      console.warn('getUserRole: profiles query failed', e);
    }

    const metaRole = user.user_metadata?.role;
    return metaRole === 'nutritionist' ? 'nutritionist' : 'client';
  };

  const signOut = async () => {
    console.log('AuthContext: signOut called');
    signOutIntentionalRef.current = true;
    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.warn('AuthContext: signOut error (ignored)', error);
    } finally {
      signOutIntentionalRef.current = false;
      setUser(null);
      setIsGuest(false);
      await AsyncStorage.removeItem('guestMode');
      resetMonitoringUser();
      console.log('AuthContext: signOut finished, user cleared');
    }
  };

  // ---------- Guest Mode ----------
  const enableGuestMode = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      setUser(null);
      resetMonitoringUser();
    } catch (e) {
      console.warn('AuthContext: failed to enable guest mode', e);
    }
  };

  const disableGuestMode = async () => {
    try {
      await AsyncStorage.removeItem('guestMode');
      setIsGuest(false);
    } catch (e) {
      console.warn('AuthContext: failed to disable guest mode', e);
    }
  };

  const value = {
    user,
    loading,
    isGuest,
    sessionExpired,
    clearSessionExpired,
    signUp,
    signIn,
    signOut,
    enableGuestMode,
    disableGuestMode,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

