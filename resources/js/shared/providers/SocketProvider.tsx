/**
 * Socket.IO Provider
 * Manages Socket.IO connection and provides real-time context
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketClient, SocketConfig } from '../services/socket/socketManager';
import { useAuth, useAppActions } from '../hooks/useRematchStore';

// Types
interface SocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  socketId?: string;
  connectionError?: string;
  reconnectAttempts: number;
  
  // Connection methods
  connect: () => void;
  disconnect: () => void;
  
  // Channel methods
  joinTenantChannel: (tenantId: string) => void;
  leaveTenantChannel: (tenantId: string) => void;
  joinUserChannel: (userId: string) => void;
  joinPresenceChannel: (tenantId: string, userId: string) => void;
  
  // Utility methods
  emitTyping: (location: string, tenantId: string) => void;
}

interface SocketProviderProps {
  children: React.ReactNode;
  config?: Partial<SocketConfig>;
}

// Create context
const SocketContext = createContext<SocketContextType | null>(null);

// Default configuration
const defaultConfig: SocketConfig = {
  host: process.env.VITE_SOCKET_HOST || 'http://localhost:6001',
  transports: ['websocket', 'polling'],
  autoConnect: false, // We'll connect manually after authentication
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const { user, currentTenant, token, isAuthenticated } = useAuth();
  const { showError, showSuccess, showInfo } = useAppActions();
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketId, setSocketId] = useState<string>();
  const [connectionError, setConnectionError] = useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());

  // Merge configuration
  const socketConfig: SocketConfig = {
    ...defaultConfig,
    ...config,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'X-Tenant-ID': currentTenant?.id,
      },
    },
  };

  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Skipping socket initialization - not authenticated');
      return;
    }

    console.log('🚀 Initializing Socket.IO connection...');
    socketClient.initialize(socketConfig);

    // Setup event listeners
    socketClient.on('socket.connected', (data) => {
      console.log('✅ Socket connected:', data.socketId);
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(data.socketId);
      setConnectionError(undefined);
      setReconnectAttempts(0);
      
      showSuccess('Real-time connection established', 'Connected');
    });

    socketClient.on('socket.disconnected', (data) => {
      console.log('❌ Socket disconnected:', data.reason);
      setIsConnected(false);
      setSocketId(undefined);
      
      if (data.reason !== 'io client disconnect') {
        showError('Real-time connection lost', 'Disconnected');
      }
    });

    socketClient.on('socket.reconnecting', (data) => {
      console.log('🔄 Socket reconnecting, attempt:', data.attempt);
      setIsConnecting(true);
      setReconnectAttempts(data.attempt);
      
      if (data.attempt === 1) {
        showInfo('Reconnecting to real-time services...', 'Reconnecting');
      }
    });

    socketClient.on('socket.reconnected', (data) => {
      console.log('✅ Socket reconnected after', data.attempts, 'attempts');
      setIsConnected(true);
      setIsConnecting(false);
      setReconnectAttempts(0);
      
      showSuccess('Real-time connection restored', 'Reconnected');
      
      // Rejoin channels after reconnection
      rejoinChannels();
    });

    socketClient.on('socket.error', (data) => {
      console.error('🔥 Socket error:', data.error);
      setIsConnecting(false);
      setConnectionError(data.error);
      
      showError(data.error, 'Connection Error');
    });

    socketClient.on('socket.authenticated', (data) => {
      console.log('🔐 Socket authenticated:', data);
      
      // Auto-join user and tenant channels after authentication
      if (user?.id) {
        joinUserChannel(user.id);
      }
      
      if (currentTenant?.id) {
        joinTenantChannel(currentTenant.id);
        
        if (user?.id) {
          joinPresenceChannel(currentTenant.id, user.id);
        }
      }
      
      // Subscribe to system events
      socketClient.subscribeToSystemEvents();
    });

    socketClient.on('socket.unauthorized', (data) => {
      console.error('🚫 Socket unauthorized:', data.error);
      setConnectionError('Authentication failed');
      
      showError('Real-time authentication failed', 'Unauthorized');
    });

  }, [isAuthenticated, token, currentTenant?.id, user?.id, showError, showSuccess, showInfo]);

  /**
   * Rejoin channels after reconnection
   */
  const rejoinChannels = useCallback(() => {
    if (user?.id) {
      joinUserChannel(user.id);
    }
    
    if (currentTenant?.id) {
      joinTenantChannel(currentTenant.id);
      
      if (user?.id) {
        joinPresenceChannel(currentTenant.id, user.id);
      }
    }
  }, [user?.id, currentTenant?.id]);

  /**
   * Connect to Socket.IO
   */
  const connect = useCallback(() => {
    if (!isAuthenticated) {
      console.log('🔐 Cannot connect - not authenticated');
      return;
    }

    setIsConnecting(true);
    setConnectionError(undefined);
    
    // Update auth headers before connecting
    socketClient.updateAuth(socketConfig.auth);
    socketClient.connect();
  }, [isAuthenticated, socketConfig.auth]);

  /**
   * Disconnect from Socket.IO
   */
  const disconnect = useCallback(() => {
    setIsConnecting(false);
    setIsConnected(false);
    setSocketId(undefined);
    setJoinedChannels(new Set());
    
    socketClient.disconnect();
  }, []);

  /**
   * Join tenant channel
   */
  const joinTenantChannel = useCallback((tenantId: string) => {
    if (!isConnected) {
      console.log('⚠️ Cannot join tenant channel - not connected');
      return;
    }

    console.log('🏢 Joining tenant channel:', tenantId);
    socketClient.joinTenantChannel(tenantId);
    setJoinedChannels(prev => new Set(prev).add(`tenant.${tenantId}`));
  }, [isConnected]);

  /**
   * Leave tenant channel
   */
  const leaveTenantChannel = useCallback((tenantId: string) => {
    console.log('🏢 Leaving tenant channel:', tenantId);
    socketClient.leaveTenantChannel(tenantId);
    setJoinedChannels(prev => {
      const newSet = new Set(prev);
      newSet.delete(`tenant.${tenantId}`);
      return newSet;
    });
  }, []);

  /**
   * Join user channel
   */
  const joinUserChannel = useCallback((userId: string) => {
    if (!isConnected) {
      console.log('⚠️ Cannot join user channel - not connected');
      return;
    }

    console.log('👤 Joining user channel:', userId);
    socketClient.joinUserChannel(userId);
    setJoinedChannels(prev => new Set(prev).add(`user.${userId}`));
  }, [isConnected]);

  /**
   * Join presence channel
   */
  const joinPresenceChannel = useCallback((tenantId: string, userId: string) => {
    if (!isConnected) {
      console.log('⚠️ Cannot join presence channel - not connected');
      return;
    }

    console.log('👥 Joining presence channel:', tenantId, userId);
    socketClient.joinPresenceChannel(tenantId, userId);
    setJoinedChannels(prev => new Set(prev).add(`presence.tenant.${tenantId}`));
  }, [isConnected]);

  /**
   * Emit typing indicator
   */
  const emitTyping = useCallback((location: string, tenantId: string) => {
    if (isConnected) {
      socketClient.emitTyping(location, tenantId);
    }
  }, [isConnected]);

  // Initialize socket when authentication changes
  useEffect(() => {
    if (isAuthenticated && token && !socketClient.connected) {
      initializeSocket();
      
      // Auto-connect after initialization
      setTimeout(() => {
        connect();
      }, 100);
    } else if (!isAuthenticated && socketClient.connected) {
      disconnect();
    }
  }, [isAuthenticated, token, initializeSocket, connect, disconnect]);

  // Handle tenant switching
  useEffect(() => {
    if (isConnected && currentTenant?.id) {
      // Leave previous tenant channels and join new ones
      joinedChannels.forEach(channel => {
        if (channel.startsWith('tenant.') || channel.startsWith('presence.tenant.')) {
          const [, , oldTenantId] = channel.split('.');
          if (oldTenantId !== currentTenant.id) {
            if (channel.startsWith('tenant.')) {
              leaveTenantChannel(oldTenantId);
            }
          }
        }
      });

      // Join new tenant channels
      joinTenantChannel(currentTenant.id);
      
      if (user?.id) {
        joinPresenceChannel(currentTenant.id, user.id);
      }
    }
  }, [currentTenant?.id, isConnected, user?.id, joinedChannels, joinTenantChannel, leaveTenantChannel, joinPresenceChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const contextValue: SocketContextType = {
    isConnected,
    isConnecting,
    socketId,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    joinTenantChannel,
    leaveTenantChannel,
    joinUserChannel,
    joinPresenceChannel,
    emitTyping,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook to use Socket.IO context
 */
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketProvider;
