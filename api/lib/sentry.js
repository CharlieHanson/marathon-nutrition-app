import * as Sentry from '@sentry/node';

export const isSentryEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NODE_ENV !== 'test' &&
  Boolean(process.env.SENTRY_DSN);

export function initSentry() {
  if (!isSentryEnabled) {
    if (process.env.NODE_ENV === 'production' && !process.env.SENTRY_DSN) {
      console.warn('[api] Sentry init skipped: SENTRY_DSN is not set');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.warn('[api] Sentry init skipped:', error?.message || error);
  }
}

export function setupSentryErrorHandler(app) {
  if (!isSentryEnabled) return;
  Sentry.setupExpressErrorHandler(app);
}

export function setSentryUser(user) {
  if (!isSentryEnabled) return;
  Sentry.setUser(user ? { id: user.id || user } : null);
}
