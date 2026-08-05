import React from 'react';

/** Decorative mint/peach circles matching the mobile app aesthetic */
export function PageDecor({ className = '' }) {
  return (
    <div className={`page-decor ${className}`} aria-hidden="true">
      <div className="page-decor-mint" />
      <div className="page-decor-peach" />
    </div>
  );
}
