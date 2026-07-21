import { Stack } from 'expo-router';
import { AppLayout } from '../../components/AppLayout';

export default function AppLayoutWrapper() {
  return (
    <AppLayout>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="meals" />
        <Stack.Screen name="training" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="nutrition-detail"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </AppLayout>
  );
}