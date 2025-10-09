/**
 * Loading Spinner Component
 * Reusable loading indicator with multiple sizes and variants
 * Updated to use Tailwind CSS instead of Chakra UI
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  className?: string;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  blue: 'border-blue-600',
  gray: 'border-gray-600',
  white: 'border-white',
  green: 'border-green-600',
  red: 'border-red-600',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  overlay = false,
  fullScreen = false,
  color = 'blue',
  className = '',
}) => {
  const spinnerClasses = `
    animate-spin rounded-full border-2 border-t-transparent
    ${sizeClasses[size]}
    ${colorClasses[color]}
    ${className}
  `.trim();

  const spinner = (
    <div className="flex flex-col items-center space-y-3">
      <div className={spinnerClasses} />
      {label && (
        <p className="text-sm text-gray-600 text-center">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-md">
        {spinner}
      </div>
    );
  }

  return spinner;
};
