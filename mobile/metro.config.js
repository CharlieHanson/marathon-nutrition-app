// Learn more https://docs.expo.dev/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const config = getSentryExpoConfig(__dirname);

// Add shared folder to watchFolders
config.watchFolders = [
  path.resolve(__dirname, '../shared'),
  path.resolve(__dirname, '..'),
];

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
};

module.exports = config;

