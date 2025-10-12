/**
 * Performance Monitoring Utilities
 * Monitors lazy loading performance and provides insights
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface LazyLoadMetric extends PerformanceMetric {
  componentName: string;
  bundleSize?: number;
  cacheHit?: boolean;
  retryCount?: number;
}

interface RouteMetric extends PerformanceMetric {
  routeName: string;
  preloaded?: boolean;
  componentsLoaded?: string[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private lazyLoadMetrics: LazyLoadMetric[] = [];
  private routeMetrics: RouteMetric[] = [];
  private observers: ((metric: PerformanceMetric) => void)[] = [];

  // Start tracking a performance metric
  startMetric(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    this.metrics.set(name, metric);
  }

  // End tracking a performance metric
  endMetric(name: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Notify observers
    this.observers.forEach(observer => observer(metric));

    return metric;
  }

  // Track lazy component loading
  trackLazyLoad(componentName: string): {
    start: () => void;
    end: (metadata?: { bundleSize?: number; cacheHit?: boolean; retryCount?: number }) => void;
  } {
    const metricName = `lazy-load-${componentName}`;
    
    return {
      start: () => {
        this.startMetric(metricName, { type: 'lazy-load', componentName });
      },
      end: (metadata = {}) => {
        const metric = this.endMetric(metricName, metadata);
        if (metric) {
          const lazyMetric: LazyLoadMetric = {
            ...metric,
            componentName,
            bundleSize: metadata.bundleSize,
            cacheHit: metadata.cacheHit,
            retryCount: metadata.retryCount,
          };
          this.lazyLoadMetrics.push(lazyMetric);
        }
      },
    };
  }

  // Track route navigation
  trackRouteNavigation(routeName: string, preloaded = false): {
    start: () => void;
    end: (componentsLoaded?: string[]) => void;
  } {
    const metricName = `route-${routeName}`;
    
    return {
      start: () => {
        this.startMetric(metricName, { type: 'route', routeName, preloaded });
      },
      end: (componentsLoaded = []) => {
        const metric = this.endMetric(metricName, { componentsLoaded });
        if (metric) {
          const routeMetric: RouteMetric = {
            ...metric,
            routeName,
            preloaded,
            componentsLoaded,
          };
          this.routeMetrics.push(routeMetric);
        }
      },
    };
  }

  // Get performance statistics
  getStats() {
    const lazyLoadStats = this.analyzeLazyLoadMetrics();
    const routeStats = this.analyzeRouteMetrics();
    
    return {
      lazyLoad: lazyLoadStats,
      routes: routeStats,
      overall: this.getOverallStats(),
    };
  }

  private analyzeLazyLoadMetrics() {
    if (this.lazyLoadMetrics.length === 0) {
      return { count: 0, averageTime: 0, slowest: null, fastest: null };
    }

    const durations = this.lazyLoadMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);
    
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const slowest = this.lazyLoadMetrics.reduce((prev, current) => 
      (prev.duration || 0) > (current.duration || 0) ? prev : current
    );
    const fastest = this.lazyLoadMetrics.reduce((prev, current) => 
      (prev.duration || Infinity) < (current.duration || Infinity) ? prev : current
    );

    // Group by component
    const byComponent = this.lazyLoadMetrics.reduce((acc, metric) => {
      const name = metric.componentName;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(metric);
      return acc;
    }, {} as Record<string, LazyLoadMetric[]>);

    return {
      count: this.lazyLoadMetrics.length,
      averageTime,
      slowest,
      fastest,
      byComponent,
      cacheHitRate: this.calculateCacheHitRate(),
      retryRate: this.calculateRetryRate(),
    };
  }

  private analyzeRouteMetrics() {
    if (this.routeMetrics.length === 0) {
      return { count: 0, averageTime: 0, slowest: null, fastest: null };
    }

    const durations = this.routeMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);
    
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const slowest = this.routeMetrics.reduce((prev, current) => 
      (prev.duration || 0) > (current.duration || 0) ? prev : current
    );
    const fastest = this.routeMetrics.reduce((prev, current) => 
      (prev.duration || Infinity) < (current.duration || Infinity) ? prev : current
    );

    // Analyze preloading effectiveness
    const preloadedRoutes = this.routeMetrics.filter(m => m.preloaded);
    const nonPreloadedRoutes = this.routeMetrics.filter(m => !m.preloaded);
    
    const preloadedAverage = preloadedRoutes.length > 0 
      ? preloadedRoutes.reduce((sum, m) => sum + (m.duration || 0), 0) / preloadedRoutes.length
      : 0;
    
    const nonPreloadedAverage = nonPreloadedRoutes.length > 0
      ? nonPreloadedRoutes.reduce((sum, m) => sum + (m.duration || 0), 0) / nonPreloadedRoutes.length
      : 0;

    return {
      count: this.routeMetrics.length,
      averageTime,
      slowest,
      fastest,
      preloadingEffectiveness: {
        preloadedCount: preloadedRoutes.length,
        nonPreloadedCount: nonPreloadedRoutes.length,
        preloadedAverage,
        nonPreloadedAverage,
        improvement: nonPreloadedAverage > 0 ? 
          ((nonPreloadedAverage - preloadedAverage) / nonPreloadedAverage) * 100 : 0,
      },
    };
  }

  private getOverallStats() {
    const allMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined);
    
    if (allMetrics.length === 0) {
      return { totalMetrics: 0, averageTime: 0 };
    }

    const totalTime = allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageTime = totalTime / allMetrics.length;

    return {
      totalMetrics: allMetrics.length,
      averageTime,
      totalTime,
    };
  }

  private calculateCacheHitRate(): number {
    const metricsWithCacheInfo = this.lazyLoadMetrics.filter(m => 
      m.cacheHit !== undefined
    );
    
    if (metricsWithCacheInfo.length === 0) return 0;
    
    const cacheHits = metricsWithCacheInfo.filter(m => m.cacheHit).length;
    return (cacheHits / metricsWithCacheInfo.length) * 100;
  }

  private calculateRetryRate(): number {
    const metricsWithRetryInfo = this.lazyLoadMetrics.filter(m => 
      m.retryCount !== undefined
    );
    
    if (metricsWithRetryInfo.length === 0) return 0;
    
    const retriedLoads = metricsWithRetryInfo.filter(m => (m.retryCount || 0) > 0).length;
    return (retriedLoads / metricsWithRetryInfo.length) * 100;
  }

  // Subscribe to performance events
  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.lazyLoadMetrics = [];
    this.routeMetrics = [];
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.metrics.values()),
      lazyLoadMetrics: this.lazyLoadMetrics,
      routeMetrics: this.routeMetrics,
      stats: this.getStats(),
    };
  }

  // Log performance warnings
  checkPerformanceThresholds() {
    const stats = this.getStats();
    const warnings: string[] = [];

    // Check lazy loading performance
    if (stats.lazyLoad.averageTime > 1000) {
      warnings.push(`Average lazy load time is high: ${stats.lazyLoad.averageTime.toFixed(2)}ms`);
    }

    if (stats.lazyLoad.retryRate > 10) {
      warnings.push(`High retry rate for lazy loading: ${stats.lazyLoad.retryRate.toFixed(2)}%`);
    }

    // Check route performance
    if (stats.routes.averageTime > 2000) {
      warnings.push(`Average route navigation time is high: ${stats.routes.averageTime.toFixed(2)}ms`);
    }

    // Log warnings
    warnings.forEach(warning => console.warn(`[Performance Monitor] ${warning}`));

    return warnings;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    trackLazyLoad: performanceMonitor.trackLazyLoad.bind(performanceMonitor),
    trackRouteNavigation: performanceMonitor.trackRouteNavigation.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    subscribe: performanceMonitor.subscribe.bind(performanceMonitor),
    exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor),
  };
};

// Higher-order component for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const TrackedComponent: React.FC<P> = (props) => {
    React.useEffect(() => {
      const tracker = performanceMonitor.trackLazyLoad(componentName);
      tracker.start();
      
      // const _endTime = performance.now();
      tracker.end({ 
        bundleSize: undefined, // Could be calculated if needed
        cacheHit: false, // Could be determined based on loading state
      });
    }, []);

    return <WrappedComponent {...props} />;
  };

  TrackedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return TrackedComponent;
};

export default performanceMonitor;
