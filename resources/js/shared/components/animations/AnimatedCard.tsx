import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';

export type CardAnimationType = 'fade' | 'slide' | 'scale' | 'flip';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animationType?: CardAnimationType;
  size?: CardSize;
  loading?: boolean;
  interactive?: boolean;
  elevated?: boolean;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
  className?: string;
}

const cardSizes = {
  sm: 'p-4 rounded-lg',
  md: 'p-6 rounded-xl',
  lg: 'p-8 rounded-xl',
  xl: 'p-10 rounded-2xl',
};

const animationPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    duration: 300,
  },
  slide: {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    exit: { opacity: 0, transform: 'translateY(-20px)' },
    duration: 400,
  },
  scale: {
    initial: { opacity: 0, transform: 'scale(0.95)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.95)' },
    duration: 300,
  },
  flip: {
    initial: { opacity: 0, transform: 'rotateY(-90deg)' },
    animate: { opacity: 1, transform: 'rotateY(0deg)' },
    exit: { opacity: 0, transform: 'rotateY(90deg)' },
    duration: 500,
  },
};

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(({
  animationType = 'fade',
  size = 'md',
  loading = false,
  interactive = false,
  elevated = false,
  className,
  children,
  onAnimationComplete,
  ...props
}, ref) => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preset = animationPresets[animationType];

    // Apply initial styles
    Object.assign(element.style, {
      opacity: String(preset.initial.opacity || 1),
      transform: (preset.initial as { transform?: string }).transform || 'none',
      transition: `all ${preset.duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    });

    // Trigger animation
    const animationFrame = requestAnimationFrame(() => {
      Object.assign(element.style, {
        opacity: String(preset.animate.opacity || 1),
        transform: (preset.animate as { transform?: string }).transform || 'none',
      });
    });

    // Handle animation completion
    const handleTransitionEnd = () => {
      onAnimationComplete?.();
    };

    element.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      cancelAnimationFrame(animationFrame);
      element?.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [animationType, onAnimationComplete]);

  const cardClasses = cn(
    'bg-white border border-gray-200 transition-all duration-300',
    cardSizes[size],
    {
      'shadow-sm hover:shadow-md': !elevated,
      'shadow-lg hover:shadow-xl': elevated,
      'cursor-pointer hover:scale-[1.02] active:scale-[0.98]': interactive,
      'animate-pulse': loading,
    },
    className
  );

  // Forward the ref to the underlying element
  useImperativeHandle(ref, () => elementRef.current as HTMLDivElement);

  return (
    <div
      ref={elementRef}
      className={cardClasses}
      {...props}
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ) : (
        children
      )}
    </div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

// Hook for managing card animations
export function useAnimatedCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationType, setAnimationType] = useState<CardAnimationType>('fade');

  const showCard = (animation: CardAnimationType = 'fade') => {
    setAnimationType(animation);
    setIsVisible(true);
  };

  const hideCard = () => {
    setIsVisible(false);
  };

  const toggleCard = (animation: CardAnimationType = 'fade') => {
    if (isVisible) {
      hideCard();
    } else {
      showCard(animation);
    }
  };

  return {
    isVisible,
    animationType,
    showCard,
    hideCard,
    toggleCard,
  };
}

export default AnimatedCard;
