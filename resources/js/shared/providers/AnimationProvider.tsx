/**
 * Animation Provider - Web Animations API Integration
 * Provides animation utilities and presets for consistent animations across the app
 */

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';

interface AnimationPresets {
  fast: KeyframeAnimationOptions;
  normal: KeyframeAnimationOptions;
  slow: KeyframeAnimationOptions;
  spring: KeyframeAnimationOptions;
}

interface AnimationContextType {
  animate: (element: Element, keyframes: Keyframe[], options?: KeyframeAnimationOptions) => Promise<Animation>;
  presets: AnimationPresets;
  isReducedMotion: boolean;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
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
      fill: 'both'
    },
    normal: {
      duration: 300,
      easing: 'ease-out',
      fill: 'both'
    },
    slow: {
      duration: 500,
      easing: 'ease-out',
      fill: 'both'
    },
    spring: {
      duration: 400,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      fill: 'both'
    }
  }), []);

  // Main animate function using Web Animations API
  const animate = useCallback(async (
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ): Promise<Animation> => {
    // Return a resolved promise if animations are disabled or reduced motion is preferred
    if (isReducedMotion) {
      return Promise.resolve({} as Animation);
    }

    // Check if Web Animations API is supported
    if (!element.animate) {
      console.warn('Web Animations API not supported');
      return Promise.resolve({} as Animation);
    }

    try {
      const animation = element.animate(keyframes, {
        ...presets.normal,
        ...options
      });

      // Return a promise that resolves when animation completes
      return new Promise((resolve, reject) => {
        animation.addEventListener('finish', () => resolve(animation));
        animation.addEventListener('cancel', () => reject(new Error('Animation cancelled')));
      });
    } catch (error) {
      console.warn('Animation failed:', error);
      return Promise.resolve({} as Animation);
    }
  }, [isReducedMotion, presets]);

  const contextValue = useMemo(() => ({
    animate,
    presets,
    isReducedMotion
  }), [animate, presets, isReducedMotion]);

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook to use animation context
export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

export default AnimationProvider;
