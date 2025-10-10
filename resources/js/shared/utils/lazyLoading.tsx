import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { Box, Spinner, VStack, Text, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced lazy loading utility with loading states and error boundaries
 */

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  timeout?: number;
}

interface LoadingSkeletonProps {
  height?: string;
  variant?: 'page' | 'component' | 'minimal';
}

/**
 * Loading skeleton component for better UX during lazy loading
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  height = '200px', 
  variant = 'component' 
}) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  if (variant === 'minimal') {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        height={height}
      >
        <Spinner size="md" color="blue.500" />
      </Box>
    );
  }

  if (variant === 'page') {
    return (
      <VStack spacing={4} align="stretch" p={6}>
        <Box h="40px" bg={bgColor} borderRadius="md" />
        <Box h="20px" bg={bgColor} borderRadius="md" w="60%" />
        <VStack spacing={2} align="stretch">
          <Box h="16px" bg={bgColor} borderRadius="sm" />
          <Box h="16px" bg={bgColor} borderRadius="sm" w="80%" />
          <Box h="16px" bg={bgColor} borderRadius="sm" w="90%" />
        </VStack>
        <Box h="200px" bg={bgColor} borderRadius="md" />
      </VStack>
    );
  }

  return (
    <VStack spacing={3} align="center" justify="center" height={height} p={4}>
      <Spinner size="lg" color="blue.500" thickness="3px" />
      <Text fontSize="sm" color={textColor}>
        Loading...
      </Text>
    </VStack>
  );
};

/**
 * Error boundary fallback component
 */
export const LazyLoadErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => {
  const bgColor = useColorModeValue('red.50', 'red.900');
  const textColor = useColorModeValue('red.800', 'red.200');

  return (
    <Box 
      p={6} 
      bg={bgColor} 
      borderRadius="md" 
      border="1px solid" 
      borderColor="red.200"
    >
      <VStack spacing={3}>
        <Text color={textColor} fontWeight="semibold">
          Failed to load component
        </Text>
        <Text fontSize="sm" color={textColor} opacity={0.8}>
          {error.message}
        </Text>
        <button 
          onClick={retry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E53E3E',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </VStack>
    </Box>
  );
};

/**
 * Enhanced lazy loading wrapper with error handling and preloading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    fallback = LoadingSkeleton,
    errorFallback = LazyLoadErrorFallback,
    preload = false,
    timeout = 10000,
  } = options;

  // Create the lazy component
  const LazyComponent = React.lazy(() => {
    const importPromise = importFn();
    
    // Add timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Component loading timed out after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([importPromise, timeoutPromise]);
  });

  // Preload the component if requested
  if (preload) {
    importFn().catch(() => {
      // Silently handle preload errors
    });
  }

  // Return wrapped component with error boundary
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryKey, setRetryKey] = React.useState(0);

    const retry = React.useCallback(() => {
      setError(null);
      setRetryKey(prev => prev + 1);
    }, []);

    if (error) {
      const ErrorComponent = errorFallback;
      return <ErrorComponent error={error} retry={retry} />;
    }

    return (
      <React.ErrorBoundary
        fallback={<errorFallback error={new Error('Component error')} retry={retry} />}
        onError={setError}
        key={retryKey}
      >
        <Suspense fallback={React.createElement(fallback)}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </React.ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `LazyLoaded(${LazyComponent.displayName || 'Component'})`;

  return WrappedComponent as LazyExoticComponent<T>;
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFn: () => Promise<any>): Promise<any> {
  return importFn().catch(() => {
    // Silently handle preload errors
  });
}

/**
 * Batch preload multiple components
 */
export function preloadComponents(importFns: Array<() => Promise<any>>): Promise<any[]> {
  return Promise.allSettled(importFns.map(fn => fn()));
}

/**
 * Hook for intersection-based lazy loading
 */
export function useIntersectionPreload(
  ref: React.RefObject<Element>,
  importFn: () => Promise<any>,
  options: IntersectionObserverInit = {}
) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadComponent(importFn);
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, importFn]);
}

/**
 * Route-based preloading utility
 */
export const routePreloader = {
  preloadedRoutes: new Set<string>(),
  
  preloadRoute(routeName: string, importFn: () => Promise<any>) {
    if (this.preloadedRoutes.has(routeName)) return;
    
    this.preloadedRoutes.add(routeName);
    preloadComponent(importFn);
  },
  
  preloadLikelyRoutes(currentRoute: string, routeMap: Record<string, () => Promise<any>>) {
    // Define likely navigation patterns
    const likelyRoutes: Record<string, string[]> = {
      'dashboard': ['accounting/Dashboard', 'inventory/Dashboard', 'sales/Dashboard'],
      'accounting/Dashboard': ['accounting/Accounts/Index', 'accounting/Transactions/Index'],
      'inventory/Dashboard': ['inventory/Products/Index', 'inventory/Categories/Index'],
      'sales/Dashboard': ['sales/Orders/Index', 'sales/Customers/Index'],
    };

    const routes = likelyRoutes[currentRoute] || [];
    routes.forEach(route => {
      if (routeMap[route]) {
        this.preloadRoute(route, routeMap[route]);
      }
    });
  }
};
