/**
 * useReducedMotion Hook
 * Detects user's motion preferences for accessibility compliance
 */

import { useState, useEffect } from 'react';
import { animationConfig } from '../config/animation.config';

export interface ReducedMotionState {
    prefersReducedMotion: boolean;
    shouldAnimate: boolean;
    animationDuration: number;
    animationEasing: string;
}

/**
 * Hook to detect and respect user's reduced motion preferences
 * Automatically adjusts animation settings based on system preferences
 */
export const useReducedMotion = (): ReducedMotionState => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }

        // Create media query for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Set initial state
        setPrefersReducedMotion(mediaQuery.matches);

        // Handle changes to the preference
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Add event listener
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    // Return computed state
    return {
        prefersReducedMotion,
        shouldAnimate: animationConfig.accessibility.respectReducedMotion
            ? !prefersReducedMotion
            : true,
        animationDuration: prefersReducedMotion
            ? animationConfig.reducedMotion.duration
            : animationConfig.duration.normal,
        animationEasing: prefersReducedMotion ? animationConfig.reducedMotion.easing : 'ease-out',
    };
};

/**
 * Hook variant that returns only the boolean preference
 */
export const useReducedMotionPreference = (): boolean => {
    const { prefersReducedMotion } = useReducedMotion();
    return prefersReducedMotion;
};

/**
 * Hook variant that returns animation-ready configuration
 */
export const useAnimationConfig = () => {
    const { shouldAnimate, animationDuration, animationEasing } = useReducedMotion();

    return {
        shouldAnimate,
        duration: animationDuration,
        easing: animationEasing,
        // Framer Motion compatible transition object
        transition: shouldAnimate
            ? { duration: animationDuration, ease: animationEasing }
            : { duration: 0.01 },
        // CSS class suffix for conditional animations
        animationClass: shouldAnimate ? '' : 'no-motion',
    };
};

export default useReducedMotion;
