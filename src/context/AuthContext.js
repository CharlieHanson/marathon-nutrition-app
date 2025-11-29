// src/context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const ensureProfile = async (authedUser) => {
  try {
    if (!authedUser) return;

    const meta = authedUser.user_metadata || {};
    const seedName = meta.name ?? null;
    const seedType = meta.role === 'nutritionist' ? 'nutritionist' : 'client';

    // 1) Upsert profiles row (for all users)
    await supabase
      .from('profiles')
      .upsert(
        {
          id: authedUser.id,
          name: seedName,
          type: seedType,
        },
        { onConflict: 'id' }
      );

    // 2) If client, also ensure user_profiles row exists
    if (seedType === 'client') {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authedUser.id,
        })
        .select()
        .maybeSingle();
      
      // Ignore conflict errors (row already exists)
      if (error && error.code !== '23505') {
        console.warn('Failed to create user_profiles:', error.message);
      }
    }

  } catch (e) {
    console.warn('ensureProfile() failed:', e.message);
  }
};

  // ----- Initial auth state + auth change listener -----
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guestMode');
        }
        /* === NEW: seed/ensure profiles row exists on boot === */
        await ensureProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guestMode');
        }
        /* === NEW: also ensure profile on any auth change (sign in / refresh) === */
        await ensureProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ----- Initialize guest mode from localStorage -----
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

  // ===== Auth API =====

  /* === CHANGED: signUp now only sets metadata; profiles row will be created by ensureProfile() === */
  const signUp = async (email, password, name, role = 'client', metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          /* === CHANGED: seed name/role in user_metadata (used by ensureProfile) === */
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

      // onAuthStateChange will set user; we just kill guest mode
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
      setIsGuest(false);

      /* === NEW: proactively ensure profile after sign-in, too === */
      if (data?.user) await ensureProfile(data.user);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  /* === CHANGED: getUserRole now reads from profiles.type, fallback to user_metadata.role === */
  const getUserRole = async () => {
    if (!user) return null;

    // 1) canonical source: profiles.type
    const { data: prof } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)      // profiles.id = auth.user.id in your schema
      .single();

    if (prof?.type) return prof.type;

    // 2) fallback: user.user_metadata.role (e.g., right after signup before trigger/ensure completes)
    const metaRole = user.user_metadata?.role;
    return metaRole === 'nutritionist' ? 'nutritionist' : 'client';
  };

  const signOut = async () => {
    console.log('AuthContext: signOut called');
    try {
      // Supabase signOut, but don't let it hang forever
      const signOutPromise = supabase.auth.signOut();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 3000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.warn('AuthContext: signOut error (ignored)', error);
      // we still clear local state
    } finally {
      setUser(null);
      setIsGuest(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
      console.log('AuthContext: signOut finished, user cleared');
    }
  };


  // ----- Guest Mode -----
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
    getUserRole, // returns 'client' | 'nutritionist'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
