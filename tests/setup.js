// Minimal env so shared web Supabase + API client modules can load in CI.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.NEXT_PUBLIC_API_URL ||= 'https://api.example.com';
