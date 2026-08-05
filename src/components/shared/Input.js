import React from 'react';
import { Input as ShadcnInput } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';

export const Input = ({
  label,
  error,
  helperText,
  className = '',
  wrapperClassName = '',
  disabled,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      {label && (
        <Label htmlFor={inputId}>{label}</Label>
      )}
      <ShadcnInput
        id={inputId}
        disabled={disabled}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-200 focus-visible:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
