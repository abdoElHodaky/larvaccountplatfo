/**
 * useAnimationPerformance Hook
 * Performance-aware animation configuration with device capability detection
 */

import { useState, useEffect, useMemo } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { animationConfig } from '../config/animation.config';

export interface DeviceCapabilities {
    isLowEndDevice: boolean;
    isMobile: boolean;
    isTablet: boolean;
    supportsHardwareAcceleration: boolean;
    memoryLevel: 'low' | 'medium' | 'high';
    connectionSpeed: 'slow' | 'medium' | 'fast';
}

export interface AnimationPerformanceConfig {
    shouldAnimate: boolean;
    animationLevel: 'none' | 'minimal' | 'reduced' | 'full';
    duration: number;
    enableComplexAnimations: boolean;
    enableParallaxEffects: boolean;
    enableGestures: boolean;
    maxConcurrentAnimations: number;
    deviceCapabilities: DeviceCapabilities;
}

/**
 * Detects device capabilities for performance-aware animations
 */
const detectDeviceCapabilities = (): DeviceCapabilities => {
    if (typeof window === 'undefined') {
        return {
            isLowEndDevice: false,
            isMobile: false,
            isTablet: false,
            supportsHardwareAcceleration: true,
            memoryLevel: 'high',
            connectionSpeed: 'fast',
        };
    }

    // Detect mobile/tablet
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
    );
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Detect memory level
    const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if not available
    const memoryLevel: 'low' | 'medium' | 'high' =
        memory <= 2 ? 'low' : memory <= 4 ? 'medium' : 'high';

    // Detect connection speed
    const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
    const connectionSpeed: 'slow' | 'medium' | 'fast' = !connection
        ? 'fast'
        : connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
          ? 'slow'
          : connection.effectiveType === '3g'
            ? 'medium'
            : 'fast';

    // Detect hardware acceleration support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const supportsHardwareAcceleration = !!gl;

    // Determine if it's a low-end device
    const isLowEndDevice =
        memoryLevel === 'low' ||
        connectionSpeed === 'slow' ||
        !supportsHardwareAcceleration ||
        (isMobile && memory <= 2);

    return {
        isLowEndDevice,
        isMobile,
        isTablet,
        supportsHardwareAcceleration,
        memoryLevel,
        connectionSpeed,
    };
};

/**
 * Hook for performance-aware animation configuration
 */
export const useAnimationPerformance = (): AnimationPerformanceConfig => {
    const { prefersReducedMotion, shouldAnimate: baseShoudAnimate } = useReducedMotion();
    const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(() =>
        detectDeviceCapabilities()
    );

    // Re-detect capabilities on mount (for SSR compatibility)
    useEffect(() => {
        setDeviceCapabilities(detectDeviceCapabilities());
    }, []);

    // Compute animation configuration based on capabilities and preferences
    const config = useMemo((): AnimationPerformanceConfig => {
        const { isLowEndDevice, isMobile, memoryLevel, connectionSpeed } = deviceCapabilities;

        // Determine animation level
        let animationLevel: 'none' | 'minimal' | 'reduced' | 'full' = 'full';

        if (prefersReducedMotion) {
            animationLevel = 'none';
        } else if (isLowEndDevice || connectionSpeed === 'slow') {
            animationLevel = 'minimal';
        } else if (isMobile || memoryLevel === 'low') {
            animationLevel = 'reduced';
        }

        // Determine if we should animate at all
        const shouldAnimate = baseShoudAnimate && animationLevel !== 'none';

        // Configure duration based on performance level
        const duration =
            animationLevel === 'none'
                ? 0.01
                : animationLevel === 'minimal'
                  ? animationConfig.duration.fast
                  : animationLevel === 'reduced'
                    ? animationConfig.duration.normal
                    : animationConfig.duration.normal;

        // Configure feature availability
        const enableComplexAnimations = animationLevel === 'full' && !isLowEndDevice;
        const enableParallaxEffects = animationLevel === 'full' && !isMobile && !isLowEndDevice;
        const enableGestures = !isLowEndDevice;

        // Configure concurrent animation limits
        const maxConcurrentAnimations =
            animationLevel === 'minimal' ? 2 : animationLevel === 'reduced' ? 4 : 8;

        return {
            shouldAnimate,
            animationLevel,
            duration,
            enableComplexAnimations,
            enableParallaxEffects,
            enableGestures,
            maxConcurrentAnimations,
            deviceCapabilities,
        };
    }, [prefersReducedMotion, baseShoudAnimate, deviceCapabilities]);

    return config;
};

/**
 * Hook for getting performance-optimized Framer Motion props
 */
export const useMotionProps = (baseProps: any = {}) => {
    const { shouldAnimate, duration, animationLevel } = useAnimationPerformance();

    return useMemo(() => {
        if (!shouldAnimate) {
            return {
                initial: false,
                animate: false,
                exit: false,
                transition: { duration: 0.01 },
            };
        }

        const optimizedTransition = {
            duration,
            ease: animationLevel === 'minimal' ? 'linear' : 'easeOut',
            ...baseProps.transition,
        };

        return {
            ...baseProps,
            transition: optimizedTransition,
        };
    }, [shouldAnimate, duration, animationLevel, baseProps]);
};

/**
 * Hook for performance monitoring of animations
 */
export const useAnimationMonitoring = () => {
    const [performanceMetrics, setPerformanceMetrics] = useState({
        averageFPS: 60,
        droppedFrames: 0,
        animationCount: 0,
    });

    const recordAnimationStart = (animationName: string) => {
        if (!animationConfig.performance.enablePerformanceMonitoring) return;

        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            // Record metrics (integrate with existing performance monitoring)
            if (window.gtag) {
                window.gtag('event', 'animation_performance', {
                    event_category: 'Animation',
                    event_label: animationName,
                    value: Math.round(duration),
                });
            }
        };
    };

    const checkFrameRate = () => {
        let frameCount = 0;
        let lastTime = performance.now();

        const countFrames = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                const fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;

                setPerformanceMetrics((prev) => ({
                    ...prev,
                    averageFPS: fps,
                }));

                // Alert if FPS is too low
                if (fps < animationConfig.performance.fpsThreshold) {
                    console.warn(`Animation FPS dropped to ${fps}`);
                }
            }

            requestAnimationFrame(countFrames);
        };

        requestAnimationFrame(countFrames);
    };

    useEffect(() => {
        if (animationConfig.performance.enablePerformanceMonitoring) {
            checkFrameRate();
        }
    }, []);

    return {
        performanceMetrics,
        recordAnimationStart,
    };
};

export default useAnimationPerformance;
