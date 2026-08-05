import React from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';

/**
 * Form select facade that preserves the previous native-select API
 * (value, onChange with event.target.value, options array).
 */
export const Select = ({
  label,
  options = [],
  error,
  helperText,
  placeholder = 'Select an option',
  className = '',
  disabled,
  value,
  onChange,
  name,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const stringValue = value === undefined || value === null || value === ''
    ? undefined
    : String(value);

  const handleValueChange = (next) => {
    if (!onChange) return;
    onChange({
      target: {
        name,
        value: next,
      },
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={selectId}>{label}</Label>
      )}
      <ShadcnSelect
        value={stringValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            error && 'border-red-500 focus:ring-red-200 focus:border-red-500'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
