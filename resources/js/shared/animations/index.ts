/**
 * Unified Animation System - Phase 4
 * Simplified, consistent animation utilities and presets
 */

// Core animation configuration
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Unified animation presets
export const animations = {
  // Speed presets
  fast: { duration: 150, easing: 'ease-out' },
  normal: { duration: 300, easing: 'ease-out' },
  slow: { duration: 500, easing: 'ease-out' },
  
  // Style presets
  smooth: { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  spring: { duration: 400, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  bounce: { duration: 600, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
} as const;

// Unified keyframes for all components (mutable for Web Animations API)
export const keyframes = {
  // Card animations
  cardHover: [
    { transform: 'translateY(0) scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
    { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }
  ] as Keyframe[],
  cardLoad: [
    { opacity: 0.6, transform: 'scale(0.98)' },
    { opacity: 1, transform: 'scale(1)' }
  ] as Keyframe[],
  
  // Widget animations
  widgetResize: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.02)', opacity: 0.9 },
    { transform: 'scale(1)', opacity: 1 }
  ] as Keyframe[],
  widgetEnter: [
    { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ] as Keyframe[],
  
  // List animations
  listEnter: [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ] as Keyframe[],
  listExit: [
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: 'translateX(-100%)' }
  ] as Keyframe[],
  
  // Loader animations
  loaderSkeleton: [
    { opacity: 0.4 },
    { opacity: 0.8 },
    { opacity: 0.4 }
  ] as Keyframe[],
  loaderSpin: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ] as Keyframe[],
  loaderPulse: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.05)', opacity: 0.7 },
    { transform: 'scale(1)', opacity: 1 }
  ] as Keyframe[]
};

// Unified animation utilities
export const animate = {
  // Basic animation
  run: (element: Element, keyframe: Keyframe[], config: AnimationConfig = animations.normal) => {
    return element.animate(keyframe, { ...config, fill: 'forwards' });
  },
  
  // Stagger animation
  stagger: async (elements: Element[], keyframe: Keyframe[], config: AnimationConfig = animations.normal, staggerDelay = 100) => {
    const promises = elements.map((el, i) => 
      animate.run(el, keyframe, { ...config, delay: i * staggerDelay }).finished
    );
    return Promise.all(promises);
  },
  
  // Intersection observer animation
  onVisible: (element: Element, keyframe: Keyframe[], config: AnimationConfig = animations.normal, threshold = 0.1) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate.run(entry.target as Element, keyframe, config);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });
    
    observer.observe(element);
    return observer;
  },
  
  // Reduced motion check
  shouldReduce: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

// Unified component base interface
export interface AnimatedComponentProps {
  className?: string;
  animationType?: keyof typeof animations;
  disabled?: boolean;
  children?: React.ReactNode;
}
