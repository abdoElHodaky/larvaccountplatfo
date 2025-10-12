/**
 * Animated Loader Component - Phase 4
 * Unified loading states with skeleton, spinner, and progress animations
 */

import React, { useRef, useEffect, forwardRef } from 'react';
import { animations, keyframes, animate, type AnimatedComponentProps } from '../animations';

interface LoaderProps extends AnimatedComponentProps {
  type?: 'skeleton' | 'spinner' | 'progress' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'green' | 'red';
  text?: string;
  progress?: number; // 0-100 for progress type
  lines?: number; // Number of skeleton lines
}

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(({
  type = 'spinner',
  size = 'md',
  color = 'blue',
  text,
  progress = 0,
  lines = 3,
  className = '',
  animationType = 'normal',
  disabled = false,
  ...props
}, ref) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const config = animations[animationType];

  // Size configurations
  const sizes = {
    sm: { spinner: 'w-4 h-4', text: 'text-sm', skeleton: 'h-3' },
    md: { spinner: 'w-8 h-8', text: 'text-base', skeleton: 'h-4' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg', skeleton: 'h-6' }
  };

  // Color configurations
  const colors = {
    blue: 'border-blue-500 text-blue-500',
    gray: 'border-gray-500 text-gray-500',
    green: 'border-green-500 text-green-500',
    red: 'border-red-500 text-red-500'
  };

  // Setup animations
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || animate.shouldReduce() || disabled) return;

    let animation: Animation;

    switch (type) {
      case 'skeleton':
        animation = animate.run(loader, keyframes.loaderSkeleton, {
          ...config,
          duration: 1500
        });
        animation.addEventListener('finish', () => animation.play());
        break;

      case 'spinner':
        animation = animate.run(loader, keyframes.loaderSpin, {
          ...config,
          duration: 1000
        });
        animation.addEventListener('finish', () => animation.play());
        break;

      case 'pulse':
        animation = animate.run(loader, keyframes.loaderPulse, {
          ...config,
          duration: 1000
        });
        animation.addEventListener('finish', () => animation.play());
        break;

      case 'dots':
        // Animate dots with stagger
        const dots = loader.querySelectorAll('.dot');
        animate.stagger(Array.from(dots), keyframes.loaderPulse, config, 200);
        break;
    }

    return () => animation?.cancel();
  }, [type, config, disabled]);

  const renderLoader = () => {
    switch (type) {
      case 'skeleton':
        return (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`bg-gray-300 rounded ${sizes[size].skeleton} ${
                  i === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        );

      case 'spinner':
        return (
          <div
            className={`
              ${sizes[size].spinner} 
              border-2 border-gray-200 border-t-transparent 
              rounded-full animate-spin
              ${colors[color]}
            `}
          />
        );

      case 'progress':
        return (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 bg-${color}-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        );

      case 'pulse':
        return (
          <div
            className={`
              ${sizes[size].spinner} 
              bg-current rounded-full
              ${colors[color]}
            `}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`
                  dot w-2 h-2 bg-current rounded-full
                  ${colors[color]}
                `}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const baseClasses = `
    flex items-center justify-center
    ${disabled ? 'opacity-50' : ''}
    ${className}
  `.trim();

  return (
    <div
      ref={ref || loaderRef}
      className={baseClasses}
      {...props}
    >
      <div className="flex flex-col items-center space-y-2">
        {renderLoader()}
        {text && (
          <p className={`${sizes[size].text} ${colors[color]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
});

Loader.displayName = 'Loader';

