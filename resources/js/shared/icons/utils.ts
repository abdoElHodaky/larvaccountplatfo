/**
 * Icon Utilities - Enhanced LiveIcon System
 * Provides utilities for creating and managing animated icons with parallel processing
 */

import React, { Suspense } from 'react';
import { animate, animations } from '../animations';
import { iconRegistry } from './IconRegistry';
import type { IconProps } from './types';
import { ICON_SIZES, ICON_COLORS, ICON_ANIMATIONS } from './types';

// Enhanced LiveIcon component with parallel processing
export const createLiveIcon = (
  iconName: string,
  defaultAnimation?: keyof typeof ICON_ANIMATIONS
) => {
  return React.forwardRef<SVGSVGElement, IconProps>(
    ({ 
      size = 'md',
      color = 'gray',
      animated = true,
      animationType = 'pulse',
      trigger = 'hover',
      className = '',
      onClick,
      ...props 
    }, ref) => {
      const [IconComponent, setIconComponent] = React.useState<React.ComponentType<any> | null>(null);
      const [isLoading, setIsLoading] = React.useState(true);
      const iconRef = React.useRef<SVGSVGElement>(null);
      const animationRef = React.useRef<Animation | null>(null);

      // Load icon component
      React.useEffect(() => {
        let isMounted = true;
        
        iconRegistry.loadIcon(iconName).then(component => {
          if (isMounted && component) {
            setIconComponent(() => component);
            setIsLoading(false);
          }
        });

        return () => {
          isMounted = false;
        };
      }, [iconName]);

      // Setup animations with parallel processing
      React.useEffect(() => {
        const icon = iconRef.current;
        if (!icon || !animated || animate.shouldReduce() || isLoading) return;

        const metadata = iconRegistry.getIconMetadata(iconName);
        const finalAnimation = defaultAnimation || metadata?.defaultAnimation || animationType;
        const animationKeyframes = ICON_ANIMATIONS[finalAnimation];
        const config = animations.normal;

        // Cleanup previous animation
        if (animationRef.current) {
          animationRef.current.cancel();
        }

        const setupAnimation = () => {
          switch (trigger) {
            case 'hover':
              const handleMouseEnter = () => {
                animationRef.current = animate.run(icon, animationKeyframes, config);
              };
              const handleMouseLeave = () => {
                if (animationRef.current) {
                  animationRef.current.cancel();
                }
                animationRef.current = animate.run(icon, [...animationKeyframes].reverse(), animations.fast);
              };
              
              icon.addEventListener('mouseenter', handleMouseEnter);
              icon.addEventListener('mouseleave', handleMouseLeave);
              
              return () => {
                icon.removeEventListener('mouseenter', handleMouseEnter);
                icon.removeEventListener('mouseleave', handleMouseLeave);
              };

            case 'click':
              const handleClick = () => {
                animationRef.current = animate.run(icon, animationKeyframes, animations.fast);
              };
              icon.addEventListener('click', handleClick);
              return () => icon.removeEventListener('click', handleClick);

            case 'visible':
              const observer = animate.onVisible(icon, animationKeyframes, config);
              return () => observer.disconnect();

            case 'always':
              const runContinuousAnimation = () => {
                animationRef.current = animate.run(icon, animationKeyframes, { 
                  ...config, 
                  duration: config.duration * 2 
                });
                animationRef.current.addEventListener('finish', runContinuousAnimation);
              };
              runContinuousAnimation();
              return () => {
                if (animationRef.current) {
                  animationRef.current.cancel();
                }
              };
          }
        };

        const cleanup = setupAnimation();
        return cleanup;
      }, [animated, trigger, animationType, defaultAnimation, iconName, isLoading]);

      // Cleanup animation on unmount
      React.useEffect(() => {
        return () => {
          if (animationRef.current) {
            animationRef.current.cancel();
          }
        };
      }, []);

      if (isLoading || !IconComponent) {
        // Loading placeholder
        const loadingClasses = [
          ICON_SIZES[size], 
          ICON_COLORS[color], 
          'animate-pulse', 
          'bg-current', 
          'opacity-20', 
          'rounded'
        ].join(' ');
        
        return React.createElement('div', {
          className: loadingClasses,
          style: { aspectRatio: '1' }
        });
      }

      const classes = [
        ICON_SIZES[size],
        ICON_COLORS[color],
        animated ? 'transition-all duration-200' : '',
        onClick ? 'cursor-pointer' : '',
        className
      ].filter(Boolean).join(' ');

      return React.createElement(IconComponent, {
        ref: ref || iconRef,
        className: classes,
        onClick: onClick,
        ...props
      });
    }
  );
};

// Dynamic icon component for runtime icon selection
export const DynamicIcon: React.FC<IconProps & { name: string }> = ({ name, ...props }) => {
  const IconComponent = React.useMemo(() => createLiveIcon(name), [name]);
  
  const fallbackClasses = [
    ICON_SIZES[props.size || 'md'], 
    ICON_COLORS[props.color || 'gray'], 
    'animate-pulse', 
    'bg-current', 
    'opacity-20', 
    'rounded'
  ].join(' ');
  
  const fallbackElement = React.createElement('div', {
    className: fallbackClasses,
    style: { aspectRatio: '1' }
  });
  
  return React.createElement(Suspense, {
    fallback: fallbackElement
  }, React.createElement(IconComponent, props));
};

// Batch icon preloader for performance optimization
export const preloadIcons = async (iconNames: string[]): Promise<void> => {
  // Process icons in parallel batches for better performance
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < iconNames.length; i += batchSize) {
    batches.push(iconNames.slice(i, i + batchSize));
  }

  // Process batches in parallel
  await Promise.all(
    batches.map(batch => iconRegistry.preloadIcons(batch))
  );
};

// Icon existence checker
export const iconExists = (iconName: string): boolean => {
  return iconRegistry.getAvailableIcons().includes(iconName);
};

// Get icon suggestions based on partial name
export const getIconSuggestions = (partialName: string, limit = 5): string[] => {
  const availableIcons = iconRegistry.getAvailableIcons();
  return availableIcons
    .filter(name => name.toLowerCase().includes(partialName.toLowerCase()))
    .slice(0, limit);
};

// Icon component factory for common patterns
export const createIconSet = (iconNames: string[]) => {
  const iconSet: Record<string, React.ComponentType<IconProps>> = {};
  
  iconNames.forEach(name => {
    const pascalCaseName = name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    iconSet[pascalCaseName] = createLiveIcon(name);
  });
  
  return iconSet;
};

// Performance monitoring for icon loading
export const createIconPerformanceMonitor = () => {
  const loadTimes: Record<string, number> = {};
  const startTimes: Record<string, number> = {};
  
  return {
    startLoad: (iconName: string) => {
      startTimes[iconName] = performance.now();
    },
    endLoad: (iconName: string) => {
      if (startTimes[iconName]) {
        loadTimes[iconName] = performance.now() - startTimes[iconName];
        delete startTimes[iconName];
      }
    },
    getLoadTime: (iconName: string) => loadTimes[iconName],
    getAllLoadTimes: () => ({ ...loadTimes }),
    getAverageLoadTime: () => {
      const times = Object.values(loadTimes);
      return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }
  };
};

// Export constants from types for convenience
export { ICON_SIZES, ICON_COLORS, ICON_ANIMATIONS } from './types';
