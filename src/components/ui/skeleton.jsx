import * as React from 'react';
import { cn } from '@/src/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-300', className)}
      {...props}
    />
  );
}

export { Skeleton };
