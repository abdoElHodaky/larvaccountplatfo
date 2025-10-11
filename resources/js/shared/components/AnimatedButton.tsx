/**
 * Animated Button Component - Phase 11 Integration
 * Enhanced button with smooth animations and accessibility
 */

import React, { useRef, useCallback, forwardRef, ButtonHTMLAttributes } from 'react';
import { useAnimation } from '../providers/AnimationProvider';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  animationType?: 'scale' | 'fade' | 'slide' | 'bounce';
  children: React.ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  animationType = 'scale',
  className = '',
  children,
  onClick,
  disabled,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { animate, presets, isReducedMotion } = useAnimation();

  // Base classes for styling
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Animation handlers
  const handleMouseEnter = useCallback(async () => {
    if (isReducedMotion || loading || disabled) return;

    const element = buttonRef.current;
    if (!element) return;

    try {
      switch (animationType) {
        case 'scale':
          await animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
        
        case 'fade':
          await animate(element, [
            { opacity: 1 },
            { opacity: 0.8 }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
        
        case 'slide':
          await animate(element, [
            { transform: 'translateY(0px)' },
            { transform: 'translateY(-2px)' }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
        
        case 'bounce':
          await animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1.05)' }
          ], { ...presets.spring, fillMode: 'forwards' });
          break;
      }
    } catch (error) {
      console.warn('Button hover animation failed:', error);
    }
  }, [animate, animationType, presets, isReducedMotion, loading, disabled]);

  const handleMouseLeave = useCallback(async () => {
    if (isReducedMotion || loading || disabled) return;

    const element = buttonRef.current;
    if (!element) return;

    try {
      switch (animationType) {
        case 'scale':
        case 'bounce':
          await animate(element, [
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
        
        case 'fade':
          await animate(element, [
            { opacity: 0.8 },
            { opacity: 1 }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
        
        case 'slide':
          await animate(element, [
            { transform: 'translateY(-2px)' },
            { transform: 'translateY(0px)' }
          ], { ...presets.fast, fillMode: 'forwards' });
          break;
      }
    } catch (error) {
      console.warn('Button leave animation failed:', error);
    }
  }, [animate, animationType, presets, isReducedMotion, loading, disabled]);

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    const element = buttonRef.current;
    if (!element) return;

    // Click animation
    if (!isReducedMotion) {
      try {
        await animate(element, [
          { transform: 'scale(1)' },
          { transform: 'scale(0.95)' },
          { transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
      } catch (error) {
        console.warn('Button click animation failed:', error);
      }
    }

    // Call original onClick handler
    if (onClick) {
      onClick(event);
    }
  }, [animate, isReducedMotion, loading, disabled, onClick]);

  // Combine classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className
  ].join(' ');

  return (
    <button
      ref={(node) => {
        buttonRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={combinedClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
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
      {children}
    </button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
