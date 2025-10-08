/**
 * Advanced AlovaJS Hooks
 * Enhanced hooks with throttling, debouncing, and advanced features
 */

import { useRequest, useWatcher, useFetcher } from 'alova';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { alovaInstance } from '../services/graphql/apollo-client';
import { useCurrentTenant } from '../hooks/useRematchStore';

// Types
interface UseAdvancedRequestOptions {
  throttle?: number;
  debounce?: number;
  cache?: boolean | number;
  retry?: boolean | number;
  background?: boolean;
  silent?: boolean;
  immediate?: boolean;
  force?: boolean;
}

interface UseInfiniteScrollOptions {
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
  enabled?: boolean;
}

/**
 * Advanced request hook with throttling and debouncing
 */
export function useAdvancedRequest<T = any>(
  methodHandler: () => any,
  options: UseAdvancedRequestOptions = {}
) {
  const {
    throttle = 0,
    debounce = 0,
    cache = true,
    retry = 3,
    background = false,
    silent = false,
    immediate = true,
    force = false,
  } = options;

  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  const method = useMemo(() => {
    const baseMethod = methodHandler();
    
    // Configure caching
    if (typeof cache === 'number') {
      baseMethod.config.localCache = cache;
    } else if (cache === false) {
      baseMethod.config.localCache = 0;
    }
    
    // Configure retry
    if (typeof retry === 'number') {
      baseMethod.config.retry = retry;
    }
    
    return baseMethod;
  }, [methodHandler, cache, retry]);

  const { data, loading, error, send, abort } = useRequest(method, {
    immediate: immediate && !throttle && !debounce,
    force,
  });

  const throttledSend = useCallback((...args: any[]) => {
    if (throttle > 0) {
      const now = Date.now();
      if (now - lastCallRef.current < throttle) {
        return;
      }
      lastCallRef.current = now;
    }
    
    return send(...args);
  }, [send, throttle]);

  const debouncedSend = useCallback((...args: any[]) => {
    if (debounce > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        send(...args);
      }, debounce);
      
      return;
    }
    
    return send(...args);
  }, [send, debounce]);

  const enhancedSend = useCallback((...args: any[]) => {
    if (throttle > 0) {
      return throttledSend(...args);
    }
    
    if (debounce > 0) {
      return debouncedSend(...args);
    }
    
    return send(...args);
  }, [throttledSend, debouncedSend, send, throttle, debounce]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    data,
    loading: background ? false : loading,
    error: silent ? null : error,
    send: enhancedSend,
    abort,
    refresh: () => enhancedSend(),
  };
}

/**
 * Watcher hook with advanced features
 */
export function useAdvancedWatcher<T = any>(
  methodHandler: () => any,
  watchedStates: any[],
  options: UseAdvancedRequestOptions = {}
) {
  const {
    throttle = 0,
    debounce = 300, // Default debounce for watchers
    cache = true,
    retry = 3,
    immediate = true,
  } = options;

  const method = useMemo(() => {
    const baseMethod = methodHandler();
    
    if (typeof cache === 'number') {
      baseMethod.config.localCache = cache;
    } else if (cache === false) {
      baseMethod.config.localCache = 0;
    }
    
    if (typeof retry === 'number') {
      baseMethod.config.retry = retry;
    }
    
    return baseMethod;
  }, [methodHandler, cache, retry]);

  const { data, loading, error, send, abort } = useWatcher(
    method,
    watchedStates,
    {
      immediate,
      debounce,
    }
  );

  return {
    data,
    loading,
    error,
    send,
    abort,
    refresh: () => send(),
  };
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll<T = any>(
  methodHandler: (page: number, pageSize: number) => any,
  options: UseInfiniteScrollOptions = {}
) {
  const {
    pageSize = 20,
    threshold = 0.8,
    enabled = true,
  } = options;

  const { data, loading, error, send } = useRequest(
    methodHandler(1, pageSize),
    { immediate: enabled }
  );

  const loadMore = useCallback(() => {
    if (!loading && enabled) {
      const currentPage = Math.ceil((data?.length || 0) / pageSize) + 1;
      return send(currentPage, pageSize);
    }
  }, [loading, enabled, data, pageSize, send]);

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= threshold && !loading) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, threshold, loading, loadMore]);

  return {
    data: data || [],
    loading,
    error,
    loadMore,
    hasMore: true, // This should be determined by your API response
  };
}

/**
 * Pagination hook
 */
export function usePagination<T = any>(
  methodHandler: (page: number, pageSize: number) => any,
  options: UsePaginationOptions = {}
) {
  const {
    pageSize = 20,
    initialPage = 1,
    enabled = true,
  } = options;

  const { data, loading, error, send } = useRequest(
    methodHandler(initialPage, pageSize),
    { immediate: enabled }
  );

  const goToPage = useCallback((page: number) => {
    return send(page, pageSize);
  }, [send, pageSize]);

  const nextPage = useCallback(() => {
    const currentPage = data?.currentPage || initialPage;
    return goToPage(currentPage + 1);
  }, [data, initialPage, goToPage]);

  const prevPage = useCallback(() => {
    const currentPage = data?.currentPage || initialPage;
    if (currentPage > 1) {
      return goToPage(currentPage - 1);
    }
  }, [data, initialPage, goToPage]);

  return {
    data: data?.data || [],
    pagination: {
      currentPage: data?.currentPage || initialPage,
      totalPages: data?.totalPages || 1,
      totalItems: data?.totalItems || 0,
      pageSize,
      hasNext: (data?.currentPage || initialPage) < (data?.totalPages || 1),
      hasPrev: (data?.currentPage || initialPage) > 1,
    },
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refresh: () => goToPage(data?.currentPage || initialPage),
  };
}

/**
 * Background sync hook
 */
export function useBackgroundSync<T = any>(
  methodHandler: () => any,
  interval: number = 30000 // 30 seconds default
) {
  const { data, loading, error, send } = useRequest(methodHandler(), {
    immediate: true,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      send();
    }, interval);

    return () => clearInterval(intervalId);
  }, [send, interval]);

  return {
    data,
    loading,
    error,
    sync: send,
  };
}

/**
 * Optimistic updates hook
 */
export function useOptimisticUpdate<T = any>(
  methodHandler: () => any,
  optimisticData: T
) {
  const { data, loading, error, send } = useRequest(methodHandler(), {
    immediate: false,
  });

  const optimisticSend = useCallback(async (...args: any[]) => {
    // Immediately return optimistic data
    const optimisticResult = { data: optimisticData, loading: false, error: null };
    
    // Send actual request
    const result = await send(...args);
    return result;
  }, [send, optimisticData]);

  return {
    data,
    loading,
    error,
    send: optimisticSend,
  };
}

/**
 * Tenant-aware request hook
 */
export function useTenantRequest<T = any>(
  methodHandler: (tenantId: string) => any,
  options: UseAdvancedRequestOptions = {}
) {
  const currentTenant = useCurrentTenant();
  
  const method = useMemo(() => {
    if (!currentTenant?.id) return null;
    return methodHandler(currentTenant.id);
  }, [methodHandler, currentTenant?.id]);

  const { data, loading, error, send, abort } = useRequest(
    method || (() => Promise.resolve(null)),
    {
      immediate: !!currentTenant?.id && (options.immediate !== false),
      force: options.force,
    }
  );

  return {
    data,
    loading: !currentTenant?.id ? false : loading,
    error: !currentTenant?.id ? null : error,
    send,
    abort,
    tenantId: currentTenant?.id,
  };
}

/**
 * Batch requests hook
 */
export function useBatchRequests<T = any>(
  methodHandlers: (() => any)[],
  options: { parallel?: boolean; immediate?: boolean } = {}
) {
  const { parallel = true, immediate = true } = options;

  const methods = useMemo(() => 
    methodHandlers.map(handler => handler()), 
    [methodHandlers]
  );

  const requests = methods.map(method => 
    useRequest(method, { immediate: false })
  );

  const sendAll = useCallback(async () => {
    if (parallel) {
      return Promise.all(requests.map(req => req.send()));
    } else {
      const results = [];
      for (const req of requests) {
        results.push(await req.send());
      }
      return results;
    }
  }, [requests, parallel]);

  useEffect(() => {
    if (immediate) {
      sendAll();
    }
  }, [immediate, sendAll]);

  return {
    data: requests.map(req => req.data),
    loading: requests.some(req => req.loading),
    errors: requests.map(req => req.error),
    sendAll,
    abort: () => requests.forEach(req => req.abort()),
  };
}

/**
 * Real-time data hook with polling
 */
export function useRealTimeData<T = any>(
  methodHandler: () => any,
  interval: number = 5000,
  options: { enabled?: boolean; immediate?: boolean } = {}
) {
  const { enabled = true, immediate = true } = options;

  const { data, loading, error, send } = useRequest(methodHandler(), {
    immediate: immediate && enabled,
  });

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      send();
    }, interval);

    return () => clearInterval(intervalId);
  }, [send, interval, enabled]);

  return {
    data,
    loading,
    error,
    refresh: send,
    enabled,
  };
}
