// src/context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(undefined);

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
    const seedName = meta.name ?? null;
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // ---------- Initial session restore + listener ----------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Restore session from Supabase (localStorage)
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('guestMode');
          }
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('guestMode');
          }
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

  // ---------- Initialize guest mode from localStorage ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('guestMode') === 'true';
    setIsGuest(stored);

    const onStorage = (e) => {
      if (e.key === 'guestMode') {
        setIsGuest(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ---------- Auth API ----------

  // Sign up: seed metadata; profiles row is created by ensureProfile()
  const signUp = async (email, password, name, role = 'client', metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
      setIsGuest(false);

      if (data?.user) {
        // Don’t block UI on this
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
      console.log('AuthContext: signOut finished, user cleared');
    }
  };

  // ---------- Guest Mode ----------
  const enableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestMode', 'true');
    }
    setIsGuest(true);
    setUser(null);
  };

  const disableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestMode');
    }
    setIsGuest(false);
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
