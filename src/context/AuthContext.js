import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Initial Supabase session + auth state listener
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Initialize guest mode from localStorage + keep in sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsGuest(localStorage.getItem('guestMode') === 'true');

    const onStorage = (e) => {
      if (e.key === 'guestMode') setIsGuest(e.newValue === 'true');
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
        options: { data: { name } },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').update({ name }).eq('id', data.user.id);
      }
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  // ----- Guest mode helpers -----
  const enableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestMode', 'true');
      setIsGuest(true); // immediate in this tab
    }
  };

  const disableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestMode');
      setIsGuest(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isGuest,
    enableGuestMode,
    disableGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
