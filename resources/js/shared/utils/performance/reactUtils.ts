/**
 * React Performance Utilities
 * React-specific performance optimization tools
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { memoize } from './memoization';
import { debounce } from './debounce';

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
    componentName
  };
}

/**
 * HOC for performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceTrackedComponent = React.memo((props: P) => {
    const performanceData = usePerformanceMonitor(displayName);
    
    return React.createElement(WrappedComponent, props);
  });

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return PerformanceTrackedComponent;
}

/**
 * Hook for debounced state updates
 */
export function useDebouncedState<T>(initialValue: T, delay: number = 300): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useCallback(
    debounce((value: T) => {
      setDebouncedValue(value);
    }, delay),
    [delay]
  );

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    debouncedSetValue(value);
  }, [debouncedSetValue]);

  return [immediateValue, debouncedValue, setValue];
}

/**
 * Hook for expensive computations with memoization
 */
export function useExpensiveComputation<T, Args extends any[]>(
  computeFn: (...args: Args) => T,
  deps: Args,
  keyGenerator?: (...args: Args) => string
): T {
  const memoizedCompute = useMemo(
    () => memoize(computeFn, keyGenerator),
    [computeFn, keyGenerator]
  );

  return useMemo(() => memoizedCompute(...deps), deps);
}

/**
 * Hook for tracking component render performance
 */
export function useRenderPerformance(componentName: string, threshold: number = 16) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);
  const slowRenders = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > threshold) {
        slowRenders.current += 1;
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
          );
        }
      }
    }
  });

  return {
    renderCount: renderCount.current,
    slowRenders: slowRenders.current,
    slowRenderPercentage: renderCount.current > 0 ? (slowRenders.current / renderCount.current) * 100 : 0
  };
}

/**
 * Hook for intersection observer with performance optimization
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
  freezeOnceVisible: boolean = false
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isVisible, setIsVisible] = useState(false);

  const frozen = freezeOnceVisible && isVisible;

  const updateEntry = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setEntry(entry);
    setIsVisible(entry.isIntersecting);
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || frozen) return;

    const observer = new IntersectionObserver(updateEntry, options);
    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options, frozen, updateEntry]);

  return { entry, isVisible };
}

/**
 * React Performance Utilities Collection
 */
export const ReactPerformanceUtils = {
  /**
   * Memoized component creator
   */
  createMemoizedComponent: <P extends object>(
    component: React.ComponentType<P>,
    areEqual?: (prevProps: P, nextProps: P) => boolean
  ) => {
    return React.memo(component, areEqual);
  },

  /**
   * Lazy component loader with error boundary
   */
  createLazyComponent: <P extends object>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFn);
    
    return (props: P) => 
      React.createElement(React.Suspense, 
        { fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComponent, props)
      );
  },

  /**
   * Performance-optimized list renderer
   */
  createVirtualizedList: <T>(
    items: T[],
    renderItem: (item: T, index: number) => React.ReactNode,
    itemHeight: number,
    containerHeight: number
  ) => {
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(visibleStart, visibleEnd);
    
    return {
      visibleItems,
      visibleStart,
      totalHeight: items.length * itemHeight,
      offsetY: visibleStart * itemHeight,
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      }
    };
  }
};
