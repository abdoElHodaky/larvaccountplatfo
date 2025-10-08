import React, { useCallback, useRef, useMemo, useState } from 'react';
import { shallowEqual } from '@/shared/utils/performance';

/**
 * useMemoizedCallback Hook
 * Creates a memoized callback that only changes when dependencies actually change
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<React.DependencyList>(deps);

  // Update callback ref when dependencies change
  if (!shallowEqual(deps, depsRef.current)) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(callbackRef.current, deps);
}

/**
 * useStableCallback Hook
 * Creates a callback that maintains referential stability across renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  // Always update the ref to the latest callback
  callbackRef.current = callback;

  // Return a stable callback that calls the latest version
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * useOptimizedCallback Hook
 * Creates an optimized callback with custom comparison for dependencies
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  compare?: (prev: React.DependencyList, next: React.DependencyList) => boolean
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<React.DependencyList>(deps);

  const shouldUpdate = useMemo(() => {
    if (compare) {
      return !compare(depsRef.current, deps);
    }
    return !shallowEqual(depsRef.current, deps);
  }, deps);

  if (shouldUpdate) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(callbackRef.current, deps);
}

/**
 * useThrottledCallback Hook
 * Creates a throttled callback that limits execution frequency
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef<T>(callback);

  // Update callback ref when dependencies change
  useCallback(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      if (timeSinceLastCall >= delay) {
        lastCallTime.current = now;
        return callbackRef.current(...args);
      } else {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout for remaining time
        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [delay]
  );

  return throttledCallback;
}

/**
 * useMemoizedEventHandler Hook
 * Creates memoized event handlers for form inputs and interactions
 */
export function useMemoizedEventHandler<T = any>(
  handler: (value: T, event?: React.ChangeEvent<any>) => void,
  deps: React.DependencyList = []
): (event: React.ChangeEvent<any>) => void {
  return useMemoizedCallback((event: React.ChangeEvent<any>) => {
    const value = event.target.value as T;
    handler(value, event);
  }, deps);
}

/**
 * useMemoizedClickHandler Hook
 * Creates memoized click handlers with optional data payload
 */
export function useMemoizedClickHandler<T = any>(
  handler: (data?: T, event?: React.MouseEvent) => void,
  data?: T,
  deps: React.DependencyList = []
): (event: React.MouseEvent) => void {
  return useMemoizedCallback((event: React.MouseEvent) => {
    handler(data, event);
  }, [data, ...deps]);
}

/**
 * useAsyncCallback Hook
 * Creates a memoized async callback with loading state
 */
export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  deps: React.DependencyList = []
): {
  execute: T;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useMemoizedCallback(async (...args: Parameters<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await callback(...args);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps) as T;

  return { execute, loading, error };
}

export default useMemoizedCallback;
