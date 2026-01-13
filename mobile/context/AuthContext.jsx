// mobile/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase.native';

const AuthContext = createContext(undefined);

/**
 * Seed / ensure base profile data for any authenticated user.
 * - profiles.id = auth.user.id
 * - profiles.name, profiles.type
 * - user_profiles row for clients
 *
 * This function is *best effort* and must never block the app from loading.
 */
const ensureProfile = async (authedUser) => {
  try {
    if (!authedUser) return;

    const meta = authedUser.user_metadata || {};
    const seedName = meta.name ?? null;
    const seedType = meta.role === 'nutritionist' ? 'nutritionist' : 'client';

    // 1) Upsert into profiles (canonical source of name/type)
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authedUser.id,
          name: seedName,
          type: seedType,
        },
        { onConflict: 'id' }
      );

    if (profErr) {
      console.warn('ensureProfile: profiles upsert error:', profErr.message);
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

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
        } else {
          setUser(null);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          setUser(session.user);
          setIsGuest(false);
          AsyncStorage.removeItem('guestMode').catch(() => {});
          // Again, fire-and-forget
          ensureProfile(session.user).catch((e) =>
            console.warn('ensureProfile on auth change failed:', e)
          );
        } else {
          setUser(null);
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
      // For mobile, use a deep link scheme or production URL for email redirect
      // You can configure this in your app.json scheme or use environment variable
      const redirectUrl = process.env.EXPO_PUBLIC_API_URL 
        ? `${process.env.EXPO_PUBLIC_API_URL}/auth/callback`
        : 'https://alimenta-nutrition.vercel.app/auth/callback';

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
    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.warn('AuthContext: signOut error (ignored)', error);
    } finally {
      setUser(null);
      setIsGuest(false);
      await AsyncStorage.removeItem('guestMode');
      console.log('AuthContext: signOut finished, user cleared');
    }
  };

  // ---------- Guest Mode ----------
  const enableGuestMode = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      setUser(null);
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

