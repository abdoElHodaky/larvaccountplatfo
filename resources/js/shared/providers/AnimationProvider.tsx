/**
 * Animation Provider - Phase 11 Integration
 * Centralized animation management with performance monitoring
 */

import React, { createContext, useContext, useCallback, useRef, useEffect, ReactNode } from 'react';

// Animation configuration types
interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}

interface PerformanceMetrics {
  animationCount: number;
  averageFrameTime: number;
  droppedFrames: number;
  memoryUsage: number;
}

interface AnimationContextType {
  // Core animation methods
  animate: (element: HTMLElement, keyframes: Keyframe[], config: AnimationConfig) => Promise<void>;
  fadeIn: (element: HTMLElement, duration?: number) => Promise<void>;
  fadeOut: (element: HTMLElement, duration?: number) => Promise<void>;
  slideIn: (element: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', duration?: number) => Promise<void>;
  slideOut: (element: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', duration?: number) => Promise<void>;
  
  // Performance monitoring
  getPerformanceMetrics: () => PerformanceMetrics;
  isReducedMotion: boolean;
  
  // Animation presets
  presets: {
    fast: AnimationConfig;
    normal: AnimationConfig;
    slow: AnimationConfig;
    spring: AnimationConfig;
  };
}

const AnimationContext = createContext<AnimationContextType | null>(null);

interface AnimationProviderProps {
  children: ReactNode;
  enablePerformanceMonitoring?: boolean;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ 
  children, 
  enablePerformanceMonitoring = true 
}) => {
  const performanceMetrics = useRef<PerformanceMetrics>({
    animationCount: 0,
    averageFrameTime: 0,
    droppedFrames: 0,
    memoryUsage: 0
  });

  const animationObserver = useRef<PerformanceObserver | null>(null);
  const isReducedMotion = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion.current = mediaQuery.matches;
    
    const handleChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches;
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Performance monitoring setup
  useEffect(() => {
    if (!enablePerformanceMonitoring || !window.PerformanceObserver) return;

    animationObserver.current = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.startsWith('animation-')) {
          performanceMetrics.current.animationCount++;
          performanceMetrics.current.averageFrameTime = 
            (performanceMetrics.current.averageFrameTime + entry.duration) / 2;
        }
      });
    });

    animationObserver.current.observe({ entryTypes: ['measure'] });

    return () => {
      animationObserver.current?.disconnect();
    };
  }, [enablePerformanceMonitoring]);

  // Animation presets
  const presets: AnimationContextType['presets'] = {
    fast: { duration: 150, easing: 'ease-out' },
    normal: { duration: 300, easing: 'ease-in-out' },
    slow: { duration: 500, easing: 'ease-in-out' },
    spring: { duration: 400, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' }
  };

  // Core animation method
  const animate = useCallback(async (
    element: HTMLElement, 
    keyframes: Keyframe[], 
    config: AnimationConfig
  ): Promise<void> => {
    if (isReducedMotion.current) {
      // Skip animation for reduced motion preference
      return Promise.resolve();
    }

    const animationId = `animation-${Date.now()}-${Math.random()}`;
    
    if (enablePerformanceMonitoring) {
      performance.mark(`${animationId}-start`);
    }

    return new Promise((resolve, reject) => {
      try {
        const animation = element.animate(keyframes, {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay || 0,
          fill: config.fillMode || 'forwards'
        });

        animation.addEventListener('finish', () => {
          if (enablePerformanceMonitoring) {
            performance.mark(`${animationId}-end`);
            performance.measure(animationId, `${animationId}-start`, `${animationId}-end`);
          }
          resolve();
        });

        animation.addEventListener('cancel', () => {
          reject(new Error('Animation was cancelled'));
        });

      } catch (error) {
        reject(error);
      }
    });
  }, [enablePerformanceMonitoring]);

  // Fade animations
  const fadeIn = useCallback(async (element: HTMLElement, duration = 300): Promise<void> => {
    return animate(element, [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration, easing: 'ease-out' });
  }, [animate]);

  const fadeOut = useCallback(async (element: HTMLElement, duration = 300): Promise<void> => {
    return animate(element, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration, easing: 'ease-in' });
  }, [animate]);

  // Slide animations
  const slideIn = useCallback(async (
    element: HTMLElement, 
    direction: 'left' | 'right' | 'up' | 'down' = 'left', 
    duration = 300
  ): Promise<void> => {
    const transforms = {
      left: ['translateX(-100%)', 'translateX(0)'],
      right: ['translateX(100%)', 'translateX(0)'],
      up: ['translateY(-100%)', 'translateY(0)'],
      down: ['translateY(100%)', 'translateY(0)']
    };

    return animate(element, [
      { transform: transforms[direction][0], opacity: 0 },
      { transform: transforms[direction][1], opacity: 1 }
    ], { duration, easing: 'ease-out' });
  }, [animate]);

  const slideOut = useCallback(async (
    element: HTMLElement, 
    direction: 'left' | 'right' | 'up' | 'down' = 'left', 
    duration = 300
  ): Promise<void> => {
    const transforms = {
      left: ['translateX(0)', 'translateX(-100%)'],
      right: ['translateX(0)', 'translateX(100%)'],
      up: ['translateY(0)', 'translateY(-100%)'],
      down: ['translateY(0)', 'translateY(100%)']
    };

    return animate(element, [
      { transform: transforms[direction][0], opacity: 1 },
      { transform: transforms[direction][1], opacity: 0 }
    ], { duration, easing: 'ease-in' });
  }, [animate]);

  // Performance metrics getter
  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    return { ...performanceMetrics.current };
  }, []);

  const contextValue: AnimationContextType = {
    animate,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    getPerformanceMetrics,
    isReducedMotion: isReducedMotion.current,
    presets
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

// Custom hook for using animations
export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// Higher-order component for animated components
export const withAnimation = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => (
    <AnimationProvider>
      <Component {...props} />
    </AnimationProvider>
  );
};

export default AnimationProvider;
