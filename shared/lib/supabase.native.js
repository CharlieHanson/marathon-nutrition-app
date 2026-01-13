import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client for React Native
 * Uses AsyncStorage for session persistence instead of localStorage
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.REACT_NATIVE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_NATIVE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL (or REACT_NATIVE_SUPABASE_URL) and EXPO_PUBLIC_SUPABASE_ANON_KEY (or REACT_NATIVE_SUPABASE_ANON_KEY) must be set'
  );
}

// Create a storage adapter for AsyncStorage
const AsyncStorageAdapter = {
  getItem: async (key) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // Save session to AsyncStorage
    autoRefreshToken: true,     // Auto-refresh token before it expires
    storage: AsyncStorageAdapter, // Use AsyncStorage instead of localStorage
    detectSessionInUrl: false,  // Disable URL detection (not applicable in React Native)
  },
});

