/**
 * Optimization Utilities
 * Bundle splitting, preloading strategies, and performance optimization tools
 */

import React from 'react';
import { performanceMonitor } from './performanceMonitor';

// Bundle splitting utilities
export class BundleSplitter {
    private static loadedChunks = new Set<string>();
    private static loadingChunks = new Map<string, Promise<any>>();
    private static chunkRegistry = new Map<string, () => Promise<any>>();

    // Register a chunk for lazy loading
    static registerChunk(name: string, importFn: () => Promise<any>) {
        this.chunkRegistry.set(name, importFn);
    }

    // Load a chunk with caching
    static async loadChunk(name: string): Promise<any> {
        // Return if already loaded
        if (this.loadedChunks.has(name)) {
            return Promise.resolve();
        }

        // Return existing promise if currently loading
        if (this.loadingChunks.has(name)) {
            return this.loadingChunks.get(name);
        }

        // Get the import function
        const importFn = this.chunkRegistry.get(name);
        if (!importFn) {
            throw new Error(`Chunk "${name}" not registered`);
        }

        // Start loading with performance tracking
        const tracker = performanceMonitor.trackLazyLoad(name);
        tracker.start();

        const loadPromise = importFn()
            .then((module) => {
                this.loadedChunks.add(name);
                this.loadingChunks.delete(name);
                tracker.end({ cacheHit: false });
                return module;
            })
            .catch((error) => {
                this.loadingChunks.delete(name);
                tracker.end({ cacheHit: false, retryCount: 1 });
                throw error;
            });

        this.loadingChunks.set(name, loadPromise);
        return loadPromise;
    }

    // Preload chunks
    static async preloadChunks(names: string[]): Promise<void> {
        const loadPromises = names.map((name) => this.loadChunk(name).catch(() => null));
        await Promise.all(loadPromises);
    }

    // Get loading status
    static getLoadingStatus() {
        return {
            loaded: Array.from(this.loadedChunks),
            loading: Array.from(this.loadingChunks.keys()),
            registered: Array.from(this.chunkRegistry.keys()),
        };
    }

    // Clear cache (for development)
    static clearCache() {
        this.loadedChunks.clear();
        this.loadingChunks.clear();
    }
}

// Preloading strategies
export class PreloadingStrategy {
    private static preloadQueue: Array<{ name: string; priority: number }> = [];
    private static isProcessing = false;

    // Add to preload queue with priority
    static addToQueue(name: string, priority: number = 0) {
        this.preloadQueue.push({ name, priority });
        this.preloadQueue.sort((a, b) => b.priority - a.priority);
        this.processQueue();
    }

    // Process preload queue
    private static async processQueue() {
        if (this.isProcessing || this.preloadQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.preloadQueue.length > 0) {
            const { name } = this.preloadQueue.shift()!;

            try {
                await BundleSplitter.loadChunk(name);
            } catch (error) {
                console.warn(`Failed to preload chunk: ${name}`, error);
            }

            // Small delay to prevent blocking
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        this.isProcessing = false;
    }

    // Preload on hover
    static preloadOnHover(element: HTMLElement, chunkName: string) {
        let timeoutId: number;

        const handleMouseEnter = () => {
            timeoutId = window.setTimeout(() => {
                this.addToQueue(chunkName, 1);
            }, 100); // Small delay to avoid unnecessary preloads
        };

        const handleMouseLeave = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        // Return cleanup function
        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }

    // Preload on intersection (viewport)
    static preloadOnIntersection(element: HTMLElement, chunkName: string, threshold = 0.1) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.addToQueue(chunkName, 2);
                        observer.unobserve(element);
                    }
                });
            },
            { threshold }
        );

        observer.observe(element);

        // Return cleanup function
        return () => observer.disconnect();
    }

    // Preload based on user behavior
    static preloadOnUserIntent(patterns: Array<{ trigger: string; chunks: string[] }>) {
        patterns.forEach(({ trigger, chunks }) => {
            document.addEventListener(trigger, () => {
                chunks.forEach((chunk) => this.addToQueue(chunk, 3));
            });
        });
    }
}

// Resource optimization
export class ResourceOptimizer {
    private static imageCache = new Map<string, HTMLImageElement>();
    private static fontCache = new Set<string>();

    // Preload images
    static preloadImages(urls: string[]): Promise<void[]> {
        const loadPromises = urls.map((url) => {
            if (this.imageCache.has(url)) {
                return Promise.resolve();
            }

            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.imageCache.set(url, img);
                    resolve();
                };
                img.onerror = reject;
                img.src = url;
            });
        });

        return Promise.all(loadPromises);
    }

    // Preload fonts
    static preloadFonts(fontFaces: Array<{ family: string; url: string; weight?: string }>) {
        fontFaces.forEach(({ family, url, weight = 'normal' }) => {
            const fontKey = `${family}-${weight}`;

            if (this.fontCache.has(fontKey)) {
                return;
            }

            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = url;

            document.head.appendChild(link);
            this.fontCache.add(fontKey);
        });
    }

    // Optimize images with lazy loading
    static createLazyImage(src: string, alt: string, className?: string): HTMLImageElement {
        const img = document.createElement('img');
        img.alt = alt;
        if (className) img.className = className;

        // Use intersection observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        });

        observer.observe(img);
        return img;
    }
}

// Performance optimization utilities
export class PerformanceOptimizer {
    private static rafCallbacks = new Set<() => void>();
    private static isRafScheduled = false;

    // Batch DOM operations
    static batchDOMOperations(callback: () => void) {
        this.rafCallbacks.add(callback);

        if (!this.isRafScheduled) {
            this.isRafScheduled = true;
            requestAnimationFrame(() => {
                this.rafCallbacks.forEach((cb) => cb());
                this.rafCallbacks.clear();
                this.isRafScheduled = false;
            });
        }
    }

    // Debounce function
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
        immediate = false
    ): (...args: Parameters<T>) => void {
        let timeout: number | undefined;

        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                timeout = undefined;
                if (!immediate) func(...args);
            };

            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);

            if (callNow) func(...args);
        };
    }

    // Throttle function
    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;

        return function executedFunction(...args: Parameters<T>) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    // Measure performance
    static measurePerformance<T>(name: string, fn: () => T): T {
        const start = performance.now();
        const result = fn();
        const end = performance.now();

        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Memory usage monitoring
    static getMemoryUsage() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
            };
        }
        return null;
    }

    // Check if device has limited resources
    static isLowEndDevice(): boolean {
        // Check for various indicators of low-end devices
        const connection = (navigator as any).connection;
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const memory = this.getMemoryUsage();

        return (
            hardwareConcurrency <= 2 ||
            (memory && memory.limit < 1000) ||
            (connection && connection.effectiveType === 'slow-2g') ||
            (connection && connection.effectiveType === '2g')
        );
    }
}

// Code splitting React hook
export const useCodeSplitting = (chunkName: string) => {
    const [isLoaded, setIsLoaded] = React.useState(
        BundleSplitter.getLoadingStatus().loaded.includes(chunkName)
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const loadChunk = React.useCallback(async () => {
        if (isLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
            await BundleSplitter.loadChunk(chunkName);
            setIsLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load chunk');
        } finally {
            setIsLoading(false);
        }
    }, [chunkName, isLoaded]);

    const preload = React.useCallback(() => {
        PreloadingStrategy.addToQueue(chunkName, 1);
    }, [chunkName]);

    return { isLoaded, isLoading, error, loadChunk, preload };
};

// React hook for preloading on hover
export const usePreloadOnHover = (chunkName: string) => {
    const ref = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return;

        return PreloadingStrategy.preloadOnHover(element, chunkName);
    }, [chunkName]);

    return ref;
};

// React hook for performance optimization
export const usePerformanceOptimization = () => {
    const [isLowEnd] = React.useState(PerformanceOptimizer.isLowEndDevice());
    const [memoryUsage, setMemoryUsage] = React.useState(PerformanceOptimizer.getMemoryUsage());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMemoryUsage(PerformanceOptimizer.getMemoryUsage());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return {
        isLowEnd,
        memoryUsage,
        batchDOMOperations: PerformanceOptimizer.batchDOMOperations,
        debounce: PerformanceOptimizer.debounce,
        throttle: PerformanceOptimizer.throttle,
    };
};

// Classes are already exported above, no need to re-export

// Initialize chunk registry with common chunks
if (typeof window !== 'undefined') {
    // Register common chunks
    BundleSplitter.registerChunk(
        'accounting',
        () => import('../../features/accounting/pages/Accounts')
    );
    BundleSplitter.registerChunk(
        'inventory',
        () => import('../../features/inventory/stores/inventoryModel')
    );
    BundleSplitter.registerChunk(
        'dashboard',
        () => import('../../features/dashboard/stores/dashboardModel')
    );

    // Set up intelligent preloading based on user behavior
    PreloadingStrategy.preloadOnUserIntent([
        { trigger: 'click', chunks: ['accounting'] },
        { trigger: 'scroll', chunks: ['dashboard'] },
        { trigger: 'keydown', chunks: ['inventory'] },
    ]);

    // Preload critical resources on idle
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            PreloadingStrategy.addToQueue('dashboard', 0);
        });
    }
}
