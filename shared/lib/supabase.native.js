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

// Expo Router static web export runs this file in Node (no window).
// AsyncStorage's web backend crashes there; skip persistence until a real client.
const canUseNativeStorage =
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') ||
  typeof window !== 'undefined';

const AsyncStorageAdapter = {
  getItem: async (key) => {
    if (!canUseNativeStorage) return null;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (!canUseNativeStorage) return;
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (!canUseNativeStorage) return;
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: canUseNativeStorage,
    autoRefreshToken: canUseNativeStorage,
    storage: canUseNativeStorage ? AsyncStorageAdapter : undefined,
    detectSessionInUrl: false,
  },
});

