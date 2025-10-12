import React, { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/shared/utils/cn';

export type ListAnimationType = 'stagger' | 'cascade' | 'wave' | 'fade';
export type ListDirection = 'up' | 'down' | 'left' | 'right';

interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
  animationType?: ListAnimationType;
  direction?: ListDirection;
  staggerDelay?: number;
  itemClassName?: string;
  loading?: boolean;
  loadingItems?: number;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
  delay?: number;
  children: React.ReactNode;
}

const directionTransforms = {
  up: 'translateY(20px)',
  down: 'translateY(-20px)',
  left: 'translateX(20px)',
  right: 'translateX(-20px)',
};

const animationPresets = {
  stagger: {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cascade: {
    initial: { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
    animate: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    duration: 400,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  wave: {
    initial: { opacity: 0, transform: 'translateY(30px) rotateX(-90deg)' },
    animate: { opacity: 1, transform: 'translateY(0px) rotateX(0deg)' },
    duration: 500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    duration: 250,
    easing: 'ease-out',
  },
};

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(({
  index = 0,
  delay = 0,
  className,
  children,
  ...props
}, ref) => {
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={(node) => {
        itemRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn('animated-list-item', className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
});

AnimatedListItem.displayName = 'AnimatedListItem';

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(({
  animationType = 'stagger',
  direction = 'up',
  staggerDelay = 100,
  itemClassName,
  loading = false,
  loadingItems = 3,
  className,
  children,
  onAnimationComplete,
  ...props
}, ref) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animatedCount, setAnimatedCount] = useState(0);

  const childrenArray = useMemo(() => 
    React.Children.toArray(children), [children]
  );

  const totalItems = childrenArray.length;

  useEffect(() => {
    const element = listRef.current;
    if (!element || loading) return;

    const preset = animationPresets[animationType];
    const items = element.querySelectorAll('.animated-list-item');

    items.forEach((item, index) => {
      const htmlItem = item as HTMLElement;
      const delay = index * staggerDelay;
      
      // Apply initial styles
      Object.assign(htmlItem.style, {
        opacity: String(preset.initial.opacity || 1),
        transform: preset.initial.transform?.replace('translateY(20px)', directionTransforms[direction]) || 'none',
        transition: `all ${preset.duration}ms ${preset.easing}`,
        transitionDelay: `${delay}ms`,
      });

      // Trigger animation
      const animationFrame = requestAnimationFrame(() => {
        Object.assign(htmlItem.style, {
          opacity: String(preset.animate.opacity || 1),
          transform: preset.animate.transform?.replace('translateY(0px)', 'translateY(0px)') || 'none',
        });
      });

      // Handle individual item animation completion
      const handleTransitionEnd = () => {
        setAnimatedCount(prev => {
          const newCount = prev + 1;
          if (newCount === totalItems) {
            setIsAnimating(false);
            onAnimationComplete?.();
          }
          return newCount;
        });
      };

      htmlItem.addEventListener('transitionend', handleTransitionEnd, { once: true });

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    });
  }, [animationType, direction, staggerDelay, totalItems, onAnimationComplete, loading]);

  const listClasses = cn(
    'animated-list space-y-2',
    className
  );

  if (loading) {
    return (
      <div ref={listRef} className={listClasses} {...props}>
        {Array.from({ length: loadingItems }, (_, index) => (
          <div
            key={`loading-${index}`}
            className={cn(
              'animate-pulse bg-gray-200 rounded h-16',
              itemClassName
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={listClasses}
      {...props}
    >
      {childrenArray.map((child, index) => (
        <AnimatedListItem
          key={index}
          index={index}
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {child}
        </AnimatedListItem>
      ))}
    </div>
  );
});

AnimatedList.displayName = 'AnimatedList';

// Hook for managing list animations
export function useAnimatedList() {
  const [items, setItems] = useState<any[]>([]);
  const [animationType, setAnimationType] = useState<ListAnimationType>('stagger');
  const [isLoading, setIsLoading] = useState(false);

  const addItem = (item: any, animation: ListAnimationType = 'stagger') => {
    setAnimationType(animation);
    setItems(prev => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newItem: any) => {
    setItems(prev => prev.map((item, i) => i === index ? newItem : item));
  };

  const clearItems = () => {
    setItems([]);
  };

  const loadItems = async (loadFn: () => Promise<any[]>, animation: ListAnimationType = 'stagger') => {
    setIsLoading(true);
    setAnimationType(animation);
    try {
      const newItems = await loadFn();
      setItems(newItems);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    animationType,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    loadItems,
  };
}

export default AnimatedList;
