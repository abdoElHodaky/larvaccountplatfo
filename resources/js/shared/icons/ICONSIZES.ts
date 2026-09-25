/**
 * Icon System Types - Simplified & Unified
 * Centralized type definitions for the LiveIcons system
 */

import React from 'react';

// Core icon configuration
export interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray';
  animated?: boolean;
  animationType?: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'loading' | 'success' | 'error';
  trigger?: 'hover' | 'click' | 'visible' | 'always';
  className?: string;
  onClick?: () => void;
}

// Icon categories for better organization
export type IconCategory = 'nav' | 'action' | 'form' | 'status';

// Icon registry entry
export interface IconRegistryEntry {
  name: string;
  category: IconCategory;
  component: React.ComponentType<any>;
  defaultAnimation?: IconProps['animationType'];
  description?: string;
}

// Icon registry type
export type IconRegistry = Record<string, IconRegistryEntry>;

// Size configurations
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
} as const;

// Color configurations (TailwindCSS compatible)
export const ICON_COLORS = {
  primary: 'text-primary-600 hover:text-primary-700',
  secondary: 'text-secondary-600 hover:text-secondary-700',
  success: 'text-success-600 hover:text-success-700',
  warning: 'text-warning-600 hover:text-warning-700',
  danger: 'text-danger-600 hover:text-danger-700',
  gray: 'text-gray-600 hover:text-gray-700'
} as const;

// Animation keyframes (mutable for Web Animations API)
export const ICON_ANIMATIONS = {
  bounce: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.2)' },
    { transform: 'scale(1)' }
  ] as Keyframe[],
  pulse: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.1)', opacity: 0.8 },
    { transform: 'scale(1)', opacity: 1 }
  ] as Keyframe[],
  rotate: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(180deg)' }
  ] as Keyframe[],
  shake: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-2px)' },
    { transform: 'translateX(2px)' },
    { transform: 'translateX(-2px)' },
    { transform: 'translateX(0)' }
  ] as Keyframe[],
  loading: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ] as Keyframe[],
  success: [
    { transform: 'scale(1)', opacity: 0.5 },
    { transform: 'scale(1.3)', opacity: 1 },
    { transform: 'scale(1)', opacity: 1 }
  ] as Keyframe[],
  error: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(3px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(0)' }
  ] as Keyframe[]
};

// Export the icon registry
export const iconRegistry: IconRegistry = {
  // This would normally be populated with actual icon components
};
