/**
 * Animation Provider - Web Animations API wrapper
 * Provides consistent animation utilities across the application
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';

interface AnimationOptions {
  duration?: number;
  easing?: string;
  fill?: FillMode;
  delay?: number;
}

interface AnimationPresets {
  fast: AnimationOptions;
  normal: AnimationOptions;
  slow: AnimationOptions;
  spring: AnimationOptions;
}

interface AnimationContextType {
  animate: (element: Element, keyframes: Keyframe[], options?: AnimationOptions) => Promise<void>;
  presets: AnimationPresets;
  isReducedMotion: boolean;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

interface AnimationProviderProps {
  children: React.ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  // Check for reduced motion preference
  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Animation presets
  const presets: AnimationPresets = useMemo(() => ({
    fast: {
      duration: 150,
      easing: 'ease-out',
      fill: 'forwards' as FillMode,
    },
    normal: {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards' as FillMode,
    },
    slow: {
      duration: 500,
      easing: 'ease-out',
      fill: 'forwards' as FillMode,
    },
    spring: {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards' as FillMode,
    },
  }), []);

  // Main animate function using Web Animations API
  const animate = useCallback(async (
    element: Element,
    keyframes: Keyframe[],
    options: AnimationOptions = {}
  ): Promise<void> => {
    if (!element || isReducedMotion) {
      return Promise.resolve();
    }

    const animationOptions: KeyframeAnimationOptions = {
      duration: options.duration || presets.normal.duration,
      easing: options.easing || presets.normal.easing,
      fill: options.fill || presets.normal.fill,
      delay: options.delay || 0,
    };

    try {
      const animation = element.animate(keyframes, animationOptions);
      await animation.finished;
    } catch (error) {
      console.warn('Animation failed:', error);
    }
  }, [isReducedMotion, presets]);

  const contextValue = useMemo(() => ({
    animate,
    presets,
    isReducedMotion,
  }), [animate, presets, isReducedMotion]);

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
