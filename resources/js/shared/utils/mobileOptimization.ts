/**
 * Mobile Optimization Utilities
 * Provides mobile-specific optimizations, responsive design helpers,
 * and touch interaction improvements
 */

// Device detection and capabilities
export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    orientation: 'portrait' | 'landscape';
    pixelRatio: number;
    connectionType: string;
    isLowEndDevice: boolean;
}

// Viewport breakpoints
const BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
} as const;

// Performance thresholds for mobile devices
const MOBILE_PERFORMANCE_THRESHOLDS = {
    lowEndDevice: {
        memory: 2, // GB
        cores: 2,
        connectionSpeed: 1, // Mbps
    },
    imageQuality: {
        lowEnd: 0.7,
        midRange: 0.8,
        highEnd: 0.9,
    },
};

/**
 * Device Detection and Information
 */
export class DeviceDetector {
    private static instance: DeviceDetector;
    private deviceInfo: DeviceInfo | null = null;

    static getInstance(): DeviceDetector {
        if (!DeviceDetector.instance) {
            DeviceDetector.instance = new DeviceDetector();
        }
        return DeviceDetector.instance;
    }

    getDeviceInfo(): DeviceInfo {
        if (!this.deviceInfo) {
            this.deviceInfo = this.detectDevice();
        }
        return this.deviceInfo;
    }

    private detectDevice(): DeviceInfo {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
        );
        const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(userAgent);
        const isAndroid = /android/i.test(userAgent);

        return {
            isMobile: isMobile && !isTablet,
            isTablet,
            isDesktop: !isMobile && !isTablet,
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            isIOS,
            isAndroid,
            screenSize: this.getScreenSize(),
            orientation: this.getOrientation(),
            pixelRatio: window.devicePixelRatio || 1,
            connectionType: this.getConnectionType(),
            isLowEndDevice: this.isLowEndDevice(),
        };
    }

    private getScreenSize(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
        const width = window.innerWidth;
        if (width < BREAKPOINTS.sm) return 'xs';
        if (width < BREAKPOINTS.md) return 'sm';
        if (width < BREAKPOINTS.lg) return 'md';
        if (width < BREAKPOINTS.xl) return 'lg';
        return 'xl';
    }

    private getOrientation(): 'portrait' | 'landscape' {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    private getConnectionType(): string {
        const connection =
            (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;
        return connection?.effectiveType || 'unknown';
    }

    private isLowEndDevice(): boolean {
        const memory = (navigator as any).deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const connection = this.getConnectionType();

        return (
            memory <= MOBILE_PERFORMANCE_THRESHOLDS.lowEndDevice.memory ||
            cores <= MOBILE_PERFORMANCE_THRESHOLDS.lowEndDevice.cores ||
            ['slow-2g', '2g'].includes(connection)
        );
    }
}

/**
 * Touch Interaction Optimizations
 */
export class TouchOptimizer {
    private static touchStartTime = 0;
    private static touchMoved = false;

    /**
     * Optimize touch events for better responsiveness
     */
    static optimizeTouchEvents(element: HTMLElement): () => void {
        const handleTouchStart = (_e: TouchEvent) => {
            TouchOptimizer.touchStartTime = Date.now();
            TouchOptimizer.touchMoved = false;

            // Add visual feedback
            element.style.transform = 'scale(0.98)';
            element.style.transition = 'transform 0.1s ease';
        };

        const handleTouchMove = () => {
            TouchOptimizer.touchMoved = true;

            // Remove visual feedback on move
            element.style.transform = '';
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchDuration = Date.now() - TouchOptimizer.touchStartTime;

            // Remove visual feedback
            element.style.transform = '';

            // Prevent ghost clicks on fast taps
            if (!TouchOptimizer.touchMoved && touchDuration < 150) {
                e.preventDefault();

                // Trigger click event manually for better control
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                });
                element.dispatchEvent(clickEvent);
            }
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Return cleanup function
        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }

    /**
     * Add haptic feedback for supported devices
     */
    static addHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
            };
            navigator.vibrate(patterns[type]);
        }
    }

    /**
     * Optimize scroll performance for mobile
     */
    static optimizeScrolling(container: HTMLElement): () => void {
        let isScrolling = false;
        let scrollTimeout: NodeJS.Timeout;

        const handleScrollStart = () => {
            if (!isScrolling) {
                isScrolling = true;
                container.style.pointerEvents = 'none';
                container.style.willChange = 'transform';
            }
        };

        const handleScrollEnd = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                container.style.pointerEvents = '';
                container.style.willChange = '';
            }, 150);
        };

        container.addEventListener('scroll', handleScrollStart, { passive: true });
        container.addEventListener('scroll', handleScrollEnd, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScrollStart);
            container.removeEventListener('scroll', handleScrollEnd);
            clearTimeout(scrollTimeout);
        };
    }
}

/**
 * Responsive Image Optimization
 */
export class ResponsiveImageOptimizer {
    /**
     * Generate responsive image sources based on device capabilities
     */
    static generateResponsiveSources(
        baseUrl: string,
        alt: string,
        sizes: { width: number; height: number }[]
    ): string {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();
        const pixelRatio = deviceInfo.pixelRatio;
        const isLowEnd = deviceInfo.isLowEndDevice;

        // Adjust quality based on device capabilities
        const quality = isLowEnd
            ? MOBILE_PERFORMANCE_THRESHOLDS.imageQuality.lowEnd
            : deviceInfo.isMobile
              ? MOBILE_PERFORMANCE_THRESHOLDS.imageQuality.midRange
              : MOBILE_PERFORMANCE_THRESHOLDS.imageQuality.highEnd;

        const srcSet = sizes
            .map((size) => {
                const width = Math.round(size.width * pixelRatio);
                const height = Math.round(size.height * pixelRatio);
                return `${baseUrl}?w=${width}&h=${height}&q=${Math.round(quality * 100)} ${size.width}w`;
            })
            .join(', ');

        return `
      <img 
        src="${baseUrl}?w=${sizes[0].width}&h=${sizes[0].height}&q=${Math.round(quality * 100)}"
        srcset="${srcSet}"
        sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
        alt="${alt}"
        loading="lazy"
        decoding="async"
      />
    `;
    }

    /**
     * Lazy load images with intersection observer
     */
    static lazyLoadImages(selector: string = 'img[data-src]'): void {
        const images = document.querySelectorAll(selector);

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const img = entry.target as HTMLImageElement;
                            const src = img.dataset.src;

                            if (src) {
                                img.src = src;
                                img.classList.remove('lazy');
                                img.classList.add('loaded');
                                observer.unobserve(img);
                            }
                        }
                    });
                },
                {
                    rootMargin: '50px 0px',
                    threshold: 0.01,
                }
            );

            images.forEach((img) => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach((img) => {
                const imgElement = img as HTMLImageElement;
                const src = imgElement.dataset.src;
                if (src) {
                    imgElement.src = src;
                }
            });
        }
    }
}

/**
 * Mobile Performance Optimizer
 */
export class MobilePerformanceOptimizer {
    /**
     * Optimize for low-end devices
     */
    static optimizeForLowEndDevices(): void {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();

        if (deviceInfo.isLowEndDevice) {
            // Reduce animation complexity
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
            document.documentElement.style.setProperty('--transition-duration', '0.1s');

            // Disable non-essential animations
            const style = document.createElement('style');
            style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
            document.head.appendChild(style);

            // Reduce image quality
            const images = document.querySelectorAll('img');
            images.forEach((img) => {
                if (img.src && !img.dataset.optimized) {
                    const url = new URL(img.src);
                    url.searchParams.set('q', '70');
                    img.src = url.toString();
                    img.dataset.optimized = 'true';
                }
            });
        }
    }

    /**
     * Optimize network requests for mobile
     */
    static optimizeNetworkRequests(): void {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();

        // Implement request prioritization for slow connections
        if (['slow-2g', '2g', '3g'].includes(deviceInfo.connectionType)) {
            // Reduce concurrent requests
            const originalFetch = window.fetch;
            let activeRequests = 0;
            const maxConcurrentRequests = 3;
            const requestQueue: Array<() => void> = [];

            window.fetch = function (...args) {
                return new Promise((resolve, reject) => {
                    const executeRequest = () => {
                        activeRequests++;
                        originalFetch
                            .apply(this, args)
                            .then(resolve)
                            .catch(reject)
                            .finally(() => {
                                activeRequests--;
                                if (requestQueue.length > 0) {
                                    const nextRequest = requestQueue.shift();
                                    nextRequest?.();
                                }
                            });
                    };

                    if (activeRequests < maxConcurrentRequests) {
                        executeRequest();
                    } else {
                        requestQueue.push(executeRequest);
                    }
                });
            };
        }
    }

    /**
     * Implement adaptive loading based on connection
     */
    static implementAdaptiveLoading(): void {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();

        // Set data-saver attribute for CSS optimizations
        document.documentElement.setAttribute('data-connection', deviceInfo.connectionType);
        document.documentElement.setAttribute(
            'data-save-data',
            (navigator as any).connection?.saveData ? 'true' : 'false'
        );

        // Adaptive resource loading
        if (['slow-2g', '2g'].includes(deviceInfo.connectionType)) {
            // Disable non-critical resources
            const nonCriticalResources = document.querySelectorAll('[data-priority="low"]');
            nonCriticalResources.forEach((resource) => {
                if (resource instanceof HTMLElement) {
                    resource.style.display = 'none';
                }
            });
        }
    }
}

/**
 * Mobile UI Enhancements
 */
export class MobileUIEnhancer {
    /**
     * Add mobile-specific CSS classes
     */
    static addMobileClasses(): void {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();
        const classes = [];

        if (deviceInfo.isMobile) classes.push('is-mobile');
        if (deviceInfo.isTablet) classes.push('is-tablet');
        if (deviceInfo.isDesktop) classes.push('is-desktop');
        if (deviceInfo.isTouchDevice) classes.push('is-touch');
        if (deviceInfo.isIOS) classes.push('is-ios');
        if (deviceInfo.isAndroid) classes.push('is-android');
        if (deviceInfo.isLowEndDevice) classes.push('is-low-end');

        classes.push(`screen-${deviceInfo.screenSize}`);
        classes.push(`orientation-${deviceInfo.orientation}`);
        classes.push(`connection-${deviceInfo.connectionType}`);

        document.documentElement.classList.add(...classes);
    }

    /**
     * Optimize viewport for mobile
     */
    static optimizeViewport(): void {
        const deviceInfo = DeviceDetector.getInstance().getDeviceInfo();

        // Update viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        let content = 'width=device-width, initial-scale=1.0';

        // iOS specific optimizations
        if (deviceInfo.isIOS) {
            content += ', viewport-fit=cover';
        }

        // Prevent zoom on form inputs for mobile
        if (deviceInfo.isMobile) {
            content += ', maximum-scale=1.0, user-scalable=no';
        }

        viewport.content = content;
    }

    /**
     * Add safe area support for notched devices
     */
    static addSafeAreaSupport(): void {
        const style = document.createElement('style');
        style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .safe-area-top {
        padding-top: var(--safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: var(--safe-area-inset-bottom);
      }
      
      .safe-area-left {
        padding-left: var(--safe-area-inset-left);
      }
      
      .safe-area-right {
        padding-right: var(--safe-area-inset-right);
      }
    `;
        document.head.appendChild(style);
    }
}

/**
 * Main Mobile Optimization Manager
 */
export class MobileOptimizationManager {
    private static initialized = false;

    /**
     * Initialize all mobile optimizations
     */
    static initialize(): void {
        if (this.initialized) return;

        // Add device classes and viewport optimization
        MobileUIEnhancer.addMobileClasses();
        MobileUIEnhancer.optimizeViewport();
        MobileUIEnhancer.addSafeAreaSupport();

        // Performance optimizations
        MobilePerformanceOptimizer.optimizeForLowEndDevices();
        MobilePerformanceOptimizer.optimizeNetworkRequests();
        MobilePerformanceOptimizer.implementAdaptiveLoading();

        // Image optimizations
        ResponsiveImageOptimizer.lazyLoadImages();

        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                MobileUIEnhancer.addMobileClasses();
            }, 100);
        });

        this.initialized = true;
    }

    /**
     * Get current device information
     */
    static getDeviceInfo(): DeviceInfo {
        return DeviceDetector.getInstance().getDeviceInfo();
    }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileOptimizationManager.initialize();
        });
    } else {
        MobileOptimizationManager.initialize();
    }
}

// Classes are already exported individually above
