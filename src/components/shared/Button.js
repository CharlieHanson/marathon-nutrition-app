import React from 'react';
import { Button as ShadcnButton } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export const Button = ({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </ShadcnButton>
  );
};
