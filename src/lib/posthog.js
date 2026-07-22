import posthog from 'posthog-js';

const isBrowser = typeof window !== 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let initialized = false;

export function initPostHog() {
  if (!isBrowser || isTest || !isProduction || !key) return;
  if (initialized || posthog.__loaded) return;

  try {
    posthog.init(key, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: false,
    });
    initialized = true;
  } catch (error) {
    console.warn('PostHog init skipped:', error?.message || error);
  }
}

export function capture(eventName, properties = {}) {
  if (!isBrowser || isTest || !isProduction || !key) return;

  try {
    initPostHog();
    posthog.capture(eventName, properties);
  } catch (error) {
    console.warn('PostHog capture skipped:', error?.message || error);
  }
}

export function identify(userId, properties = {}) {
  if (!isBrowser || isTest || !isProduction || !key || !userId) return;

  try {
    initPostHog();
    posthog.identify(userId, properties);
  } catch (error) {
    console.warn('PostHog identify skipped:', error?.message || error);
  }
}

export function reset() {
  if (!isBrowser || isTest || !isProduction || !key) return;

  try {
    posthog.reset();
  } catch (error) {
    console.warn('PostHog reset skipped:', error?.message || error);
  }
}
