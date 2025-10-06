/**
 * Performance Utilities
 * Helper functions for React performance optimization
 */

import { useCallback, useMemo, useRef } from 'react';

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
  
  let keys = Object.keys(a);
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
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();
  
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
    return useCallback(callback, deps);
  },

  /**
   * Creates a memoized value with custom comparison
   */
  useMemoizedValue: <T>(
    factory: () => T,
    deps: React.DependencyList,
    compare?: (prev: T, next: T) => boolean
  ): T => {
    const prevRef = useRef<T>();
    const depsRef = useRef<React.DependencyList>();
    
    return useMemo(() => {
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
