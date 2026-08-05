import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

/**
 * Fade + bounce-up when scrolled into view (once).
 * Uses springy cubic-bezier so content arrives with a soft overshoot.
 */
export function RevealOnScroll({
  children,
  className = '',
  delayMs = 0,
  y = 36,
  asElement = 'div',
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Prefer-reduced-motion: show immediately
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -56px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = asElement;

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
        transition: [
          `opacity 0.5s ease-out ${delayMs}ms`,
          `transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) ${delayMs}ms`,
        ].join(', '),
        willChange: shown ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
