/**
 * Phase 10A/10B: Performance Monitoring Utilities
 * Track DOM optimization and animation performance metrics
 */

interface PerformanceMetrics {
  domNodeCount: number;
  animationFrameRate: number;
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  interactionLatency: number;
}

interface DOMOptimizationMetrics {
  beforeOptimization: {
    nodeCount: number;
    depth: number;
    renderTime: number;
  };
  afterOptimization: {
    nodeCount: number;
    depth: number;
    renderTime: number;
  };
  improvement: {
    nodeReduction: number;
    depthReduction: number;
    renderTimeImprovement: number;
    percentageImprovement: number;
  };
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private frameRateBuffer: number[] = [];
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.initializeObservers();
    this.startFrameRateMonitoring();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.renderTime = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Observe layout shifts
      try {
        const layoutObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.hadRecentInput) return;
            // Track layout shifts caused by animations
            console.log('Layout shift detected:', entry.value);
          });
        });
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }
    }
  }

  /**
   * Start monitoring animation frame rate
   */
  private startFrameRateMonitoring() {
    const measureFrameRate = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        
        this.frameRateBuffer.push(fps);
        if (this.frameRateBuffer.length > 60) {
          this.frameRateBuffer.shift();
        }
        
        // Calculate average FPS
        const avgFps = this.frameRateBuffer.reduce((a, b) => a + b, 0) / this.frameRateBuffer.length;
        this.metrics.animationFrameRate = Math.round(avgFps);
      }
      
      this.lastFrameTime = timestamp;
      this.animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    this.animationFrameId = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Count DOM nodes in a container
   */
  countDOMNodes(container: Element = document.body): number {
    let count = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    while (walker.nextNode()) {
      count++;
    }

    return count;
  }

  /**
   * Calculate DOM tree depth
   */
  calculateDOMDepth(container: Element = document.body): number {
    let maxDepth = 0;

    const calculateDepth = (element: Element, currentDepth: number = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      for (const child of element.children) {
        calculateDepth(child, currentDepth + 1);
      }
    };

    calculateDepth(container);
    return maxDepth;
  }

  /**
   * Measure render time for a component
   */
  async measureRenderTime(renderFunction: () => Promise<void> | void): Promise<number> {
    const startTime = performance.now();
    
    await renderFunction();
    
    // Wait for next frame to ensure rendering is complete
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  /**
   * Measure DOM optimization impact
   */
  async measureDOMOptimization(
    beforeOptimization: () => Promise<void> | void,
    afterOptimization: () => Promise<void> | void,
    container: Element = document.body
  ): Promise<DOMOptimizationMetrics> {
    // Measure before optimization
    await beforeOptimization();
    const beforeMetrics = {
      nodeCount: this.countDOMNodes(container),
      depth: this.calculateDOMDepth(container),
      renderTime: await this.measureRenderTime(() => {})
    };

    // Measure after optimization
    await afterOptimization();
    const afterMetrics = {
      nodeCount: this.countDOMNodes(container),
      depth: this.calculateDOMDepth(container),
      renderTime: await this.measureRenderTime(() => {})
    };

    // Calculate improvements
    const nodeReduction = beforeMetrics.nodeCount - afterMetrics.nodeCount;
    const depthReduction = beforeMetrics.depth - afterMetrics.depth;
    const renderTimeImprovement = beforeMetrics.renderTime - afterMetrics.renderTime;
    const percentageImprovement = (nodeReduction / beforeMetrics.nodeCount) * 100;

    return {
      beforeOptimization: beforeMetrics,
      afterOptimization: afterMetrics,
      improvement: {
        nodeReduction,
        depthReduction,
        renderTimeImprovement,
        percentageImprovement
      }
    };
  }

  /**
   * Measure interaction latency
   */
  measureInteractionLatency(element: Element, eventType: string = 'click'): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const handler = () => {
        const endTime = performance.now();
        const latency = endTime - startTime;
        element.removeEventListener(eventType, handler);
        resolve(latency);
      };

      element.addEventListener(eventType, handler);
      
      // Simulate the event
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return {
      ...this.metrics,
      domNodeCount: this.countDOMNodes(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    
    return `
Performance Report - Phase 10A/10B Optimization
===============================================

DOM Metrics:
- Node Count: ${metrics.domNodeCount || 'N/A'}
- Memory Usage: ${metrics.memoryUsage?.toFixed(2) || 'N/A'} MB

Animation Metrics:
- Frame Rate: ${metrics.animationFrameRate || 'N/A'} FPS
- Render Time: ${metrics.renderTime?.toFixed(2) || 'N/A'} ms

Interaction Metrics:
- Latency: ${metrics.interactionLatency?.toFixed(2) || 'N/A'} ms

Recommendations:
${this.generateRecommendations(metrics)}
    `.trim();
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: Partial<PerformanceMetrics>): string {
    const recommendations: string[] = [];

    if (metrics.animationFrameRate && metrics.animationFrameRate < 30) {
      recommendations.push('- Consider reducing animation complexity or enabling performance mode');
    }

    if (metrics.domNodeCount && metrics.domNodeCount > 1000) {
      recommendations.push('- High DOM node count detected. Consider further Fragment optimizations');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      recommendations.push('- High memory usage. Consider component memoization or lazy loading');
    }

    if (metrics.interactionLatency && metrics.interactionLatency > 100) {
      recommendations.push('- High interaction latency. Consider debouncing or optimizing event handlers');
    }

    return recommendations.length > 0 
      ? recommendations.join('\n')
      : '- Performance looks good! No immediate optimizations needed.';
  }

  /**
   * Clean up observers and monitoring
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy access
export const measureDOMOptimization = (
  before: () => Promise<void> | void,
  after: () => Promise<void> | void,
  container?: Element
) => performanceMonitor.measureDOMOptimization(before, after, container);

export const getPerformanceMetrics = () => performanceMonitor.getMetrics();

export const generatePerformanceReport = () => performanceMonitor.generateReport();

export const countDOMNodes = (container?: Element) => performanceMonitor.countDOMNodes(container);

export const measureRenderTime = (renderFn: () => Promise<void> | void) => 
  performanceMonitor.measureRenderTime(renderFn);

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  return {
    measureDOMOptimization,
    getMetrics: getPerformanceMetrics,
    generateReport: generatePerformanceReport,
    countNodes: countDOMNodes,
    measureRender: measureRenderTime
  };
};
