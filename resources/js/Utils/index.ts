/**
 * Utilities Index
 * Performance-optimized utility functions and classes
 */

// PWA Utilities
export {
  PWAManager,
  pwaManager,
  usePWA,
  type PWAInstallPrompt,
  type PWACapabilities,
} from './pwa';

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

// Default exports
export { default as PWAManager } from './pwa';
export { default as WebSocketManager } from './websocket';
export { default as GraphQLClient } from './graphql';
export { default as PerformanceMonitor } from './performance';
