/**
 * Metrics Collector Service
 * Collects and aggregates performance metrics
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface AggregatedMetric {
  name: string;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

export class MetricsCollector {
  private metrics: MetricData[] = [];
  private maxMetrics: number = 10000;
  private aggregationInterval: number = 60000; // 1 minute
  private lastAggregation: number = Date.now();

  constructor(maxMetrics: number = 10000, aggregationInterval: number = 60000) {
    this.maxMetrics = maxMetrics;
    this.aggregationInterval = aggregationInterval;
  }

  /**
   * Collect a metric
   */
  collect(metric: MetricData): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Auto-aggregate if interval passed
    if (Date.now() - this.lastAggregation > this.aggregationInterval) {
      this.aggregate();
    }
  }

  /**
   * Get raw metrics
   */
  getMetrics(filter?: {
    name?: string;
    timeRange?: { start: number; end: number };
    tags?: Record<string, string>;
  }): MetricData[] {
    let filteredMetrics = this.metrics;

    if (filter) {
      if (filter.name) {
        filteredMetrics = filteredMetrics.filter(m => m.name === filter.name);
      }

      if (filter.timeRange) {
        filteredMetrics = filteredMetrics.filter(
          m => m.timestamp >= filter.timeRange!.start && m.timestamp <= filter.timeRange!.end
        );
      }

      if (filter.tags) {
        filteredMetrics = filteredMetrics.filter(m => {
          if (!m.tags) return false;
          return Object.entries(filter.tags!).every(([key, value]) => m.tags![key] === value);
        });
      }
    }

    return filteredMetrics;
  }

  /**
   * Aggregate metrics
   */
  aggregate(timeRange?: { start: number; end: number }): Map<string, AggregatedMetric> {
    const now = Date.now();
    const range = timeRange || {
      start: now - this.aggregationInterval,
      end: now
    };

    const metricsInRange = this.getMetrics({ timeRange: range });
    const aggregated = new Map<string, AggregatedMetric>();

    // Group by metric name
    const grouped = metricsInRange.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate aggregations
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;

      aggregated.set(name, {
        name,
        count,
        sum,
        average: sum / count,
        min: Math.min(...values),
        max: Math.max(...values),
        percentiles: {
          p50: this.percentile(sorted, 0.5),
          p90: this.percentile(sorted, 0.9),
          p95: this.percentile(sorted, 0.95),
          p99: this.percentile(sorted, 0.99)
        },
        timeRange: range
      });
    });

    this.lastAggregation = now;
    return aggregated;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    uniqueMetricNames: number;
    timeRange: { start: number; end: number };
    memoryUsage: number;
  } {
    const uniqueNames = new Set(this.metrics.map(m => m.name));
    const timestamps = this.metrics.map(m => m.timestamp);
    
    return {
      totalMetrics: this.metrics.length,
      uniqueMetricNames: uniqueNames.size,
      timeRange: {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps)
      },
      memoryUsage: JSON.stringify(this.metrics).length
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

