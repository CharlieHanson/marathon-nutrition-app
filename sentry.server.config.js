import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (process.env.NODE_ENV === 'production' && dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  });
} else if (process.env.NODE_ENV === 'production' && !dsn) {
  console.warn('Sentry server init skipped: SENTRY_DSN is not set');
}
