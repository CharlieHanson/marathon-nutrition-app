import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Revalidate after this much time in the background. */
export const STALE_MS = 5 * 60 * 1000;

/**
 * On AppState → active, call revalidate if lastFetchedAt is older than STALE_MS.
 * Does not refetch on focus. lastFetchedAtRef should hold a number | null.
 */
export function useStaleAppStateRevalidate(revalidate, lastFetchedAtRef, enabled) {
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  useEffect(() => {
    if (!enabled) return undefined;

    const onChange = (nextState) => {
      if (nextState !== 'active') return;
      const at = lastFetchedAtRef.current;
      if (at != null && Date.now() - at > STALE_MS) {
        revalidateRef.current?.({ background: true });
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [enabled, lastFetchedAtRef]);
}
