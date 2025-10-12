/**
 * Animated Card Component - Phase 4 + Phase 5 Integration
 * Unified card with hover, loading, and interaction animations + LiveIcons support
 */

import React, { useRef, useEffect, forwardRef } from 'react';
import { animations, keyframes, animate, type AnimatedComponentProps } from '../animations';
import { type LiveIconProps } from '../icons';

interface CardProps extends AnimatedComponentProps {
  hover?: boolean;
  loading?: boolean;
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
  // Phase 5: LiveIcons integration
  icon?: React.ComponentType<LiveIconProps>;
  iconProps?: LiveIconProps;
  iconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  animationType = 'normal',
  hover = true,
  loading = false,
  interactive = false,
  variant = 'default',
  disabled = false,
  onClick,
  // Phase 5: LiveIcons props
  icon: Icon,
  iconProps = {},
  iconPosition = 'top-right',
  ...props
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const config = animations[animationType];

  // Variant styles
  const variants = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    elevated: 'bg-white rounded-lg shadow-md',
    outlined: 'bg-white border-2 border-gray-300 rounded-lg'
  };

  // Setup animations
  useEffect(() => {
    const card = cardRef.current;
    if (!card || animate.shouldReduce()) return;

    // Loading animation
    if (loading) {
      const loadAnimation = animate.run(card, keyframes.cardLoad, config);
      loadAnimation.addEventListener('finish', () => {
        if (loading) loadAnimation.play(); // Loop while loading
      });
      return () => loadAnimation.cancel();
    }

    // Hover animations
    if (hover && !disabled) {
      const handleMouseEnter = () => animate.run(card, keyframes.cardHover, animations.fast);
      const handleMouseLeave = () => animate.run(card, [...keyframes.cardHover].reverse(), animations.fast);
      
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [hover, loading, disabled, config]);

  // Click handler with animation
  const handleClick = () => {
    if (disabled || !onClick) return;
    
    const card = cardRef.current;
    if (card && !animate.shouldReduce()) {
      animate.run(card, [
        { transform: 'scale(1)' },
        { transform: 'scale(0.98)' },
        { transform: 'scale(1)' }
      ], animations.fast);
    }
    
    onClick();
  };

  const baseClasses = `
    ${variants[variant]}
    ${interactive || onClick ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'animate-pulse' : ''}
    transition-all duration-200
    ${className}
  `.trim();

  // Icon positioning classes
  const iconPositionClasses = {
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
    'center': 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div
      ref={ref || cardRef}
      className={`${baseClasses} ${Icon ? 'relative' : ''}`}
      onClick={handleClick}
      {...props}
    >
      {Icon && (
        <div className={iconPositionClasses[iconPosition]}>
          <Icon
            size="sm"
            color="secondary"
            trigger="hover"
            {...iconProps}
          />
        </div>
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';
