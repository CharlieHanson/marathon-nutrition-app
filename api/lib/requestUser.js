export function getRequestUserId(req) {
  if (req.userId) return req.userId;

  if (process.env.REQUIRE_AUTH === 'true') {
    return null;
  }

  const legacyUserId =
    req.body?.userId ||
    req.query?.userId ||
    req.params?.userId;

  if (legacyUserId) {
    console.warn('[auth] REQUIRE_AUTH is off; using legacy client-supplied userId');
  }

  return legacyUserId || null;
}
