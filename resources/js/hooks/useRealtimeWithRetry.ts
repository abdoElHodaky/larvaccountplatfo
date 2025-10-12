import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealtimeConfig {
  maxRetries?: number;
  retryDelay?: number;
  reconnectOnError?: boolean;
}

interface RealtimeState {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  retryCount: number;
  transactions: any[];
  products: any[];
  metrics: any;
}

// Enhanced real-time hook with error handling and retry logic
export function useRealtimeWithRetry(
  organizationId: string, 
  config: RealtimeConfig = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    reconnectOnError = true
  } = config;

  const [state, setState] = useState<RealtimeState>({
    socket: null,
    connected: false,
    error: null,
    retryCount: 0,
    transactions: [],
    products: [],
    metrics: {}
  });

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setState(prev => ({ ...prev, error: 'No authentication token found' }));
        return;
      }

      const socketInstance = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080', {
        auth: {
          token,
          organizationId
        },
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true
      });

      // Connection success
      socketInstance.on('connect', () => {
        console.log('✅ WebSocket connected');
        setState(prev => ({
          ...prev,
          connected: true,
          error: null,
          retryCount: 0,
          socket: socketInstance
        }));
      });

      // Connection error
      socketInstance.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setState(prev => ({
          ...prev,
          connected: false,
          error: error.message || 'Connection failed',
          socket: null
        }));

        // Retry logic
        if (reconnectOnError && state.retryCount < maxRetries) {
          setTimeout(() => {
            setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
            connect();
          }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff
        }
      });

      // Disconnection
      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          connected: false,
          socket: null,
          error: reason === 'io server disconnect' ? 'Server disconnected' : null
        }));

        // Auto-reconnect for certain disconnect reasons
        if (reason === 'ping timeout' || reason === 'transport close') {
          setTimeout(connect, retryDelay);
        }
      });

      // Real-time event listeners with error handling
      socketInstance.on('accounting:transaction_created', (data) => {
        try {
          console.log('💰 Transaction created:', data);
          setState(prev => ({
            ...prev,
            transactions: [data.transaction, ...prev.transactions.slice(0, 49)] // Keep last 50
          }));
        } catch (error) {
          console.error('Error handling transaction_created:', error);
        }
      });

      socketInstance.on('accounting:transaction_updated', (data) => {
        try {
          console.log('📝 Transaction updated:', data);
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => 
              t.id === data.transaction.id ? data.transaction : t
            )
          }));
        } catch (error) {
          console.error('Error handling transaction_updated:', error);
        }
      });

      socketInstance.on('inventory:stock_updated', (data) => {
        try {
          console.log('📦 Stock updated:', data);
          setState(prev => ({
            ...prev,
            products: prev.products.map(p => 
              p.id === data.product.id ? data.product : p
            )
          }));
        } catch (error) {
          console.error('Error handling stock_updated:', error);
        }
      });

      socketInstance.on('dashboard:metrics_updated', (data) => {
        try {
          console.log('📊 Metrics updated:', data);
          setState(prev => ({
            ...prev,
            metrics: { ...prev.metrics, ...data.metrics }
          }));
        } catch (error) {
          console.error('Error handling metrics_updated:', error);
        }
      });

      // Generic error handler
      socketInstance.on('error', (error) => {
        console.error('🚨 WebSocket error:', error);
        setState(prev => ({ ...prev, error: error.message || 'Unknown error' }));
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Initialization failed' 
      }));
    }
  }, [organizationId, maxRetries, retryDelay, reconnectOnError, state.retryCount]);

  // Manual retry function
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null, retryCount: 0 }));
    connect();
  }, [connect]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.disconnect();
      setState(prev => ({ 
        ...prev, 
        socket: null, 
        connected: false, 
        error: null 
      }));
    }
  }, [state.socket]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [organizationId]);

  return {
    ...state,
    retry,
    disconnect,
    isRetrying: state.retryCount > 0 && state.retryCount < maxRetries
  };
}

// Simplified hooks using the enhanced version
export function useRealtimeTransactionsWithRetry(organizationId: string) {
  const { transactions, connected, error, retry, isRetrying } = useRealtimeWithRetry(organizationId);
  return { transactions, connected, error, retry, isRetrying };
}

export function useRealtimeDashboardWithRetry(organizationId: string) {
  const { metrics, connected, error, retry, isRetrying } = useRealtimeWithRetry(organizationId);
  return { metrics, connected, error, retry, isRetrying };
}
