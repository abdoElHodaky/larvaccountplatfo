/**
 * Memoization Utilities
 * Advanced caching and memoization functions
 */

/**
 * Simple memoization function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

/**
 * LRU (Least Recently Used) memoization with size limit
 */
export function memoizeLRU<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100,
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void; size: () => number } {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      // Move to end (most recently used)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn(...args);
    
    // Remove oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void; size: () => number };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size;
  
  return memoized;
}

/**
 * Time-based memoization with TTL (Time To Live)
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 60000, // 1 minute default
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, { value: ReturnType<T>; timestamp: number }>; clear: () => void } {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const now = Date.now();
    
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      if (now - cached.timestamp < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }
    
    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  }) as T & { cache: Map<string, { value: ReturnType<T>; timestamp: number }>; clear: () => void };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

/**
 * Weak memoization using WeakMap for object keys
 */
export function memoizeWeak<T extends (obj: object, ...args: any[]) => any>(
  fn: T
): T {
  const cache = new WeakMap();
  
  return ((...args: Parameters<T>) => {
    const [obj, ...restArgs] = args;
    
    if (!cache.has(obj)) {
      cache.set(obj, new Map());
    }
    
    const objCache = cache.get(obj);
    const key = JSON.stringify(restArgs);
    
    if (objCache.has(key)) {
      return objCache.get(key);
    }
    
    const result = fn(...args);
    objCache.set(key, result);
    return result;
  }) as T;
}

/**
 * Async memoization for promises
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, Promise<Awaited<ReturnType<T>>>>; clear: () => void } {
  const cache = new Map<string, Promise<Awaited<ReturnType<T>>>>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const promise = fn(...args).catch(error => {
      // Remove failed promises from cache
      cache.delete(key);
      throw error;
    });
    
    cache.set(key, promise);
    return promise;
  }) as T & { cache: Map<string, Promise<Awaited<ReturnType<T>>>>; clear: () => void };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

