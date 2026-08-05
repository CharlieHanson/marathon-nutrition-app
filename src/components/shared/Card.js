import React from 'react';
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

export const Card = ({ children, title, subtitle, className = '', headerAction }) => {
  return (
    <ShadcnCard className={cn(className)}>
      {(title || headerAction) && (
        <CardHeader className="flex flex-row justify-between items-center space-y-0">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && (
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className={!title && !headerAction ? undefined : undefined}>
        {children}
      </CardContent>
    </ShadcnCard>
  );
};
