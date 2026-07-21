// Re-export the shared API client so web code has a single source of truth.
// Absolute API origin comes from NEXT_PUBLIC_API_URL via shared/services/api.js.
export {
  apiClient,
  apiRequest,
  authenticatedFetch,
  AuthError,
  RateLimitError,
  getAuthHeaders,
  getBaseUrl,
  getApiUrl,
  getMealGenApiUrl,
} from '../../shared/services/api';
