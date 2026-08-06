const DASHBOARD_CACHE_PREFIX = 'alimenta:dashboard:';

function cacheKey(userId) {
  return `${DASHBOARD_CACHE_PREFIX}${userId}`;
}

export function readDashboardCache(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeDashboardCache(userId, partial) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const prev = readDashboardCache(userId) || {};
    localStorage.setItem(
      cacheKey(userId),
      JSON.stringify({
        ...prev,
        ...partial,
        updatedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearDashboardCache(userId) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    // ignore
  }
}
