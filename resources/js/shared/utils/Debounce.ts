/**
 * Performance Monitoring and Optimization Utilities
 * Advanced performance tracking, monitoring, and optimization tools
 */

import React from 'react';

/**
 * Debounce function for performance optimization
 * Delays function execution until after wait milliseconds have elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 * Limits function execution to once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization utility for expensive calculations
 * Creates a memoized version of a function with custom key generation
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Deep comparison utility for React.memo
 * Performs deep equality check for complex objects
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b;
  }
  
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  
  if (a.prototype !== b.prototype) return false;
  
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  
  return keys.every(k => deepEqual(a[k], b[k]));
}

/**
 * Shallow comparison utility for React.memo
 * Performs shallow equality check for objects
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => a[key] === b[key]);
}

/**
 * Advanced Performance monitoring utilities
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge' | 'histogram';
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    memoryUsage: number;
    renderTime: number;
  };
  recommendations: string[];
  timestamp: number;
}

export interface PerformanceThresholds {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  renderTime: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private static measurements = new Map<string, number>();
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds: PerformanceThresholds;
  private isEnabled: boolean = true;

  private constructor() {
    this.thresholds = {
      responseTime: 1000, // 1 second
      errorRate: 0.05, // 5%
      memoryUsage: 100 * 1024 * 1024, // 100MB
      renderTime: 16, // 16ms for 60fps
      cacheHitRate: 0.8, // 80%
    };

    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Legacy static methods for backward compatibility
  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }
  
  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`Performance measurement '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    // Record in new system
    const instance = this.getInstance();
    instance.recordTiming(label, duration);
    
    return duration;
  }
  
  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }

  /**
   * Initialize performance observers including Core Web Vitals
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'navigation',
              value: entry.duration,
              timestamp: Date.now(),
              type: 'timing',
              tags: { type: entry.entryType },
            });
            
            // Record TTFB (Time to First Byte)
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            this.recordMetric({
              name: 'TTFB',
              value: ttfb,
              timestamp: Date.now(),
              type: 'timing',
              tags: { type: 'core_web_vital' },
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Core Web Vitals - Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            type: 'timing',
            tags: { type: 'core_web_vital' },
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // Core Web Vitals - First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const fidEntry = entry as any;
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.recordMetric({
              name: 'FID',
              value: fid,
              timestamp: Date.now(),
              type: 'timing',
              tags: { type: 'core_web_vital' },
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Core Web Vitals - Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          });
          
          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            type: 'timing',
            tags: { type: 'core_web_vital' },
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // Core Web Vitals - First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric({
                name: 'FCP',
                value: entry.startTime,
                timestamp: Date.now(),
                type: 'timing',
                tags: { type: 'core_web_vital' },
              });
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }

      // Long task observer
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              timestamp: Date.now(),
              type: 'timing',
              tags: { type: 'long_task' },
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }

    // Memory usage monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Start memory usage monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'memory_used',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          type: 'gauge',
          tags: { type: 'heap' },
        });
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds and emit warnings
    this.checkThresholds(metric);
  }

  /**
   * Record timing metric
   */
  public recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
      tags,
    });
  }

  /**
   * Record counter metric
   */
  public recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'counter',
      tags,
    });
  }

  /**
   * Get performance report
   */
  public getReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    const timingMetrics = recentMetrics.filter(m => m.type === 'timing');
    const errorMetrics = recentMetrics.filter(m => m.tags?.error === 'true');
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_used');

    const averageResponseTime = timingMetrics.length > 0
      ? timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length
      : 0;

    const errorRate = timingMetrics.length > 0
      ? errorMetrics.length / timingMetrics.length
      : 0;

    const currentMemory = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0;

    const recommendations = this.generateRecommendations({
      averageResponseTime,
      errorRate,
      memoryUsage: currentMemory,
      renderTime: 0,
    });

    return {
      metrics: recentMetrics,
      summary: {
        totalRequests: timingMetrics.length,
        averageResponseTime,
        errorRate,
        cacheHitRate: 0,
        memoryUsage: currentMemory,
        renderTime: 0,
      },
      recommendations,
      timestamp: now,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(summary: {
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    renderTime: number;
  }): string[] {
    const recommendations: string[] = [];

    if (summary.averageResponseTime > this.thresholds.responseTime) {
      recommendations.push(
        `Response time (${summary.averageResponseTime.toFixed(0)}ms) exceeds threshold. Consider optimizing API calls or implementing caching.`
      );
    }

    if (summary.errorRate > this.thresholds.errorRate) {
      recommendations.push(
        `Error rate (${(summary.errorRate * 100).toFixed(1)}%) is high. Review error handling and API reliability.`
      );
    }

    if (summary.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push(
        `Memory usage (${(summary.memoryUsage / 1024 / 1024).toFixed(0)}MB) is high. Check for memory leaks and optimize data structures.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable thresholds. Great job!');
    }

    return recommendations;
  }

  /**
   * Check metric against thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    if (metric.name === 'api_request' && metric.value > this.thresholds.responseTime) {
      console.warn(`Slow API request detected: ${metric.value}ms`);
    }

    if (metric.name === 'memory_used' && metric.value > this.thresholds.memoryUsage) {
      console.warn(`High memory usage detected: ${(metric.value / 1024 / 1024).toFixed(0)}MB`);
    }

    if (metric.name === 'long_task' && metric.value > 50) {
      console.warn(`Long task detected: ${metric.value}ms`);
    }
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

/**
 * React Hooks for performance monitoring
 */
export function usePerformanceMonitor() {
  const monitor = React.useMemo(() => PerformanceMonitor.getInstance(), []);
  const [report, setReport] = React.useState<PerformanceReport | null>(null);

  // Update report periodically
  React.useEffect(() => {
    const updateReport = () => {
      setReport(monitor.getReport());
    };

    updateReport(); // Initial report
    const interval = setInterval(updateReport, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [monitor]);

  const recordTiming = React.useCallback((name: string, duration: number, tags?: Record<string, string>) => {
    monitor.recordTiming(name, duration, tags);
  }, [monitor]);

  const recordCounter = React.useCallback((name: string, value?: number, tags?: Record<string, string>) => {
    monitor.recordCounter(name, value, tags);
  }, [monitor]);

  return {
    report,
    recordTiming,
    recordCounter,
    monitor,
  };
}

/**
 * React Hook for component performance tracking
 */
export function useComponentPerformance(componentName: string) {
  const { recordTiming, recordCounter } = usePerformanceMonitor();
  const renderCount = React.useRef(0);
  const mountTime = React.useRef(Date.now());

  // Track renders
  React.useEffect(() => {
    renderCount.current++;
    recordCounter('component_render', 1, { component: componentName });
  });

  // Track mount time
  React.useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    recordTiming('component_mount', mountDuration, { component: componentName });

    return () => {
      // Track unmount
      recordCounter('component_unmount', 1, { component: componentName });
    };
  }, [componentName, recordTiming, recordCounter]);

  return {
    renderCount: renderCount.current,
    recordTiming: (name: string, duration: number) => 
      recordTiming(name, duration, { component: componentName }),
  };
}

/**
 * React component performance utilities
 */
export const ReactPerformanceUtils = {
  /**
   * Creates a memoized comparison function for React.memo
   */
  createMemoComparison: <T>(
    compareKeys?: (keyof T)[]
  ) => (prevProps: T, nextProps: T): boolean => {
    if (compareKeys) {
      return compareKeys.every(key => prevProps[key] === nextProps[key]);
    }
    return shallowEqual(prevProps, nextProps);
  },

  /**
   * Creates a stable callback reference using useCallback
   */
  useStableCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T => {
    return React.useCallback(callback, deps);
  },

  /**
   * Creates a memoized value with custom comparison
   */
  useMemoizedValue: <T>(
    factory: () => T,
    deps: React.DependencyList,
    compare?: (prev: T, next: T) => boolean
  ): T => {
    const prevRef = React.useRef<T>();
    const depsRef = React.useRef<React.DependencyList>();
    
    return React.useMemo(() => {
      const newValue = factory();
      
      if (compare && prevRef.current !== undefined) {
        if (compare(prevRef.current, newValue)) {
          return prevRef.current;
        }
      }
      
      prevRef.current = newValue;
      depsRef.current = deps;
      return newValue;
    }, deps);
  },
};

/**
 * Financial data performance utilities
 */
export const FinancialPerformanceUtils = {
  /**
   * Memoized currency formatter
   */
  formatCurrency: memoize((
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }),

  /**
   * Memoized percentage formatter
   */
  formatPercentage: memoize((
    value: number,
    decimals: number = 2,
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }),

  /**
   * Memoized number formatter for financial data
   */
  formatNumber: memoize((
    value: number,
    decimals: number = 2,
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }),

  /**
   * Memoized date formatter
   */
  formatDate: memoize((
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    locale: string = 'en-US'
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }),

  /**
   * Optimized calculation for financial totals
   */
  calculateTotals: memoize((
    items: Array<{ amount: number; type: string }>
  ) => {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.amount;
      acc.total = (acc.total || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
  }, (items) => `${items.length}-${items.map(i => `${i.amount}-${i.type}`).join(',')}`),
};

export default {
  debounce,
  throttle,
  memoize,
  deepEqual,
  shallowEqual,
  PerformanceMonitor,
  ReactPerformanceUtils,
  FinancialPerformanceUtils,
};
