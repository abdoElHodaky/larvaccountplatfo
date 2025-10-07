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

// Default exports
export { default as PWAManager } from './pwa';
export { default as WebSocketManager } from './websocket';
