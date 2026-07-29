/**
 * True when the auth user was created within the last windowMs.
 * Used to distinguish OAuth signup from returning OAuth login.
 */
export function isNewlyCreatedUser(user, windowMs = 120_000) {
  if (!user?.created_at) return false;
  const createdAt = new Date(user.created_at).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt < windowMs;
}

/**
 * Resolve auth provider from Supabase user metadata / identities.
 */
export function getAuthProvider(user) {
  if (!user) return null;
  const fromMeta = user.app_metadata?.provider;
  if (fromMeta) return String(fromMeta).toLowerCase();
  const identity = user.identities?.[0]?.provider;
  if (identity) return String(identity).toLowerCase();
  return null;
}
