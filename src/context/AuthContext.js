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
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guestMode');
        }
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

  // ----- Auth API -----
  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;

      // If you have a profile table, you can upsert here

      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
      setIsGuest(false);

      return { data, error: null };
    } catch (error) {
      console.error('signUp error:', error);
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

      return { data, error: null };
    } catch (error) {
      console.error('signIn error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Local-only logout to avoid "Auth session missing" 403 noise
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Hard reset app-side state no matter what
      setUser(null);
      setIsGuest(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guestMode');
      }
    }
  };

  // ----- Guest Mode -----
  const enableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestMode', 'true');
    }
    setIsGuest(true);
    setUser(null); // make sure guest never has a real user object
  };

  const disableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestMode');
    }
    setIsGuest(false);
    // user stays null until a real login occurs
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
