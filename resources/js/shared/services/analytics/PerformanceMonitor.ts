/**
 * Performance Monitoring & Analytics Service
 * Tracks API performance, user interactions, and system metrics
 */

import { socketManager } from '../socket/socketManager';
import { dataSyncService } from '../dataSync/DataSyncService';

// Performance metric types
export interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count' | 'percentage';
    timestamp: Date;
    category: 'api' | 'ui' | 'network' | 'memory' | 'cache';
    tags?: Record<string, string>;
}

export interface ApiPerformanceMetric extends PerformanceMetric {
    category: 'api';
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    statusCode: number;
    responseSize: number;
    cached: boolean;
}

export interface UIPerformanceMetric extends PerformanceMetric {
    category: 'ui';
    component: string;
    action: 'render' | 'mount' | 'update' | 'unmount';
    renderTime: number;
    componentProps?: Record<string, any>;
}

export interface NetworkMetric extends PerformanceMetric {
    category: 'network';
    connectionType: string;
    bandwidth: number;
    latency: number;
    packetLoss: number;
}

export interface MemoryMetric extends PerformanceMetric {
    category: 'memory';
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
}

export interface CacheMetric extends PerformanceMetric {
    category: 'cache';
    hitRate: number;
    missRate: number;
    evictionRate: number;
    size: number;
}

// User interaction tracking
export interface UserInteraction {
    id: string;
    userId: string;
    sessionId: string;
    type: 'click' | 'scroll' | 'input' | 'navigation' | 'error';
    element?: string;
    page: string;
    timestamp: Date;
    duration?: number;
    metadata?: Record<string, any>;
}

// Error tracking
export interface ErrorEvent {
    id: string;
    type: 'javascript' | 'network' | 'api' | 'validation';
    message: string;
    stack?: string;
    url: string;
    line?: number;
    column?: number;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
}

// Analytics configuration
export interface AnalyticsConfig {
    enabled: boolean;
    sampleRate: number;
    bufferSize: number;
    flushInterval: number;
    endpoints: {
        metrics: string;
        interactions: string;
        errors: string;
    };
    enableRealTimeSync: boolean;
    enableUserTracking: boolean;
    enablePerformanceTracking: boolean;
    enableErrorTracking: boolean;
}

/**
 * Performance Monitor Class
 * Collects, aggregates, and reports performance metrics
 */
class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private interactions: UserInteraction[] = [];
    private errors: ErrorEvent[] = [];
    private config: AnalyticsConfig;
    private sessionId: string;
    private flushTimer: NodeJS.Timeout | null = null;
    private observer: PerformanceObserver | null = null;

    constructor(config: Partial<AnalyticsConfig> = {}) {
        this.config = {
            enabled: true,
            sampleRate: 1.0,
            bufferSize: 100,
            flushInterval: 30000, // 30 seconds
            endpoints: {
                metrics: '/api/analytics/metrics',
                interactions: '/api/analytics/interactions',
                errors: '/api/analytics/errors',
            },
            enableRealTimeSync: true,
            enableUserTracking: true,
            enablePerformanceTracking: true,
            enableErrorTracking: true,
            ...config,
        };

        this.sessionId = this.generateSessionId();
        this.initialize();
    }

    /**
     * Initialize performance monitoring
     */
    private initialize(): void {
        if (!this.config.enabled) return;

        // Setup performance observer
        if (typeof PerformanceObserver !== 'undefined') {
            this.setupPerformanceObserver();
        }

        // Setup error tracking
        if (this.config.enableErrorTracking) {
            this.setupErrorTracking();
        }

        // Setup user interaction tracking
        if (this.config.enableUserTracking) {
            this.setupUserTracking();
        }

        // Setup periodic flushing
        this.setupPeriodicFlush();

        // Setup page visibility handling
        this.setupVisibilityHandling();

        console.log('📊 Performance Monitor initialized');
    }

    /**
     * Setup Performance Observer for Web Vitals
     */
    private setupPerformanceObserver(): void {
        try {
            this.observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPerformanceEntry(entry);
                }
            });

            // Observe different types of performance entries
            this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] });

            // Observe Web Vitals if supported
            if ('PerformanceObserver' in window) {
                try {
                    this.observer.observe({ entryTypes: ['largest-contentful-paint'] });
                    this.observer.observe({ entryTypes: ['first-input'] });
                    this.observer.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    // Some browsers might not support all entry types
                    console.warn('Some performance entry types not supported:', e);
                }
            }
        } catch (error) {
            console.warn('Performance Observer not supported:', error);
        }
    }

    /**
     * Record performance entry
     */
    private recordPerformanceEntry(entry: PerformanceEntry): void {
        const metric: PerformanceMetric = {
            id: this.generateId(),
            name: entry.name,
            value: entry.duration || entry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            category: this.categorizePerformanceEntry(entry),
            tags: {
                entryType: entry.entryType,
                sessionId: this.sessionId,
            },
        };

        this.addMetric(metric);
    }

    /**
     * Categorize performance entry
     */
    private categorizePerformanceEntry(
        entry: PerformanceEntry
    ): 'api' | 'ui' | 'network' | 'memory' | 'cache' {
        if (entry.entryType === 'resource') {
            return 'network';
        } else if (entry.entryType === 'navigation') {
            return 'network';
        } else if (entry.entryType === 'measure' || entry.entryType === 'paint') {
            return 'ui';
        }
        return 'ui';
    }

    /**
     * Setup error tracking
     */
    private setupErrorTracking(): void {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                stack: event.error?.stack,
                url: event.filename,
                line: event.lineno,
                column: event.colno,
                severity: 'high',
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                stack: event.reason?.stack,
                url: window.location.href,
                severity: 'medium',
                context: { reason: event.reason },
            });
        });

        // Network errors (fetch failures)
        this.interceptFetch();
    }

    /**
     * Intercept fetch for network error tracking
     */
    private interceptFetch(): void {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0] instanceof Request ? args[0].url : args[0];

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();

                // Record API performance metric
                this.recordApiMetric({
                    endpoint: url.toString(),
                    method: args[1]?.method || 'GET',
                    statusCode: response.status,
                    responseTime: endTime - startTime,
                    responseSize: parseInt(response.headers.get('content-length') || '0'),
                    cached: response.headers.get('x-cache') === 'HIT',
                });

                // Record error if response is not ok
                if (!response.ok) {
                    this.recordError({
                        type: 'network',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: url.toString(),
                        severity: response.status >= 500 ? 'high' : 'medium',
                        context: {
                            status: response.status,
                            statusText: response.statusText,
                            method: args[1]?.method || 'GET',
                        },
                    });
                }

                return response;
            } catch (error) {
                const endTime = performance.now();

                // Record network error
                this.recordError({
                    type: 'network',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    url: url.toString(),
                    severity: 'high',
                    context: {
                        method: args[1]?.method || 'GET',
                        error: error instanceof Error ? error.stack : error,
                    },
                });

                // Record failed API metric
                this.recordApiMetric({
                    endpoint: url.toString(),
                    method: args[1]?.method || 'GET',
                    statusCode: 0,
                    responseTime: endTime - startTime,
                    responseSize: 0,
                    cached: false,
                });

                throw error;
            }
        };
    }

    /**
     * Setup user interaction tracking
     */
    private setupUserTracking(): void {
        // Click tracking
        document.addEventListener('click', (event) => {
            this.recordInteraction({
                type: 'click',
                element: this.getElementSelector(event.target as Element),
                page: window.location.pathname,
                metadata: {
                    x: event.clientX,
                    y: event.clientY,
                    button: event.button,
                },
            });
        });

        // Scroll tracking (throttled)
        let scrollTimeout: NodeJS.Timeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.recordInteraction({
                    type: 'scroll',
                    page: window.location.pathname,
                    metadata: {
                        scrollY: window.scrollY,
                        scrollX: window.scrollX,
                    },
                });
            }, 100);
        });

        // Navigation tracking
        this.setupNavigationTracking();
    }

    /**
     * Setup navigation tracking
     */
    private setupNavigationTracking(): void {
        // History API interception
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.recordInteraction({
                type: 'navigation',
                page: window.location.pathname,
                metadata: { method: 'pushState', url: args[2] },
            });
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.recordInteraction({
                type: 'navigation',
                page: window.location.pathname,
                metadata: { method: 'replaceState', url: args[2] },
            });
        };

        // Popstate event
        window.addEventListener('popstate', () => {
            this.recordInteraction({
                type: 'navigation',
                page: window.location.pathname,
                metadata: { method: 'popstate' },
            });
        });
    }

    /**
     * Setup periodic flushing
     */
    private setupPeriodicFlush(): void {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Setup page visibility handling
     */
    private setupVisibilityHandling(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Flush data before page becomes hidden
                this.flush();
            }
        });

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    /**
     * Record API performance metric
     */
    recordApiMetric(data: {
        endpoint: string;
        method: string;
        statusCode: number;
        responseTime: number;
        responseSize: number;
        cached: boolean;
    }): void {
        const metric: ApiPerformanceMetric = {
            id: this.generateId(),
            name: `api_${data.method.toLowerCase()}_${data.endpoint}`,
            value: data.responseTime,
            unit: 'ms',
            timestamp: new Date(),
            category: 'api',
            endpoint: data.endpoint,
            method: data.method as any,
            statusCode: data.statusCode,
            responseSize: data.responseSize,
            cached: data.cached,
            tags: {
                sessionId: this.sessionId,
                cached: data.cached.toString(),
                status: data.statusCode.toString(),
            },
        };

        this.addMetric(metric);
    }

    /**
     * Record UI performance metric
     */
    recordUIMetric(data: {
        component: string;
        action: 'render' | 'mount' | 'update' | 'unmount';
        renderTime: number;
        componentProps?: Record<string, any>;
    }): void {
        const metric: UIPerformanceMetric = {
            id: this.generateId(),
            name: `ui_${data.action}_${data.component}`,
            value: data.renderTime,
            unit: 'ms',
            timestamp: new Date(),
            category: 'ui',
            component: data.component,
            action: data.action,
            renderTime: data.renderTime,
            componentProps: data.componentProps,
            tags: {
                sessionId: this.sessionId,
                component: data.component,
                action: data.action,
            },
        };

        this.addMetric(metric);
    }

    /**
     * Record memory metric
     */
    recordMemoryMetric(): void {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            const metric: MemoryMetric = {
                id: this.generateId(),
                name: 'memory_usage',
                value: memory.usedJSHeapSize,
                unit: 'bytes',
                timestamp: new Date(),
                category: 'memory',
                heapUsed: memory.usedJSHeapSize,
                heapTotal: memory.totalJSHeapSize,
                external: 0,
                arrayBuffers: 0,
                tags: {
                    sessionId: this.sessionId,
                },
            };

            this.addMetric(metric);
        }
    }

    /**
     * Record cache performance metric
     */
    recordCacheMetric(): void {
        const stats = dataSyncService.getStats();
        const totalRequests = stats.subscriptionCount;
        const cacheHits = stats.cacheSize;
        const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

        const metric: CacheMetric = {
            id: this.generateId(),
            name: 'cache_performance',
            value: hitRate,
            unit: 'percentage',
            timestamp: new Date(),
            category: 'cache',
            hitRate,
            missRate: 100 - hitRate,
            evictionRate: 0, // Would need to track this separately
            size: stats.cacheSize,
            tags: {
                sessionId: this.sessionId,
            },
        };

        this.addMetric(metric);
    }

    /**
     * Record user interaction
     */
    recordInteraction(data: Partial<UserInteraction>): void {
        if (!this.config.enableUserTracking) return;

        const interaction: UserInteraction = {
            id: this.generateId(),
            userId: this.getCurrentUserId(),
            sessionId: this.sessionId,
            type: data.type || 'click',
            element: data.element,
            page: data.page || window.location.pathname,
            timestamp: new Date(),
            duration: data.duration,
            metadata: data.metadata,
        };

        this.interactions.push(interaction);
        this.checkBufferSize();
    }

    /**
     * Record error
     */
    recordError(data: Partial<ErrorEvent>): void {
        if (!this.config.enableErrorTracking) return;

        const error: ErrorEvent = {
            id: this.generateId(),
            type: data.type || 'javascript',
            message: data.message || 'Unknown error',
            stack: data.stack,
            url: data.url || window.location.href,
            line: data.line,
            column: data.column,
            userId: this.getCurrentUserId(),
            sessionId: this.sessionId,
            timestamp: new Date(),
            severity: data.severity || 'medium',
            context: data.context,
        };

        this.errors.push(error);

        // Send critical errors immediately
        if (error.severity === 'critical') {
            this.sendErrors([error]);
        } else {
            this.checkBufferSize();
        }
    }

    /**
     * Add metric to buffer
     */
    private addMetric(metric: PerformanceMetric): void {
        if (!this.shouldSample()) return;

        this.metrics.push(metric);
        this.checkBufferSize();

        // Send to real-time if enabled
        if (this.config.enableRealTimeSync && socketManager.isConnected) {
            socketManager.emit('analytics:metric', metric);
        }
    }

    /**
     * Check if we should sample this metric
     */
    private shouldSample(): boolean {
        return Math.random() < this.config.sampleRate;
    }

    /**
     * Check buffer size and flush if needed
     */
    private checkBufferSize(): void {
        const totalItems = this.metrics.length + this.interactions.length + this.errors.length;
        if (totalItems >= this.config.bufferSize) {
            this.flush();
        }
    }

    /**
     * Flush all buffered data
     */
    async flush(): Promise<void> {
        if (
            this.metrics.length === 0 &&
            this.interactions.length === 0 &&
            this.errors.length === 0
        ) {
            return;
        }

        try {
            // Send metrics
            if (this.metrics.length > 0) {
                await this.sendMetrics([...this.metrics]);
                this.metrics = [];
            }

            // Send interactions
            if (this.interactions.length > 0) {
                await this.sendInteractions([...this.interactions]);
                this.interactions = [];
            }

            // Send errors
            if (this.errors.length > 0) {
                await this.sendErrors([...this.errors]);
                this.errors = [];
            }

            console.log('📊 Analytics data flushed successfully');
        } catch (error) {
            console.error('❌ Failed to flush analytics data:', error);
        }
    }

    /**
     * Send metrics to server
     */
    private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
        await fetch(this.config.endpoints.metrics, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metrics, sessionId: this.sessionId }),
        });
    }

    /**
     * Send interactions to server
     */
    private async sendInteractions(interactions: UserInteraction[]): Promise<void> {
        await fetch(this.config.endpoints.interactions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactions, sessionId: this.sessionId }),
        });
    }

    /**
     * Send errors to server
     */
    private async sendErrors(errors: ErrorEvent[]): Promise<void> {
        await fetch(this.config.endpoints.errors, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ errors, sessionId: this.sessionId }),
        });
    }

    /**
     * Get current user ID
     */
    private getCurrentUserId(): string {
        // This would typically come from your auth context
        return localStorage.getItem('user_id') || 'anonymous';
    }

    /**
     * Get element selector
     */
    private getElementSelector(element: Element): string {
        if (!element) return '';

        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        metrics: number;
        interactions: number;
        errors: number;
        sessionId: string;
        uptime: number;
    } {
        return {
            metrics: this.metrics.length,
            interactions: this.interactions.length,
            errors: this.errors.length,
            sessionId: this.sessionId,
            uptime: performance.now(),
        };
    }

    /**
     * Destroy performance monitor
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        if (this.observer) {
            this.observer.disconnect();
        }

        // Final flush
        this.flush();

        console.log('📊 Performance Monitor destroyed');
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type {
    PerformanceMetric,
    ApiPerformanceMetric,
    UIPerformanceMetric,
    NetworkMetric,
    MemoryMetric,
    CacheMetric,
    UserInteraction,
    ErrorEvent,
    AnalyticsConfig,
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        performanceMonitor.destroy();
    });
}
