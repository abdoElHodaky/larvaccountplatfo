/**
 * Animation Presets for Phase 4 Components
 * Standardized animation configurations for consistent behavior
 */

export interface AnimationPreset {
  duration: number;
  easing: string;
  fill?: FillMode;
  delay?: number;
}

export interface StaggerConfig {
  delay: number;
  duration: number;
  easing: string;
}

// Core animation presets
export const ANIMATION_PRESETS = {
  // Basic presets
  fast: { duration: 150, easing: 'ease-out', fill: 'forwards' as FillMode },
  normal: { duration: 300, easing: 'ease-out', fill: 'forwards' as FillMode },
  slow: { duration: 500, easing: 'ease-out', fill: 'forwards' as FillMode },
  
  // Spring animations
  spring: { duration: 400, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', fill: 'forwards' as FillMode },
  bounce: { duration: 600, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', fill: 'forwards' as FillMode },
  
  // Smooth animations
  smooth: { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' as FillMode },
  gentle: { duration: 350, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' as FillMode },
} as const;

// Card-specific animations
export const CARD_ANIMATIONS = {
  hover: {
    lift: [
      { transform: 'translateY(0px) scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
      { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }
    ],
    glow: [
      { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
      { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }
    ],
    scale: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' }
    ]
  },
  loading: [
    { opacity: 0.6, transform: 'scale(0.98)' },
    { opacity: 1, transform: 'scale(1)' }
  ],
  flip: [
    { transform: 'rotateY(0deg)' },
    { transform: 'rotateY(180deg)' }
  ]
} as const;

// Widget-specific animations
export const WIDGET_ANIMATIONS = {
  resize: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.02)', opacity: 0.9 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  dataUpdate: [
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0.7, transform: 'translateY(-5px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ],
  entrance: [
    { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ]
} as const;

// List-specific animations
export const LIST_ANIMATIONS = {
  staggerIn: [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ],
  slideOut: [
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: 'translateX(-100%)' }
  ],
  slideIn: [
    { opacity: 0, transform: 'translateX(100%)' },
    { opacity: 1, transform: 'translateX(0)' }
  ],
  reorder: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-50px)' },
    { transform: 'translateY(0)' }
  ]
} as const;

// Loader-specific animations
export const LOADER_ANIMATIONS = {
  skeleton: [
    { opacity: 0.4 },
    { opacity: 0.8 },
    { opacity: 0.4 }
  ],
  progress: [
    { transform: 'translateX(-100%)' },
    { transform: 'translateX(100%)' }
  ],
  spinner: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ],
  pulse: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.05)', opacity: 0.7 },
    { transform: 'scale(1)', opacity: 1 }
  ]
} as const;

// Stagger configurations
export const STAGGER_CONFIGS: Record<string, StaggerConfig> = {
  fast: { delay: 50, duration: 200, easing: 'ease-out' },
  normal: { delay: 100, duration: 300, easing: 'ease-out' },
  slow: { delay: 150, duration: 400, easing: 'ease-out' },
  gentle: { delay: 80, duration: 350, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
} as const;

// Intersection observer thresholds
export const INTERSECTION_THRESHOLDS = {
  immediate: 0,
  partial: 0.1,
  half: 0.5,
  full: 1.0
} as const;

