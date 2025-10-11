/**
 * Button Component - Phase 6 Unified Design System
 * 
 * A versatile button component with multiple variants, sizes,
 * and states for consistent user interactions.
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color scheme */
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  solid: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
    error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    gray: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  },
  outline: {
    primary: 'border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    secondary: 'border-secondary-600 text-secondary-600 hover:bg-secondary-50 focus:ring-secondary-500',
    success: 'border-success-600 text-success-600 hover:bg-success-50 focus:ring-success-500',
    warning: 'border-warning-600 text-warning-600 hover:bg-warning-50 focus:ring-warning-500',
    error: 'border-error-600 text-error-600 hover:bg-error-50 focus:ring-error-500',
    gray: 'border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
  },
  ghost: {
    primary: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    secondary: 'text-secondary-600 hover:bg-secondary-50 focus:ring-secondary-500',
    success: 'text-success-600 hover:bg-success-50 focus:ring-success-500',
    warning: 'text-warning-600 hover:bg-warning-50 focus:ring-warning-500',
    error: 'text-error-600 hover:bg-error-50 focus:ring-error-500',
    gray: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
  },
  link: {
    primary: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
    secondary: 'text-secondary-600 hover:text-secondary-700 underline-offset-4 hover:underline',
    success: 'text-success-600 hover:text-success-700 underline-offset-4 hover:underline',
    warning: 'text-warning-600 hover:text-warning-700 underline-offset-4 hover:underline',
    error: 'text-error-600 hover:text-error-700 underline-offset-4 hover:underline',
    gray: 'text-gray-600 hover:text-gray-700 underline-offset-4 hover:underline',
  },
} as const;

const sizeClasses = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2 text-base',
  xl: 'px-6 py-3 text-base',
} as const;

export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = 'md',
  colorScheme = 'primary',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonClasses = cn(
    // Base styles
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    
    // Size classes
    sizeClasses[size],
    
    // Variant and color classes
    variantClasses[variant][colorScheme],
    
    // Border for outline variant
    variant === 'outline' && 'border',
    
    // Full width
    fullWidth && 'w-full',
    
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    
    // Custom classes
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {/* Left icon */}
      {!loading && leftIcon && (
        <span className="mr-2">
          {leftIcon}
        </span>
      )}
      
      {/* Button content */}
      {children}
      
      {/* Right icon */}
      {!loading && rightIcon && (
        <span className="ml-2">
          {rightIcon}
        </span>
      )}
    </button>
  );
};
