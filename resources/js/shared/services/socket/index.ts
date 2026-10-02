// Socket Service - Re-export socket modules
// Export from socketClient first, then socketManager to avoid conflicts
export * from './socketClient';
export { socketManager } from './socketManager';
// Re-export types from socketManager
export type { SocketEventCallback, RoomMessage, PrivateMessage } from './socketManager';