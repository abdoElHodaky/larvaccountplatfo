/**
 * Analytics Reporter Service
 * Reports metrics to external analytics services
 */

import { MetricData, AggregatedMetric } from './metricsCollector';

export interface AnalyticsConfig {
  endpoint?: string;
  apiKey?: string;
  batchSize?: number;
  flushInterval?: number;
  enableConsoleLogging?: boolean;
}

export interface ReportBatch {
  metrics: MetricData[];
  timestamp: number;
  sessionId: string;
  userId?: string;
  organizationId?: string;
}

export class AnalyticsReporter {
  private config: AnalyticsConfig;
  private pendingMetrics: MetricData[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      batchSize: 100,
      flushInterval: 30000, // 30 seconds
      enableConsoleLogging: false,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  /**
   * Report a single metric
   */
  report(metric: MetricData): void {
    this.pendingMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.log('[Analytics]', metric);
    }

    // Auto-flush if batch size reached
    if (this.pendingMetrics.length >= (this.config.batchSize || 100)) {
      this.flush();
    }
  }

  /**
   * Report multiple metrics
   */
  reportBatch(metrics: MetricData[]): void {
    metrics.forEach(metric => this.report(metric));
  }

  /**
   * Report aggregated metrics
   */
  reportAggregated(aggregated: Map<string, AggregatedMetric>): void {
    aggregated.forEach((metric, name) => {
      this.report({
        name: `${name}_aggregated`,
        value: metric.average,
        timestamp: Date.now(),
        metadata: {
          count: metric.count,
          sum: metric.sum,
          min: metric.min,
          max: metric.max,
          percentiles: metric.percentiles,
          timeRange: metric.timeRange
        }
      });
    });
  }

  /**
   * Flush pending metrics
   */
  async flush(): Promise<void> {
    if (this.pendingMetrics.length === 0) return;

    const batch: ReportBatch = {
      metrics: [...this.pendingMetrics],
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      organizationId: this.getOrganizationId()
    };

    this.pendingMetrics = [];

    try {
      if (this.config.endpoint) {
        await this.sendToEndpoint(batch);
      }

      // Send to console if enabled
      if (this.config.enableConsoleLogging) {
        console.log('[Analytics Batch]', batch);
      }

      // Send to browser analytics APIs
      this.sendToBrowserAPIs(batch);

    } catch (error) {
      console.error('[Analytics] Failed to send batch:', error);
      
      // Re-add metrics to pending if send failed
      this.pendingMetrics.unshift(...batch.metrics);
    }
  }

  /**
   * Send batch to configured endpoint
   */
  private async sendToEndpoint(batch: ReportBatch): Promise<void> {
    if (!this.config.endpoint) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      throw new Error(`Analytics endpoint responded with ${response.status}`);
    }
  }

  /**
   * Send to browser analytics APIs
   */
  private sendToBrowserAPIs(batch: ReportBatch): void {
    // Send to Performance Observer API
    if (typeof PerformanceObserver !== 'undefined') {
      batch.metrics.forEach(metric => {
        if (metric.name.includes('performance') && typeof performance !== 'undefined') {
          try {
            performance.mark(`analytics_${metric.name}`);
          } catch (error) {
            // Ignore performance API errors
          }
        }
      });
    }

    // Send to User Timing API
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure('analytics_batch', undefined, undefined);
      } catch (error) {
        // Ignore timing API errors
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 30000);
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID from context
   */
  private getUserId(): string | undefined {
    // Try to get from various sources
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.userId || window.user?.id;
    }
    return undefined;
  }

  /**
   * Get organization ID from context
   */
  private getOrganizationId(): string | undefined {
    // Try to get from various sources
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.organizationId || window.organization?.id;
    }
    return undefined;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if interval changed
    if (newConfig.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Get pending metrics count
   */
  getPendingCount(): number {
    return this.pendingMetrics.length;
  }

  /**
   * Clear pending metrics
   */
  clearPending(): void {
    this.pendingMetrics = [];
  }

  /**
   * Destroy reporter
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush(); // Final flush
    this.clearPending();
  }
}

// Global analytics reporter instance
export const analyticsReporter = new AnalyticsReporter();

