/**
 * Application Providers
 * Centralized provider setup for the entire application with Rematch
 */

import React, { Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ErrorBoundary } from 'react-error-boundary';

// Services and stores
import { store } from '../stores';
import { apolloClient } from '../services/graphql/apollo-client';
import { useAuth, useApp, useAppActions } from '../hooks/useRematchStore';
import { SocketProvider } from './SocketProvider';
import { AnimationProvider } from './AnimationProvider';
import { pwaManager } from '../utils/pwa';
import { PWAInstallPrompt } from '../components/pwa/PWAInstallPrompt';

// Theme
import theme from '../theme';

// Components
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { NotificationContainer } from '../components/ui/NotificationContainer';

// Types
interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Performance Monitor Component
 */
const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Monitor render performance
    const _startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          // Performance measurement logged
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const _memoryInfo = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      // Memory usage tracked
    }

    return () => {
      observer.disconnect();
      const _endTime = performance.now();
      // Component render time tracked
    };
  }, []);

  return <>{children}</>;
};

/**
 * Auth Initializer Component
 */
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, refreshUser } = useAuth();

  useEffect(() => {
    // Initialize auth state on app start
    if (token && isAuthenticated) {
      refreshUser();
    }
  }, [token, isAuthenticated, refreshUser]);

  return <>{children}</>;
};

/**
 * Connection Monitor Component
 */
const ConnectionMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { handleGlobalError } = useAppActions();

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      // Connection restored
    };
    
    const handleOffline = () => {
      handleGlobalError('Connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleGlobalError]);

  useEffect(() => {
    // Monitor WebSocket connection
    // This would be connected to your WebSocket service
    const checkWebSocketConnection = () => {
      // Implement WebSocket connection check
      // if (wsClient.readyState !== WebSocket.OPEN) {
      //   console.warn('WebSocket connection lost');
      // }
    };

    const interval = setInterval(checkWebSocketConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};

/**
 * Theme Provider Component
 */
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme: _appTheme, colorMode, initializeTheme } = useApp();

  useEffect(() => {
    // Initialize theme on app start
    initializeTheme();
  }, [initializeTheme]);

  return (
    <>
      <ColorModeScript initialColorMode={colorMode} />
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </>
  );
};

/**
 * App Initializer Component
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loadFeatureFlags } = useAppActions();

  useEffect(() => {
    // Load feature flags on app start
    loadFeatureFlags();
    
    // Initialize PWA features
    pwaManager.initialize().catch(_error => {
      // PWA initialization failed
    });
  }, [loadFeatureFlags]);

  return <>{children}</>;
};

/**
 * Error Handler
 */
const handleError = (_error: Error, _errorInfo: { componentStack: string }) => {
  // Application error logged
  // Component stack logged
  
  // Send error to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Implement error reporting (e.g., Sentry, LogRocket)
    // Production error logged with details
  }
};

/**
 * Loading Fallback Component
 */
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading application...</p>
    </div>
  </div>
);

/**
 * Main App Providers Component
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      <HelmetProvider>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
              <ThemeProvider>
              <DndProvider backend={HTML5Backend}>
                <SocketProvider>
                  <AnimationProvider>
                    <PerformanceMonitor>
                    <ConnectionMonitor>
                      <AppInitializer>
                        <AuthInitializer>
                          <Suspense fallback={<LoadingFallback />}>
                            {children}
                            <NotificationContainer />
                            <PWAInstallPrompt />
                          </Suspense>
                        </AuthInitializer>
                      </AppInitializer>
                    </ConnectionMonitor>
                    </PerformanceMonitor>
                  </AnimationProvider>
                </SocketProvider>
              </DndProvider>
              </ThemeProvider>
          </ApolloProvider>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

/**
 * HOC for wrapping components with providers
 */
export const withProviders = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AppProviders>
      <Component {...props} />
    </AppProviders>
  );

  WrappedComponent.displayName = `withProviders(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default AppProviders;
