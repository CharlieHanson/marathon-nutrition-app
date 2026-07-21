import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ApiErrorProvider } from '../context/ApiErrorContext';
import { NetworkProvider } from '../context/NetworkContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { ThemeProvider as CustomThemeProvider } from '../context/ThemeContext';

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

export default function RootLayout() {
  const [loaded, error] = useFonts({
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
        <ActivityIndicator size="large" color="#F6921D" />
        <Text style={styles.fontLoadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <SessionExpiredHandler />
        <NetworkProvider>
          <ApiErrorProvider>
            <View style={{ flex: 1 }}>
              <RootLayoutNav />
              <OfflineBanner />
            </View>
          </ApiErrorProvider>
        </NetworkProvider>
      </AuthProvider>
    </CustomThemeProvider>
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
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
    backgroundColor: '#FFF7ED', // orange-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontLoadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#F6921D', // primary orange
  },
});
