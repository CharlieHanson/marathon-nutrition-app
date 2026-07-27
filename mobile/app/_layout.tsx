import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ApiErrorProvider } from '../context/ApiErrorContext';
import { NetworkProvider } from '../context/NetworkContext';
import { ProductTourProvider } from '../context/ProductTourContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';
import { shouldEnablePostHog } from '../lib/analytics';
import { applyQuicksandFont, quicksandFonts } from '../lib/fonts';

const sentryDsn =
  Constants.expoConfig?.extra?.sentryDsn ||
  process.env.SENTRY_DSN ||
  process.env.EXPO_PUBLIC_SENTRY_DSN;
const shouldEnableSentry = process.env.NODE_ENV === 'production' && !__DEV__ && Boolean(sentryDsn);

if (shouldEnableSentry) {
  try {
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.warn('Sentry mobile init skipped:', error instanceof Error ? error.message : error);
  }
} else if (process.env.NODE_ENV === 'production' && !sentryDsn) {
  console.warn('Sentry mobile init skipped: SENTRY_DSN is not set');
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  // Initial route is handled programmatically based on auth state
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppProviders({ children }: { children: ReactNode }) {
  // Always mount PostHogProvider so usePostHog() callers don't log errors in
  // dev. capture()/identify()/reset() in lib/analytics.js still no-op when
  // shouldEnablePostHog is false, so no events are sent outside production.
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY || 'phc_dev_disabled'}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        captureAppLifecycleEvents: shouldEnablePostHog,
        persistence: shouldEnablePostHog ? 'file' : 'memory',
      }}
      autocapture={shouldEnablePostHog}
    >
      {children}
    </PostHogProvider>
  );
}

function RootLayout() {
  const [loaded, error] = useFonts({
    ...quicksandFonts,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    // Show loading view instead of null while fonts are loading
    return (
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#3D7C65" />
        <Text style={styles.fontLoadingText}>Loading...</Text>
      </View>
    );
  }

  applyQuicksandFont();

  return (
    <AppProviders>
      <CustomThemeProvider>
        <AuthProvider>
          <ProductTourProvider>
            <SessionExpiredHandler />
            <NetworkProvider>
              <ApiErrorProvider>
                <View style={{ flex: 1 }}>
                  <RootLayoutNav />
                  <OfflineBanner />
                </View>
              </ApiErrorProvider>
            </NetworkProvider>
          </ProductTourProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </AppProviders>
  );
}

function SessionExpiredHandler() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (sessionExpired) {
      Alert.alert('Session Expired', 'Please log in again.', [
        {
          text: 'OK',
          onPress: () => {
            clearSessionExpired();
            router.replace('/(auth)/login');
          },
        },
      ]);
    }
  }, [sessionExpired, clearSessionExpired, router]);

  return null;
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nutrition-detail" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    backgroundColor: '#EBF4F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontLoadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#3D7C65',
  },
});

export default shouldEnableSentry ? Sentry.wrap(RootLayout) : RootLayout;
