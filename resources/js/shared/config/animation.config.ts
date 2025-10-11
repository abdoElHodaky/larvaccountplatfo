/**
 * Animation Configuration
 * Centralized configuration for all animations in the application
 */

export interface AnimationConfig {
  // Duration settings (in seconds)
  durations: {
    fast: number;
    normal: number;
    slow: number;
    pageTransition: number;
    modalTransition: number;
    tooltipTransition: number;
  };
  
  // Easing functions
  easings: {
    default: string;
    smooth: string;
    bounce: string;
    elastic: string;
    sharp: string;
  };
  
  // Performance settings
  performance: {
    enableAnimations: boolean;
    enableComplexAnimations: boolean;
    enableParallax: boolean;
    maxConcurrentAnimations: number;
    frameRateThreshold: number;
  };
  
  // Responsive breakpoints for animation adjustments
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  
  // Animation variants
  variants: {
    fadeIn: object;
    slideIn: object;
    scaleIn: object;
    stagger: object;
  };
}

// Default animation configuration
export const animationConfig: AnimationConfig = {
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    pageTransition: 0.4,
    modalTransition: 0.25,
    tooltipTransition: 0.15
  },
  
  easings: {
    default: 'ease-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },
  
  performance: {
    enableAnimations: true,
    enableComplexAnimations: true,
    enableParallax: true,
    maxConcurrentAnimations: 10,
    frameRateThreshold: 30
  },
  
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },
  
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    },
    
    slideIn: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    },
    
    stagger: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      },
      exit: {
        opacity: 0,
        transition: {
          staggerChildren: 0.05,
          staggerDirection: -1
        }
      }
    }
  }
};

// Animation presets for common use cases
export const animationPresets = {
  // Page transitions
  pageTransition: {
    duration: animationConfig.durations.pageTransition,
    ease: animationConfig.easings.smooth
  },
  
  // Modal animations
  modalTransition: {
    duration: animationConfig.durations.modalTransition,
    ease: animationConfig.easings.smooth
  },
  
  // Card hover effects
  cardHover: {
    duration: animationConfig.durations.fast,
    ease: animationConfig.easings.smooth,
    scale: 1.02,
    y: -2
  },
  
  // Button interactions
  buttonPress: {
    duration: animationConfig.durations.fast,
    ease: animationConfig.easings.sharp,
    scale: 0.98
  },
  
  // Loading animations
  loading: {
    duration: animationConfig.durations.normal,
    ease: animationConfig.easings.default,
    repeat: Infinity,
    repeatType: 'reverse' as const
  },
  
  // Notification animations
  notification: {
    duration: animationConfig.durations.normal,
    ease: animationConfig.easings.bounce
  }
};

// Utility functions for animation configuration
export const getAnimationDuration = (type: keyof AnimationConfig['durations']) => {
  return animationConfig.durations[type];
};

export const getAnimationEasing = (type: keyof AnimationConfig['easings']) => {
  return animationConfig.easings[type];
};

export const getAnimationVariant = (type: keyof AnimationConfig['variants']) => {
  return animationConfig.variants[type];
};

// Check if animations should be enabled based on user preferences and device capabilities
export const shouldEnableAnimations = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;
  
  // Check device capabilities (basic heuristic)
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  
  if (isLowEndDevice || hasLimitedMemory) {
    return false;
  }
  
  return animationConfig.performance.enableAnimations;
};

// Get responsive animation settings based on screen size
export const getResponsiveAnimationSettings = () => {
  if (typeof window === 'undefined') {
    return { enableAnimations: true, enableComplexAnimations: true };
  }
  
  const width = window.innerWidth;
  const { mobile, tablet } = animationConfig.breakpoints;
  
  if (width < mobile) {
    return {
      enableAnimations: shouldEnableAnimations(),
      enableComplexAnimations: false,
      duration: animationConfig.durations.fast
    };
  } else if (width < tablet) {
    return {
      enableAnimations: shouldEnableAnimations(),
      enableComplexAnimations: animationConfig.performance.enableComplexAnimations,
      duration: animationConfig.durations.normal
    };
  } else {
    return {
      enableAnimations: shouldEnableAnimations(),
      enableComplexAnimations: animationConfig.performance.enableComplexAnimations,
      duration: animationConfig.durations.normal
    };
  }
};

export default animationConfig;
