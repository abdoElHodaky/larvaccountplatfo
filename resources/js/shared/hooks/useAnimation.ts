/**
 * Phase 10A/10B: Unified Animation Hook
 * Fragment-compatible animation system with design token integration
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAnimation as useFramerAnimation, AnimationControls } from 'framer-motion';
import { animations } from '../components/design-system/tokens';

export interface AnimationConfig {
  type?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'slideUp' | 'slideDown' | 'custom';
  duration?: keyof typeof animations.duration | number;
  easing?: keyof typeof animations.easing | string;
  delay?: number;
  custom?: {
    initial?: Record<string, any>;
    animate?: Record<string, any>;
    exit?: Record<string, any>;
  };
  trigger?: 'mount' | 'hover' | 'focus' | 'manual';
  stagger?: number; // For list animations
}

export interface UseAnimationReturn {
  controls: AnimationControls;
  animate: (config?: Partial<AnimationConfig>) => Promise<void>;
  isAnimating: boolean;
  variants: {
    initial: Record<string, any>;
    animate: Record<string, any>;
    exit: Record<string, any>;
  };
}

// Animation presets that work with React.Fragment
const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideIn: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
};

export const useAnimation = (config: AnimationConfig = {}): UseAnimationReturn => {
  const {
    type = 'fadeIn',
    duration = 'normal',
    easing = 'easeOut',
    delay = 0,
    custom,
    trigger = 'mount'
  } = config;

  const controls = useFramerAnimation();
  const isAnimatingRef = useRef(false);

  // Get duration value from design tokens or use custom value
  const getDuration = useCallback(() => {
    if (typeof duration === 'number') return duration / 1000; // Convert ms to seconds
    return parseInt(animations.duration[duration]) / 1000;
  }, [duration]);

  // Get easing value from design tokens or use custom value
  const getEasing = useCallback(() => {
    if (typeof easing === 'string' && easing in animations.easing) {
      return animations.easing[easing as keyof typeof animations.easing];
    }
    return easing;
  }, [easing]);

  // Create animation variants
  const variants = {
    initial: custom?.initial || animationPresets[type]?.initial || animationPresets.fadeIn.initial,
    animate: custom?.animate || animationPresets[type]?.animate || animationPresets.fadeIn.animate,
    exit: custom?.exit || animationPresets[type]?.exit || animationPresets.fadeIn.exit
  };

  // Animation function
  const animate = useCallback(async (overrideConfig?: Partial<AnimationConfig>) => {
    const finalConfig = { ...config, ...overrideConfig };
    const finalDuration = finalConfig.duration ? 
      (typeof finalConfig.duration === 'number' ? finalConfig.duration / 1000 : parseInt(animations.duration[finalConfig.duration]) / 1000) :
      getDuration();
    const finalEasing = finalConfig.easing ? 
      (typeof finalConfig.easing === 'string' && finalConfig.easing in animations.easing ? 
        animations.easing[finalConfig.easing as keyof typeof animations.easing] : finalConfig.easing) :
      getEasing();

    isAnimatingRef.current = true;

    try {
      await controls.start({
        ...variants.animate,
        transition: {
          duration: finalDuration,
          ease: finalEasing,
          delay: finalConfig.delay || delay
        }
      });
    } finally {
      isAnimatingRef.current = false;
    }
  }, [config, controls, variants, getDuration, getEasing, delay]);

  // Auto-trigger animation on mount if specified
  useEffect(() => {
    if (trigger === 'mount') {
      animate();
    }
  }, [animate, trigger]);

  return {
    controls,
    animate,
    isAnimating: isAnimatingRef.current,
    variants
  };
};

// Specialized hooks for common use cases

export const useFormAnimation = () => {
  return useAnimation({
    type: 'slideUp',
    duration: 'fast',
    easing: 'easeOut'
  });
};

export const useListAnimation = (stagger: number = 0.1) => {
  return useAnimation({
    type: 'fadeIn',
    duration: 'normal',
    easing: 'easeOut',
    stagger
  });
};

export const usePageTransition = () => {
  return useAnimation({
    type: 'slideIn',
    duration: 'normal',
    easing: 'easeInOut'
  });
};

export const useHoverAnimation = () => {
  return useAnimation({
    type: 'scaleIn',
    duration: 'fast',
    easing: 'easeOut',
    trigger: 'manual'
  });
};
