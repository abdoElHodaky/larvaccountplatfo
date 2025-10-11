/**
 * Unified Component Utilities
 * Shared utilities for consistent component behavior
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Size, ColorScheme, Variant } from './types';

// =============================================================================
// CLASS NAME UTILITIES
// =============================================================================

/**
 * Combines class names with Tailwind CSS merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// SIZE UTILITIES
// =============================================================================

export const sizeClasses = {
  xs: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    height: 'h-6',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  sm: {
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    height: 'h-8',
    icon: 'h-4 w-4',
    gap: 'gap-1.5',
  },
  md: {
    text: 'text-sm',
    padding: 'px-4 py-2',
    height: 'h-10',
    icon: 'h-5 w-5',
    gap: 'gap-2',
  },
  lg: {
    text: 'text-base',
    padding: 'px-6 py-2.5',
    height: 'h-12',
    icon: 'h-6 w-6',
    gap: 'gap-2.5',
  },
  xl: {
    text: 'text-lg',
    padding: 'px-8 py-3',
    height: 'h-14',
    icon: 'h-7 w-7',
    gap: 'gap-3',
  },
} as const;

export function getSizeClasses(size: Size = 'md') {
  return sizeClasses[size];
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

export const colorClasses = {
  primary: {
    bg: 'bg-primary-500',
    bgHover: 'hover:bg-primary-600',
    bgActive: 'active:bg-primary-700',
    text: 'text-primary-600',
    textHover: 'hover:text-primary-700',
    border: 'border-primary-500',
    borderHover: 'hover:border-primary-600',
    ring: 'ring-primary-500',
    light: 'bg-primary-50 text-primary-700',
    dark: 'bg-primary-900 text-primary-100',
  },
  secondary: {
    bg: 'bg-gray-500',
    bgHover: 'hover:bg-gray-600',
    bgActive: 'active:bg-gray-700',
    text: 'text-gray-600',
    textHover: 'hover:text-gray-700',
    border: 'border-gray-500',
    borderHover: 'hover:border-gray-600',
    ring: 'ring-gray-500',
    light: 'bg-gray-50 text-gray-700',
    dark: 'bg-gray-900 text-gray-100',
  },
  success: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600',
    bgActive: 'active:bg-green-700',
    text: 'text-green-600',
    textHover: 'hover:text-green-700',
    border: 'border-green-500',
    borderHover: 'hover:border-green-600',
    ring: 'ring-green-500',
    light: 'bg-green-50 text-green-700',
    dark: 'bg-green-900 text-green-100',
  },
  warning: {
    bg: 'bg-yellow-500',
    bgHover: 'hover:bg-yellow-600',
    bgActive: 'active:bg-yellow-700',
    text: 'text-yellow-600',
    textHover: 'hover:text-yellow-700',
    border: 'border-yellow-500',
    borderHover: 'hover:border-yellow-600',
    ring: 'ring-yellow-500',
    light: 'bg-yellow-50 text-yellow-700',
    dark: 'bg-yellow-900 text-yellow-100',
  },
  error: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    bgActive: 'active:bg-red-700',
    text: 'text-red-600',
    textHover: 'hover:text-red-700',
    border: 'border-red-500',
    borderHover: 'hover:border-red-600',
    ring: 'ring-red-500',
    light: 'bg-red-50 text-red-700',
    dark: 'bg-red-900 text-red-100',
  },
  info: {
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600',
    bgActive: 'active:bg-blue-700',
    text: 'text-blue-600',
    textHover: 'hover:text-blue-700',
    border: 'border-blue-500',
    borderHover: 'hover:border-blue-600',
    ring: 'ring-blue-500',
    light: 'bg-blue-50 text-blue-700',
    dark: 'bg-blue-900 text-blue-100',
  },
  asset: {
    bg: 'bg-asset-500',
    bgHover: 'hover:bg-asset-600',
    bgActive: 'active:bg-asset-700',
    text: 'text-asset-600',
    textHover: 'hover:text-asset-700',
    border: 'border-asset-500',
    borderHover: 'hover:border-asset-600',
    ring: 'ring-asset-500',
    light: 'bg-asset-50 text-asset-700',
    dark: 'bg-asset-900 text-asset-100',
  },
  liability: {
    bg: 'bg-liability-500',
    bgHover: 'hover:bg-liability-600',
    bgActive: 'active:bg-liability-700',
    text: 'text-liability-600',
    textHover: 'hover:text-liability-700',
    border: 'border-liability-500',
    borderHover: 'hover:border-liability-600',
    ring: 'ring-liability-500',
    light: 'bg-liability-50 text-liability-700',
    dark: 'bg-liability-900 text-liability-100',
  },
  equity: {
    bg: 'bg-equity-500',
    bgHover: 'hover:bg-equity-600',
    bgActive: 'active:bg-equity-700',
    text: 'text-equity-600',
    textHover: 'hover:text-equity-700',
    border: 'border-equity-500',
    borderHover: 'hover:border-equity-600',
    ring: 'ring-equity-500',
    light: 'bg-equity-50 text-equity-700',
    dark: 'bg-equity-900 text-equity-100',
  },
  revenue: {
    bg: 'bg-revenue-500',
    bgHover: 'hover:bg-revenue-600',
    bgActive: 'active:bg-revenue-700',
    text: 'text-revenue-600',
    textHover: 'hover:text-revenue-700',
    border: 'border-revenue-500',
    borderHover: 'hover:border-revenue-600',
    ring: 'ring-revenue-500',
    light: 'bg-revenue-50 text-revenue-700',
    dark: 'bg-revenue-900 text-revenue-100',
  },
  expense: {
    bg: 'bg-expense-500',
    bgHover: 'hover:bg-expense-600',
    bgActive: 'active:bg-expense-700',
    text: 'text-expense-600',
    textHover: 'hover:text-expense-700',
    border: 'border-expense-500',
    borderHover: 'hover:border-expense-600',
    ring: 'ring-expense-500',
    light: 'bg-expense-50 text-expense-700',
    dark: 'bg-expense-900 text-expense-100',
  },
} as const;

export function getColorClasses(colorScheme: ColorScheme = 'primary') {
  return colorClasses[colorScheme];
}

// =============================================================================
// VARIANT UTILITIES
// =============================================================================

export function getVariantClasses(variant: Variant = 'primary', colorScheme: ColorScheme = 'primary') {
  const colors = getColorClasses(colorScheme);
  
  switch (variant) {
    case 'primary':
      return cn(
        colors.bg,
        colors.bgHover,
        colors.bgActive,
        'text-white',
        'border border-transparent',
        'shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        colors.ring
      );
    
    case 'secondary':
      return cn(
        'bg-white',
        'text-gray-700',
        'border border-gray-300',
        'hover:bg-gray-50',
        'active:bg-gray-100',
        'shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        colors.ring
      );
    
    case 'outline':
      return cn(
        'bg-transparent',
        colors.text,
        colors.textHover,
        colors.border,
        colors.borderHover,
        'hover:bg-opacity-5',
        colors.bgHover.replace('hover:bg-', 'hover:bg-opacity-5 hover:bg-'),
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        colors.ring
      );
    
    case 'ghost':
      return cn(
        'bg-transparent',
        colors.text,
        colors.textHover,
        'border border-transparent',
        'hover:bg-opacity-10',
        colors.bgHover.replace('hover:bg-', 'hover:bg-opacity-10 hover:bg-'),
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        colors.ring
      );
    
    case 'link':
      return cn(
        'bg-transparent',
        colors.text,
        colors.textHover,
        'border-none',
        'underline-offset-4',
        'hover:underline',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        colors.ring
      );
    
    default:
      return getVariantClasses('primary', colorScheme);
  }
}

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

export const animationClasses = {
  fade: 'transition-opacity duration-200',
  slide: 'transition-transform duration-200',
  scale: 'transition-transform duration-200',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  ping: 'animate-ping',
} as const;

export function getAnimationClasses(animation: keyof typeof animationClasses) {
  return animationClasses[animation];
}

// =============================================================================
// FOCUS UTILITIES
// =============================================================================

export const focusClasses = cn(
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-2',
  'focus:ring-primary-500'
);

export function getFocusClasses(colorScheme: ColorScheme = 'primary') {
  const colors = getColorClasses(colorScheme);
  return cn(
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    colors.ring
  );
}

// =============================================================================
// DISABLED UTILITIES
// =============================================================================

export const disabledClasses = cn(
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'disabled:pointer-events-none'
);

// =============================================================================
// LOADING UTILITIES
// =============================================================================

export const loadingClasses = cn(
  'relative',
  'overflow-hidden',
  'before:absolute',
  'before:inset-0',
  'before:bg-gradient-to-r',
  'before:from-transparent',
  'before:via-white/20',
  'before:to-transparent',
  'before:animate-shimmer'
);

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

export function getResponsiveClasses<T>(
  value: T | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', T>>,
  classMap: (val: T) => string
): string {
  if (typeof value === 'object' && value !== null) {
    const responsive = value as Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', T>>;
    return Object.entries(responsive)
      .map(([breakpoint, val]) => {
        if (val === undefined) return '';
        const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
        return `${prefix}${classMap(val)}`;
      })
      .filter(Boolean)
      .join(' ');
  }
  
  return classMap(value as T);
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function getValidationClasses(error?: string, success?: boolean) {
  if (error) {
    return cn(
      'border-red-300',
      'text-red-900',
      'placeholder-red-300',
      'focus:border-red-500',
      'focus:ring-red-500'
    );
  }
  
  if (success) {
    return cn(
      'border-green-300',
      'text-green-900',
      'placeholder-green-300',
      'focus:border-green-500',
      'focus:ring-green-500'
    );
  }
  
  return cn(
    'border-gray-300',
    'focus:border-primary-500',
    'focus:ring-primary-500'
  );
}

// =============================================================================
// ACCOUNTING UTILITIES
// =============================================================================

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getAccountingColorClasses(type: 'debit' | 'credit' | 'balance', amount: number) {
  if (amount === 0) {
    return 'text-gray-500 dark:text-gray-400';
  }
  
  switch (type) {
    case 'debit':
      return amount > 0 ? 'text-asset-600 dark:text-asset-400' : 'text-liability-600 dark:text-liability-400';
    case 'credit':
      return amount > 0 ? 'text-liability-600 dark:text-liability-400' : 'text-asset-600 dark:text-asset-400';
    case 'balance':
      return amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-900 dark:text-gray-100';
  }
}

// =============================================================================
// COMPONENT STATE UTILITIES
// =============================================================================

export function getStateClasses(loading?: boolean, disabled?: boolean, error?: string) {
  return cn(
    loading && loadingClasses,
    disabled && disabledClasses,
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
  );
}

// =============================================================================
// TRANSITION UTILITIES
// =============================================================================

export const transitionClasses = {
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
} as const;

export function getTransitionClasses(type: keyof typeof transitionClasses = 'all') {
  return transitionClasses[type];
}
