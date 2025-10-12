/**
 * Unified LiveIcons Integration - Phase 5
 * Seamless integration of animated icons with HeadlessUI and TailwindCSS
 */

import { animations, animate } from '../animations';

// Core icon configuration
export interface LiveIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray';
  animated?: boolean;
  animationType?: keyof typeof animations;
  trigger?: 'hover' | 'click' | 'visible' | 'always';
  className?: string;
  onClick?: () => void;
}

// Size configurations
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
} as const;

// Color configurations (TailwindCSS compatible)
export const iconColors = {
  primary: 'text-primary-600 hover:text-primary-700',
  secondary: 'text-secondary-600 hover:text-secondary-700',
  success: 'text-success-600 hover:text-success-700',
  warning: 'text-warning-600 hover:text-warning-700',
  danger: 'text-danger-600 hover:text-danger-700',
  gray: 'text-gray-600 hover:text-gray-700'
} as const;

// Animation presets for icons
export const iconAnimations = {
  // Hover animations
  bounce: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.2)' },
    { transform: 'scale(1)' }
  ],
  pulse: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.1)', opacity: 0.8 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  rotate: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(180deg)' }
  ],
  shake: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-2px)' },
    { transform: 'translateX(2px)' },
    { transform: 'translateX(-2px)' },
    { transform: 'translateX(0)' }
  ],
  
  // State animations
  loading: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ],
  success: [
    { transform: 'scale(1)', opacity: 0.5 },
    { transform: 'scale(1.3)', opacity: 1 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  error: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(3px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(0)' }
  ]
} as const;

// Base LiveIcon component interface
export interface BaseLiveIconProps extends LiveIconProps {
  children: React.ReactNode;
}

// Utility function to create animated icons
export const createLiveIcon = (
  IconComponent: React.ComponentType<any>,
  defaultAnimation?: keyof typeof iconAnimations
) => {
  return React.forwardRef<SVGSVGElement, LiveIconProps & React.ComponentProps<typeof IconComponent>>(
    ({ 
      size = 'md',
      color = 'gray',
      animated = true,
      animationType = 'normal',
      trigger = 'hover',
      className = '',
      onClick,
      ...props 
    }, ref) => {
      const iconRef = React.useRef<SVGSVGElement>(null);
      const config = animations[animationType];

      // Setup animations based on trigger
      React.useEffect(() => {
        const icon = iconRef.current;
        if (!icon || !animated || animate.shouldReduce()) return;

        const animationKeyframes = defaultAnimation ? iconAnimations[defaultAnimation] : iconAnimations.pulse;

        switch (trigger) {
          case 'hover':
            const handleMouseEnter = () => animate.run(icon, animationKeyframes, config);
            const handleMouseLeave = () => animate.run(icon, [...animationKeyframes].reverse(), animations.fast);
            
            icon.addEventListener('mouseenter', handleMouseEnter);
            icon.addEventListener('mouseleave', handleMouseLeave);
            
            return () => {
              icon.removeEventListener('mouseenter', handleMouseEnter);
              icon.removeEventListener('mouseleave', handleMouseLeave);
            };

          case 'click':
            const handleClick = () => animate.run(icon, animationKeyframes, animations.fast);
            icon.addEventListener('click', handleClick);
            return () => icon.removeEventListener('click', handleClick);

          case 'visible':
            const observer = animate.onVisible(icon, animationKeyframes, config);
            return () => observer.disconnect();

          case 'always':
            const animation = animate.run(icon, animationKeyframes, { ...config, duration: config.duration * 2 });
            animation.addEventListener('finish', () => animation.play());
            return () => animation.cancel();
        }
      }, [animated, trigger, config, defaultAnimation]);

      const classes = `
        ${iconSizes[size]}
        ${iconColors[color]}
        ${animated ? 'transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `.trim();

      return (
        <IconComponent
          ref={ref || iconRef}
          className={classes}
          onClick={onClick}
          {...props}
        />
      );
    }
  );
};

// Export React for the createLiveIcon function
import React from 'react';

// Export all icon categories
export * from './NavigationIcons';
export * from './FormIcons';
export * from './StatusIcons';
export * from './ActionIcons';
