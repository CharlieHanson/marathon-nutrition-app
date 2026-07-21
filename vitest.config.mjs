import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
  },
  resolve: {
    // Match Next.js: prefer .web.js so shared clients don't pull React Native.
    extensions: ['.web.js', '.web.jsx', '.mjs', '.js', '.jsx', '.json'],
  },
});
