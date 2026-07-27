import { Stack } from 'expo-router';
import { AppLayout } from '../../components/AppLayout';
import { MealPlanProvider } from '../../context/MealPlanContext';
import { TrainingPlanProvider } from '../../context/TrainingPlanContext';
import { UserProfileProvider } from '../../context/UserProfileContext';
import { MealCompletionsProvider } from '../../context/MealCompletionsContext';

/**
 * App chrome + shared data providers.
 * Providers stay here (above any future (tabs) group) so tab screens share one cache.
 */
export default function AppLayoutWrapper() {
  return (
    <MealPlanProvider>
      <TrainingPlanProvider>
        <UserProfileProvider>
          <MealCompletionsProvider>
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
          </MealCompletionsProvider>
        </UserProfileProvider>
      </TrainingPlanProvider>
    </MealPlanProvider>
  );
}
