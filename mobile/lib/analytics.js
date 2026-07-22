const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const hasPostHogKey = Boolean(process.env.EXPO_PUBLIC_POSTHOG_KEY);

export const shouldEnablePostHog =
  hasPostHogKey && isProduction && !isTest && !__DEV__;

export function capture(posthog, eventName, properties = {}) {
  if (!shouldEnablePostHog || !posthog) return;

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.warn('PostHog capture skipped:', error?.message || error);
  }
}

export function identify(posthog, userId, properties = {}) {
  if (!shouldEnablePostHog || !posthog || !userId) return;

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.warn('PostHog identify skipped:', error?.message || error);
  }
}

export function reset(posthog) {
  if (!shouldEnablePostHog || !posthog) return;

  try {
    posthog.reset();
  } catch (error) {
    console.warn('PostHog reset skipped:', error?.message || error);
  }
}
