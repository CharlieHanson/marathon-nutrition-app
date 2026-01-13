/**
 * Platform-aware Supabase client export
 * Automatically selects the correct implementation based on the platform
 * 
 * Usage:
 *   import { supabase } from './shared/lib/supabase';
 * 
 * This will automatically use:
 *   - supabase.web.js for web/Next.js (uses localStorage)
 *   - supabase.native.js for React Native (uses AsyncStorage)
 */

// Platform detection: Check if we're in a React Native environment
function isReactNative() {
  // Method 1: Check navigator.product (most reliable for React Native)
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true;
  }
  
  // Method 2: Check for React Native Platform module
  // This is a fallback that works when react-native is available
  try {
    // Try to access react-native Platform (will fail on web)
    if (typeof require !== 'undefined') {
      const rn = require('react-native');
      if (rn?.Platform && (rn.Platform.OS === 'ios' || rn.Platform.OS === 'android')) {
        return true;
      }
    }
  } catch (e) {
    // react-native not available, we're on web - this is expected
  }
  
  return false;
}

// Import the appropriate client based on platform at module load time
// This uses synchronous require which works in both CommonJS and ES module contexts
// (Next.js and most bundlers handle this correctly)
let supabaseClient;

try {
  if (isReactNative()) {
    // React Native environment - use AsyncStorage
    supabaseClient = require('./supabase.native').supabase;
  } else {
    // Web/Next.js environment - use localStorage (default)
    supabaseClient = require('./supabase.web').supabase;
  }
} catch (error) {
  // If require fails (pure ES module environment), try dynamic import
  // This is a fallback for strict ES module environments
  console.warn('Supabase client: require() failed, using dynamic import fallback');
  
  // For strict ES modules, you may need to explicitly import the platform-specific version:
  // import { supabase } from './supabase.web' or './supabase.native'
  throw new Error(
    'Unable to auto-detect Supabase client. Please import directly: ' +
    'import { supabase } from "./supabase.web" (web) or "./supabase.native" (React Native)'
  );
}

export const supabase = supabaseClient;

