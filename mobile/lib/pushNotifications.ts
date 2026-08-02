import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../../shared/lib/supabase.native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register the device Expo push token and capture IANA timezone.
 * Fire-and-forget after auth — never throws, never blocks launch.
 */
export async function registerPushTokenAsync(authUserId: string): Promise<void> {
  try {
    if (!Device.isDevice) return;
    if (Platform.OS !== 'ios') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, timezone')
      .eq('user_id', authUserId)
      .single();

    if (profileError || !profile?.id) {
      throw profileError ?? new Error('user_profiles row not found for auth user');
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from('push_tokens').upsert(
      {
        profile_id: profile.id,
        expo_token: token.data,
        platform: 'ios',
        last_seen_at: now,
        revoked_at: null,
      },
      { onConflict: 'profile_id,expo_token' }
    );

    if (upsertError) throw upsertError;

    const deviceTimezone = Localization.getCalendars()[0]?.timeZone;
    if (
      deviceTimezone &&
      (profile.timezone == null || profile.timezone !== deviceTimezone)
    ) {
      const { error: timezoneError } = await supabase
        .from('user_profiles')
        .update({ timezone: deviceTimezone })
        .eq('id', profile.id);

      if (timezoneError) throw timezoneError;
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}
