// Intentionally empty — do not restore runtime branching here.
// Webpack statically follows require() of both platforms and pulls AsyncStorage into the web bundle.
// Use platform resolution instead:
//   import { supabase } from '../services/getSupabase'  // resolves to getSupabase.web.js / .native.js
// Or import platform files directly: ./supabase.web / ./supabase.native
