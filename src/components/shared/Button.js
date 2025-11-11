import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props 
}) => {
  const baseStyles = 'rounded-md font-medium transition-colors flex items-center gap-2 justify-center';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-700 hover:scale-105 disabled:bg-gray-400',
    secondary: 'bg-secondary text-gray-900 hover:bg-secondary-600 disabled:bg-gray-300',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:border-gray-300 disabled:text-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
    ghost: 'text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};