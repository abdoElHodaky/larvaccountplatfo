/**
 * Performance Monitor
 * Advanced performance monitoring and tracking utilities
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring: boolean = false;

  constructor(private maxMetrics: number = 1000) {
    this.setupPerformanceObservers();
  }

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.observers.forEach(observer => {
      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    });
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T {
    const functionName = name || fn.name || 'anonymous';
    
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();
      
      this.recordMetric(`function_${functionName}`, endTime - startTime, {
        type: 'function_execution',
        args: args.length
      });
      
      return result;
    }) as T;
  }

  /**
   * Measure async function execution time
   */
  measureAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name?: string
  ): T {
    const functionName = name || fn.name || 'anonymous';
    
    return (async (...args: Parameters<T>) => {
      const startTime = performance.now();
      try {
        const result = await fn(...args);
        const endTime = performance.now();
        
        this.recordMetric(`async_function_${functionName}`, endTime - startTime, {
          type: 'async_function_execution',
          args: args.length,
          success: true
        });
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        
        this.recordMetric(`async_function_${functionName}`, endTime - startTime, {
          type: 'async_function_execution',
          args: args.length,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    }) as T;
  }

  /**
   * Get performance report
   */
  getReport(timeRange?: { start: number; end: number }): PerformanceReport {
    let filteredMetrics = this.metrics;
    
    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    const functionMetrics = filteredMetrics.filter(m => 
      m.name.startsWith('function_') || m.name.startsWith('async_function_')
    );

    const averageResponseTime = functionMetrics.length > 0
      ? functionMetrics.reduce((sum, m) => sum + m.value, 0) / functionMetrics.length
      : 0;

    const errorCount = filteredMetrics.filter(m => 
      m.metadata?.success === false
    ).length;

    const errorRate = filteredMetrics.length > 0 
      ? (errorCount / filteredMetrics.length) * 100 
      : 0;

    const timeSpan = timeRange 
      ? timeRange.end - timeRange.start 
      : filteredMetrics.length > 0 
        ? Math.max(...filteredMetrics.map(m => m.timestamp)) - Math.min(...filteredMetrics.map(m => m.timestamp))
        : 0;

    const throughput = timeSpan > 0 ? (filteredMetrics.length / timeSpan) * 1000 : 0;

    return {
      metrics: filteredMetrics,
      summary: {
        averageResponseTime,
        totalRequests: filteredMetrics.length,
        errorRate,
        throughput
      },
      timeRange: timeRange || {
        start: filteredMetrics.length > 0 ? Math.min(...filteredMetrics.map(m => m.timestamp)) : 0,
        end: filteredMetrics.length > 0 ? Math.max(...filteredMetrics.map(m => m.timestamp)) : 0
      }
    };
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(pattern: string | RegExp): PerformanceMetric[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Navigation timing observer
    const navigationObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('navigation_load_time', navEntry.loadEventEnd - navEntry.loadEventStart, {
            type: 'navigation',
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            firstPaint: navEntry.loadEventStart - navEntry.fetchStart
          });
        }
      });
    });

    // Resource timing observer
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource_${resourceEntry.name}`, resourceEntry.duration, {
            type: 'resource',
            size: resourceEntry.transferSize,
            initiatorType: resourceEntry.initiatorType
          });
        }
      });
    });

    // Paint timing observer
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'paint') {
          this.recordMetric(`paint_${entry.name}`, entry.startTime, {
            type: 'paint'
          });
        }
      });
    });

    this.observers = [navigationObserver, resourceObserver, paintObserver];
  }

  /**
   * Create a performance mark
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          const entry = entries[entries.length - 1];
          this.recordMetric(name, entry.duration, {
            type: 'measure',
            startMark,
            endMark
          });
        }
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  }
}

