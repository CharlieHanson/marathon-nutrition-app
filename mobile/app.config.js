const appJson = require('./app.json');

const sentryPlugin =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? [
        '@sentry/react-native/expo',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          url: process.env.SENTRY_URL || 'https://sentry.io/',
        },
      ]
    : '@sentry/react-native/expo';

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  plugins: (appJson.expo.plugins || []).map((plugin) =>
    plugin === '@sentry/react-native/expo' ? sentryPlugin : plugin
  ),
  extra: {
    ...(appJson.expo.extra || {}),
    sentryDsn: process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN || null,
  },
});
