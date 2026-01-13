# Shared Code Directory

This directory contains code that is shared between the web application and the React Native mobile application. This allows for code reuse and ensures consistency across platforms.

## Structure

```
shared/
├── lib/
│   ├── supabase.js        # Platform-aware Supabase client (auto-selects web/native)
│   ├── supabase.web.js    # Supabase client for web/Next.js (uses localStorage)
│   ├── supabase.native.js # Supabase client for React Native (uses AsyncStorage)
│   └── dataClient.js      # Database client functions (Supabase operations)
├── services/
│   └── api.js             # API client for backend service calls
└── hooks/                # React hooks for shared business logic
```

## Purpose

### `lib/supabase.js`, `lib/supabase.web.js`, `lib/supabase.native.js`
Platform-aware Supabase client setup that automatically selects the correct implementation:
- **`supabase.web.js`**: For web/Next.js applications, uses `localStorage` for session persistence
- **`supabase.native.js`**: For React Native applications, uses `AsyncStorage` for session persistence
- **`supabase.js`**: Main entry point that automatically detects the platform and exports the appropriate client

**Environment Variables:**
- **Web/Next.js**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **React Native**: `EXPO_PUBLIC_SUPABASE_URL` (or `REACT_NATIVE_SUPABASE_URL`) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `REACT_NATIVE_SUPABASE_ANON_KEY`)

**Usage:**
```javascript
// Automatically uses the correct client based on platform
import { supabase } from './shared/lib/supabase';

// Or explicitly import platform-specific version
import { supabase } from './shared/lib/supabase.web';  // Web only
import { supabase } from './shared/lib/supabase.native'; // React Native only
```

**Note:** For React Native, you'll need to install `@react-native-async-storage/async-storage`:
```bash
npm install @react-native-async-storage/async-storage
```

### `lib/dataClient.js`
Contains all database interaction functions that work with Supabase. This includes:
- User profile management
- Meal plan operations
- Training plan operations
- Saved meals management
- Food preferences
- Onboarding status checks

These functions are platform-agnostic and can be used by both web and mobile apps, as long as they have access to a Supabase client instance.

### `services/api.js`
Centralized API client for making HTTP requests to backend services. This includes:
- Meal generation endpoints
- Recipe fetching
- Grocery list generation
- Nutrition validation

The API client abstracts the HTTP layer, making it easy to swap implementations for different platforms (e.g., using `fetch` on web and React Native's networking on mobile).

### `hooks/`
React hooks that encapsulate shared business logic and state management. These hooks can be used in both React (web) and React Native applications. Examples include:
- `useUserProfile` - User profile state management
- `useMealPlan` - Meal plan state and operations
- `useTrainingPlan` - Training plan state and operations
- `useFoodPreferences` - Food preferences management
- `useSavedMeals` - Saved meals state management

## Usage

### In Web App
```javascript
// Import Supabase client (automatically uses web version)
import { supabase } from '../shared/lib/supabase';

// Import from shared directory
import { fetchPersonalInfo } from '../shared/lib/dataClient';
import { apiClient } from '../shared/services/api';
import { useUserProfile } from '../shared/hooks/useUserProfile';
```

### In React Native App
```javascript
// Import Supabase client (automatically uses native version with AsyncStorage)
import { supabase } from '../shared/lib/supabase';

// Import from shared directory (adjust path as needed)
import { fetchPersonalInfo } from '../shared/lib/dataClient';
import { apiClient } from '../shared/services/api';
import { useUserProfile } from '../shared/hooks/useUserProfile';
```

## Migration Notes

When migrating code from `src/` to `shared/`:

1. **Remove platform-specific dependencies**: Ensure code doesn't rely on web-only or mobile-only APIs
2. **Abstract platform differences**: Use dependency injection or platform detection for platform-specific code
3. **Update imports**: Change imports in both web and mobile apps to reference shared code
4. **Test on both platforms**: Verify functionality works correctly in both environments

## Platform-Specific Considerations

- **Supabase Client**: The shared `supabase.js` automatically handles platform differences:
  - Web uses `localStorage` (via `supabase.web.js`)
  - React Native uses `AsyncStorage` (via `supabase.native.js`)
  - Platform detection happens automatically at runtime
- **API Base URL**: May need to be configurable for different environments (web vs mobile)
- **Storage**: File system operations may need platform-specific implementations
- **Navigation**: Hooks should avoid direct navigation calls; use callbacks or context instead
- **Environment Variables**: Use platform-specific prefixes (`NEXT_PUBLIC_` for Next.js, `EXPO_PUBLIC_` or `REACT_NATIVE_` for React Native)

