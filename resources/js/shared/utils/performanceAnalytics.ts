/**
 * Performance Analytics Dashboard
 * Provides real-time performance monitoring, Core Web Vitals tracking,
 * and performance regression detection
 */

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
}

export interface CoreWebVitalsData {
  LCP: PerformanceMetric | null;
  FID: PerformanceMetric | null;
  CLS: PerformanceMetric | null;
  FCP: PerformanceMetric | null;
  TTFB: PerformanceMetric | null;
}

export interface PerformanceAlert {
  id: string;
  type: 'regression' | 'threshold' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  period: string;
}

// Performance thresholds based on Google's recommendations
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  // Custom metrics
  pageLoadTime: { good: 2000, poor: 4000 },
  resourceLoadTime: { good: 1000, poor: 3000 },
  memoryUsage: { good: 50, poor: 100 }, // MB
  jsErrorRate: { good: 0.01, poor: 0.05 }, // percentage
};

/**
 * Core Web Vitals Monitor
 */
export class CoreWebVitalsMonitor {
  private static instance: CoreWebVitalsMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private analyticsCallback?: (metric: PerformanceMetric) => void;

  static getInstance(): CoreWebVitalsMonitor {
    if (!CoreWebVitalsMonitor.instance) {
      CoreWebVitalsMonitor.instance = new CoreWebVitalsMonitor();
    }
    return CoreWebVitalsMonitor.instance;
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  initialize(analyticsCallback?: (metric: PerformanceMetric) => void): void {
    this.analyticsCallback = analyticsCallback;
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0] as any;
      this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      for (const entry of entries) {
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      this.recordMetric('CLS', clsValue);
    });

    // First Contentful Paint (FCP)
    this.observeMetric('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordMetric('FCP', fcpEntry.startTime);
      }
    });

    // Time to First Byte (TTFB)
    this.observeMetric('navigation', (entries) => {
      const navigationEntry = entries[0] as PerformanceNavigationTiming;
      this.recordMetric('TTFB', navigationEntry.responseStart - navigationEntry.requestStart);
    });

    // Long tasks
    this.observeMetric('longtask', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('longTask', entry.duration);
      });
    });
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private recordMetric(name: string, value: number): void {
    const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return;

    const rating = this.getRating(value, threshold);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    };

    this.metrics.set(name, metric);

    // Send to analytics
    if (this.analyticsCallback) {
      this.analyticsCallback(metric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value.toFixed(2)}ms (${rating})`);
    }
  }

  private getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Get current Core Web Vitals data
   */
  getCoreWebVitals(): CoreWebVitalsData {
    return {
      LCP: this.metrics.get('LCP') || null,
      FID: this.metrics.get('FID') || null,
      CLS: this.metrics.get('CLS') || null,
      FCP: this.metrics.get('FCP') || null,
      TTFB: this.metrics.get('TTFB') || null,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Performance Analytics Dashboard
 */
export class PerformanceAnalyticsDashboard {
  private static instance: PerformanceAnalyticsDashboard;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private listeners: Array<(data: any) => void> = [];

  static getInstance(): PerformanceAnalyticsDashboard {
    if (!PerformanceAnalyticsDashboard.instance) {
      PerformanceAnalyticsDashboard.instance = new PerformanceAnalyticsDashboard();
    }
    return PerformanceAnalyticsDashboard.instance;
  }

  /**
   * Initialize the analytics dashboard
   */
  initialize(): void {
    // Initialize Core Web Vitals monitoring
    CoreWebVitalsMonitor.getInstance().initialize((metric) => {
      this.addMetric(metric);
    });

    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Load historical data
    this.loadHistoricalData();
    
    // Start trend analysis
    this.startTrendAnalysis();
  }

  /**
   * Add a performance metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Check for alerts
    this.checkForAlerts(metric);
    
    // Store in localStorage
    this.storeMetric(metric);
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    coreWebVitals: CoreWebVitalsData;
    averages: Record<string, number>;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    score: number;
  } {
    const coreWebVitals = CoreWebVitalsMonitor.getInstance().getCoreWebVitals();
    const averages = this.calculateAverages();
    const trends = Array.from(this.trends.values());
    const alerts = this.alerts.filter(alert => !alert.acknowledged);
    const score = this.calculatePerformanceScore();

    return {
      coreWebVitals,
      averages,
      trends,
      alerts,
      score,
    };
  }

  /**
   * Get metrics for a specific time period
   */
  getMetricsForPeriod(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(metricName: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === metricName);
  }

  /**
   * Add listener for dashboard updates
   */
  addListener(callback: (data: any) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifyListeners();
    }
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      trends: Array.from(this.trends.values()),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  private startPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.addMetric({
          name: 'pageLoadTime',
          value: navigation.loadEventEnd - navigation.navigationStart,
          rating: this.getRating(navigation.loadEventEnd - navigation.navigationStart, PERFORMANCE_THRESHOLDS.pageLoadTime),
          timestamp: Date.now(),
          url: window.location.href,
        });
      }, 0);
    });

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.addMetric({
            name: 'resourceLoadTime',
            value: resourceEntry.responseEnd - resourceEntry.startTime,
            rating: this.getRating(resourceEntry.responseEnd - resourceEntry.startTime, PERFORMANCE_THRESHOLDS.resourceLoadTime),
            timestamp: Date.now(),
            url: resourceEntry.name,
          });
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
        
        this.addMetric({
          name: 'memoryUsage',
          value: memoryUsageMB,
          rating: this.getRating(memoryUsageMB, PERFORMANCE_THRESHOLDS.memoryUsage),
          timestamp: Date.now(),
          url: window.location.href,
        });
      }, 30000); // Every 30 seconds
    }

    // Monitor JavaScript errors
    let errorCount = 0;
    const totalPageViews = 1;
    
    window.addEventListener('error', () => {
      errorCount++;
      const errorRate = (errorCount / totalPageViews) * 100;
      
      this.addMetric({
        name: 'jsErrorRate',
        value: errorRate,
        rating: this.getRating(errorRate, PERFORMANCE_THRESHOLDS.jsErrorRate),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });
  }

  private loadHistoricalData(): void {
    try {
      const stored = localStorage.getItem('performance_metrics');
      if (stored) {
        const historicalMetrics = JSON.parse(stored);
        this.metrics = historicalMetrics.slice(-500); // Keep last 500 metrics
      }
    } catch (error) {
      console.warn('Failed to load historical performance data:', error);
    }
  }

  private storeMetric(metric: PerformanceMetric): void {
    try {
      const stored = localStorage.getItem('performance_metrics');
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 500 metrics in storage
      const recentMetrics = metrics.slice(-500);
      localStorage.setItem('performance_metrics', JSON.stringify(recentMetrics));
    } catch (error) {
      console.warn('Failed to store performance metric:', error);
    }
  }

  private calculateAverages(): Record<string, number> {
    const averages: Record<string, number> = {};
    const metricGroups: Record<string, number[]> = {};
    
    // Group metrics by name
    this.metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric.value);
    });
    
    // Calculate averages
    Object.keys(metricGroups).forEach(metricName => {
      const values = metricGroups[metricName];
      averages[metricName] = values.reduce((sum, value) => sum + value, 0) / values.length;
    });
    
    return averages;
  }

  private startTrendAnalysis(): void {
    setInterval(() => {
      this.analyzeTrends();
    }, 60000); // Analyze trends every minute
  }

  private analyzeTrends(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    
    const recentMetrics = this.getMetricsForPeriod(oneHourAgo, now);
    const previousMetrics = this.getMetricsForPeriod(twoHoursAgo, oneHourAgo);
    
    const metricNames = [...new Set(recentMetrics.map(m => m.name))];
    
    metricNames.forEach(metricName => {
      const recent = recentMetrics.filter(m => m.name === metricName);
      const previous = previousMetrics.filter(m => m.name === metricName);
      
      if (recent.length > 0 && previous.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
        const previousAvg = previous.reduce((sum, m) => sum + m.value, 0) / previous.length;
        
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        let trend: 'improving' | 'stable' | 'degrading' = 'stable';
        if (Math.abs(changePercent) > 5) {
          // For metrics where lower is better
          if (['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'pageLoadTime', 'resourceLoadTime', 'memoryUsage', 'jsErrorRate'].includes(metricName)) {
            trend = changePercent < 0 ? 'improving' : 'degrading';
          } else {
            trend = changePercent > 0 ? 'improving' : 'degrading';
          }
        }
        
        this.trends.set(metricName, {
          metric: metricName,
          trend,
          changePercent,
          period: '1 hour',
        });
      }
    });
  }

  private checkForAlerts(metric: PerformanceMetric): void {
    // Check for threshold alerts
    if (metric.rating === 'poor') {
      this.createAlert({
        type: 'threshold',
        severity: 'high',
        metric: metric.name,
        message: `${metric.name} is performing poorly (${metric.value.toFixed(2)})`,
      });
    }
    
    // Check for regression alerts
    const trend = this.trends.get(metric.name);
    if (trend && trend.trend === 'degrading' && Math.abs(trend.changePercent) > 20) {
      this.createAlert({
        type: 'regression',
        severity: 'medium',
        metric: metric.name,
        message: `${metric.name} has degraded by ${Math.abs(trend.changePercent).toFixed(1)}% in the last hour`,
      });
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData,
    };
    
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private calculatePerformanceScore(): number {
    const coreWebVitals = CoreWebVitalsMonitor.getInstance().getCoreWebVitals();
    let score = 100;
    // let metricCount = 0;
    
    // Score based on Core Web Vitals
    Object.values(coreWebVitals).forEach(metric => {
      if (metric) {
        // metricCount++;
        if (metric.rating === 'poor') score -= 30;
        else if (metric.rating === 'needs-improvement') score -= 15;
      }
    });
    
    // Normalize score
    return Math.max(0, Math.min(100, score));
  }

  private getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private notifyListeners(): void {
    const data = this.getPerformanceSummary();
    this.listeners.forEach(listener => listener(data));
  }

  private exportToCSV(): string {
    const headers = ['timestamp', 'name', 'value', 'rating', 'url'];
    const rows = this.metrics.map(metric => [
      new Date(metric.timestamp).toISOString(),
      metric.name,
      metric.value.toString(),
      metric.rating,
      metric.url,
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

/**
 * Performance Regression Detector
 */
export class PerformanceRegressionDetector {
  private static instance: PerformanceRegressionDetector;
  private baselineMetrics: Map<string, number> = new Map();

  static getInstance(): PerformanceRegressionDetector {
    if (!PerformanceRegressionDetector.instance) {
      PerformanceRegressionDetector.instance = new PerformanceRegressionDetector();
    }
    return PerformanceRegressionDetector.instance;
  }

  /**
   * Set baseline metrics for regression detection
   */
  setBaseline(metrics: Record<string, number>): void {
    Object.entries(metrics).forEach(([name, value]) => {
      this.baselineMetrics.set(name, value);
    });
  }

  /**
   * Check for performance regression
   */
  checkRegression(metric: PerformanceMetric): {
    isRegression: boolean;
    severity: 'low' | 'medium' | 'high';
    changePercent: number;
  } {
    const baseline = this.baselineMetrics.get(metric.name);
    
    if (!baseline) {
      return { isRegression: false, severity: 'low', changePercent: 0 };
    }
    
    const changePercent = ((metric.value - baseline) / baseline) * 100;
    const isRegression = changePercent > 10; // 10% degradation threshold
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (changePercent > 50) severity = 'high';
    else if (changePercent > 25) severity = 'medium';
    
    return { isRegression, severity, changePercent };
  }
}

// Export main classes and utilities
export {
  CoreWebVitalsMonitor,
  PerformanceAnalyticsDashboard,
  PerformanceRegressionDetector,
  PERFORMANCE_THRESHOLDS,
};
