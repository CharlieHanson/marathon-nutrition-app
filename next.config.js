/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config) => {
    // Prefer platform-specific .web.js modules so shared code never pulls in
    // React Native clients (e.g. supabase.native.js / AsyncStorage).
    config.resolve.extensions = ['.web.js', '.web.jsx', ...config.resolve.extensions];
    return config;
  },
}

module.exports = nextConfig
