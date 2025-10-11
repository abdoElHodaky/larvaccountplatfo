/**
 * Shared Utilities Index
 * Centralized exports for all utility functions and classes
 */

// Class name utilities
export { cn } from './cn';

// Formatting utilities
export * from './formatters';

// PWA Utilities
export { PWAManager, pwaManager, usePWA, type PWAInstallPrompt, type PWACapabilities } from './pwa';

// WebSocket Utilities
export {
    WebSocketManager,
    useWebSocket,
    useFinancialWebSocket,
    type WebSocketMessage,
    type WebSocketOptions,
    type WebSocketStatus,
    type WebSocketEventHandler,
    type WebSocketStatusHandler,
} from './websocket';

// GraphQL Utilities
export {
    GraphQLClient,
    useGraphQL,
    useFinancialGraphQL,
    type GraphQLQuery,
    type GraphQLResponse,
    type GraphQLClientOptions,
    type CacheEntry,
    type BatchRequest,
} from './graphql';

// Performance Utilities
export {
    PerformanceMonitor,
    usePerformanceMonitor,
    useComponentPerformance,
    ReactPerformanceUtils,
    FinancialPerformanceUtils,
    type PerformanceMetric,
    type PerformanceReport,
    type PerformanceThresholds,
    debounce,
    throttle,
    memoize,
    deepEqual,
    shallowEqual,
} from './performance';

// Formatting utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

export const formatDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};

// Lazy Components & Service Worker
export * from './lazyComponents';
export * from './serviceWorker';

// Note: Default exports are already handled above in the named exports
