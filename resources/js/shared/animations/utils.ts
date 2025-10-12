/**
 * Animation Utilities for Phase 4 Components
 * Helper functions for complex animations and performance optimization
 */

import { STAGGER_CONFIGS, type StaggerConfig } from './presets';

export interface IntersectionAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  onIntersect?: (entry: IntersectionObserverEntry) => void;
}

export interface StaggerAnimationOptions {
  staggerConfig?: keyof typeof STAGGER_CONFIGS | StaggerConfig;
  reverse?: boolean;
  onComplete?: () => void;
}

/**
 * Creates an intersection observer for scroll-triggered animations
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionAnimationOptions = {}
): IntersectionObserver {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true
  } = options;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback([entry]);
        if (triggerOnce) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold,
    rootMargin
  });

  return observer;
}

/**
 * Animates elements with stagger effect
 */
export async function animateStagger(
  elements: Element[],
  keyframes: Keyframe[],
  options: StaggerAnimationOptions = {}
): Promise<void> {
  const {
    staggerConfig = 'normal',
    reverse = false,
    onComplete
  } = options;

  const config = typeof staggerConfig === 'string' 
    ? STAGGER_CONFIGS[staggerConfig] 
    : staggerConfig;

  const elementsToAnimate = reverse ? [...elements].reverse() : elements;
  
  const animations = elementsToAnimate.map((element, index) => {
    const delay = index * config.delay;
    
    return element.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay,
      fill: 'forwards'
    });
  });

  // Wait for all animations to complete
  await Promise.all(animations.map(animation => animation.finished));
  
  if (onComplete) {
    onComplete();
  }
}

/**
 * Creates a performance-optimized animation function
 */
export function createOptimizedAnimation(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {}
): Animation {
  // Use Web Animations API for better performance
  const animation = element.animate(keyframes, {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
    ...options
  });

  // Add performance optimizations
  animation.addEventListener('finish', () => {
    // Clean up animation to free memory
    animation.cancel();
  });

  return animation;
}

/**
 * Debounced animation trigger for performance
 */
export function createDebouncedAnimationTrigger(
  callback: () => void,
  delay: number = 100
): () => void {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
}

/**
 * Checks if animations should be reduced based on user preferences
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Creates a safe animation that respects reduced motion preferences
 */
export function createAccessibleAnimation(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {}
): Animation | null {
  if (shouldReduceMotion()) {
    // Apply final state immediately for reduced motion
    const finalFrame = keyframes[keyframes.length - 1];
    Object.assign((element as HTMLElement).style, finalFrame);
    return null;
  }

  return createOptimizedAnimation(element, keyframes, options);
}

/**
 * Measures animation performance
 */
export async function measureAnimationPerformance(
  animationName: string,
  animationFn: () => Promise<void>
): Promise<number> {
  const startTime = performance.now();
  
  await animationFn();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log performance in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Animation "${animationName}" took ${duration.toFixed(2)}ms`);
  }
  
  return duration;
}

/**
 * Creates a spring animation using CSS custom properties
 */
export function createSpringAnimation(
  element: Element,
  property: string,
  from: number,
  to: number,
  config: { tension?: number; friction?: number; mass?: number } = {}
): Animation {
  const { tension = 170, friction = 26, mass = 1 } = config;
  
  // Calculate spring parameters
  const omega = Math.sqrt(tension / mass);
  const zeta = friction / (2 * Math.sqrt(tension * mass));
  
  const keyframes: Keyframe[] = [];
  const steps = 60; // 60fps
  const duration = 1000; // 1 second max
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (duration / 1000);
    let value: number;
    
    if (zeta < 1) {
      // Underdamped
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      value = to - (to - from) * Math.exp(-zeta * omega * t) * 
              Math.cos(omegaD * t + Math.atan2(zeta * omega, omegaD));
    } else {
      // Overdamped or critically damped
      value = to - (to - from) * Math.exp(-omega * t) * (1 + omega * t);
    }
    
    keyframes.push({ [property]: `${value}px` });
  }
  
  return element.animate(keyframes, {
    duration,
    easing: 'linear',
    fill: 'forwards'
  });
}

/**
 * Batch DOM reads and writes for better performance
 */
export class AnimationBatcher {
  private readCallbacks: (() => void)[] = [];
  private writeCallbacks: (() => void)[] = [];
  private scheduled = false;

  read(callback: () => void): void {
    this.readCallbacks.push(callback);
    this.schedule();
  }

  write(callback: () => void): void {
    this.writeCallbacks.push(callback);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => {
      // Execute all reads first
      this.readCallbacks.forEach(callback => callback());
      this.readCallbacks.length = 0;
      
      // Then execute all writes
      this.writeCallbacks.forEach(callback => callback());
      this.writeCallbacks.length = 0;
      
      this.scheduled = false;
    });
  }
}

// Global animation batcher instance
export const animationBatcher = new AnimationBatcher();
