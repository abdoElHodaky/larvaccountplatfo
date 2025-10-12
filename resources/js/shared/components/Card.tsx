/**
 * Animated Card Component - Phase 4
 * Unified card with hover, loading, and interaction animations
 */

import React, { useRef, useEffect, forwardRef } from 'react';
import { animations, keyframes, animate, type AnimatedComponentProps } from '../animations';

interface CardProps extends AnimatedComponentProps {
  hover?: boolean;
  loading?: boolean;
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
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

  return (
    <div
      ref={ref || cardRef}
      className={baseClasses}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

