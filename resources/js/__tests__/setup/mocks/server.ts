/**
 * MSW (Mock Service Worker) Server Setup
 * Phase 9: Testing Infrastructure
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

// Server lifecycle methods
export const startServer = () => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
};

export const stopServer = () => {
  server.close();
};

export const resetServer = () => {
  server.resetHandlers();
};

// Helper to add runtime handlers
export const addHandlers = (...newHandlers: any[]) => {
  server.use(...newHandlers);
};

// Export server instance for direct use
export default server;
