/**
 * Socket.IO React Hooks
 * Provides React hooks for real-time Socket.IO functionality
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '../services/socket/socketManager';
import { AllSocketEvents, RoomNames } from '../services/socket/eventTypes';

export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  socketId?: string;
  reconnectAttempts: number;
}

export interface SocketHookReturn extends SocketState {
  emit: (event: string, data?: any) => void;
  on: <K extends keyof AllSocketEvents>(
    event: K,
    callback: AllSocketEvents[K]
  ) => () => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Main Socket.IO hook
 */
export function useSocket(): SocketHookReturn {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Connect to socket
  const connect = useCallback(async () => {
    if (stateRef.current.isConnected || stateRef.current.isConnecting) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await socketManager.connect(token);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        socketId: socketManager.socketId,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, []);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: null
    }));
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    socketManager.emit(event, data);
  }, []);

  // Listen for events
  const on = useCallback(<K extends keyof AllSocketEvents>(
    event: K,
    callback: AllSocketEvents[K]
  ) => {
    return socketManager.on(event as string, callback as any);
  }, []);

  // Remove event listeners
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketManager.off(event, callback);
  }, []);

  // Join room
  const joinRoom = useCallback((room: string) => {
    socketManager.joinRoom(room);
  }, []);

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    socketManager.leaveRoom(room);
  }, []);

  // Setup connection event listeners
  useEffect(() => {
    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        socketId: socketManager.socketId,
        error: null,
        reconnectAttempts: 0
      }));
    };

    const handleDisconnect = (reason: string) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        socketId: undefined,
        error: `Disconnected: ${reason}`
      }));
    };

    const handleConnectError = (error: Error) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message
      }));
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      setState(prev => ({
        ...prev,
        reconnectAttempts: attemptNumber,
        isConnecting: true
      }));
    };

    const unsubscribeConnect = socketManager.on('connect', handleConnect);
    const unsubscribeDisconnect = socketManager.on('disconnect', handleDisconnect);
    const unsubscribeConnectError = socketManager.on('connect_error', handleConnectError);
    const unsubscribeReconnectAttempt = socketManager.on('reconnect_attempt', handleReconnectAttempt);

    // Auto-connect if token is available
    const token = localStorage.getItem('auth_token');
    if (token && !socketManager.isConnected) {
      connect();
    }

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeConnectError();
      unsubscribeReconnectAttempt();
    };
  }, [connect]);

  return {
    ...state,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    connect,
    disconnect
  };
}

/**
 * Hook for dashboard real-time updates
 */
export function useRealtimeDashboard(organizationId: string) {
  const socket = useSocket();
  const [dashboardData, setDashboardData] = useState<{
    metrics?: any;
    widgets?: any[];
    lastUpdated?: string;
  }>({});

  useEffect(() => {
    if (!socket.isConnected || !organizationId) return;

    const roomName = RoomNames.dashboard(organizationId);
    socket.joinRoom(roomName);

    // Listen for dashboard events
    const unsubscribeMetrics = socket.on('dashboard:metrics_updated', (data) => {
      if (data.organizationId === organizationId) {
        setDashboardData(prev => ({
          ...prev,
          metrics: data.metrics,
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeWidget = socket.on('dashboard:widget_updated', (data) => {
      if (data.organizationId === organizationId) {
        setDashboardData(prev => ({
          ...prev,
          widgets: prev.widgets?.map(w => 
            w.id === data.widgetId ? { ...w, ...data.widget } : w
          ) || [data.widget],
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeWidgetAdded = socket.on('dashboard:widget_added', (data) => {
      if (data.organizationId === organizationId) {
        setDashboardData(prev => ({
          ...prev,
          widgets: [...(prev.widgets || []), data.widget],
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeWidgetRemoved = socket.on('dashboard:widget_removed', (data) => {
      if (data.organizationId === organizationId) {
        setDashboardData(prev => ({
          ...prev,
          widgets: prev.widgets?.filter(w => w.id !== data.widgetId) || [],
          lastUpdated: data.timestamp
        }));
      }
    });

    return () => {
      socket.leaveRoom(roomName);
      unsubscribeMetrics();
      unsubscribeWidget();
      unsubscribeWidgetAdded();
      unsubscribeWidgetRemoved();
    };
  }, [socket.isConnected, organizationId, socket]);

  return {
    ...dashboardData,
    isConnected: socket.isConnected,
    error: socket.error
  };
}

/**
 * Hook for accounting real-time updates
 */
export function useRealtimeAccounting(organizationId: string) {
  const socket = useSocket();
  const [accountingData, setAccountingData] = useState<{
    transactions?: any[];
    balances?: any[];
    lastUpdated?: string;
  }>({});

  useEffect(() => {
    if (!socket.isConnected || !organizationId) return;

    const roomName = RoomNames.accounting(organizationId);
    socket.joinRoom(roomName);

    // Listen for accounting events
    const unsubscribeTransactionCreated = socket.on('accounting:transaction_created', (data) => {
      if (data.organizationId === organizationId) {
        setAccountingData(prev => ({
          ...prev,
          transactions: [data.transaction, ...(prev.transactions || [])],
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeTransactionUpdated = socket.on('accounting:transaction_updated', (data) => {
      if (data.organizationId === organizationId) {
        setAccountingData(prev => ({
          ...prev,
          transactions: prev.transactions?.map(t => 
            t.id === data.transaction.id ? { ...t, ...data.transaction } : t
          ) || [],
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeBalanceUpdated = socket.on('accounting:account_balance_updated', (data) => {
      if (data.organizationId === organizationId) {
        setAccountingData(prev => ({
          ...prev,
          balances: prev.balances?.map(b => 
            b.id === data.account.id ? { ...b, ...data.account } : b
          ) || [data.account],
          lastUpdated: data.timestamp
        }));
      }
    });

    return () => {
      socket.leaveRoom(roomName);
      unsubscribeTransactionCreated();
      unsubscribeTransactionUpdated();
      unsubscribeBalanceUpdated();
    };
  }, [socket.isConnected, organizationId, socket]);

  return {
    ...accountingData,
    isConnected: socket.isConnected,
    error: socket.error
  };
}

/**
 * Hook for inventory real-time updates
 */
export function useRealtimeInventory(organizationId: string) {
  const socket = useSocket();
  const [inventoryData, setInventoryData] = useState<{
    stockUpdates?: any[];
    lowStockAlerts?: any[];
    lastUpdated?: string;
  }>({});

  useEffect(() => {
    if (!socket.isConnected || !organizationId) return;

    const roomName = RoomNames.inventory(organizationId);
    socket.joinRoom(roomName);

    // Listen for inventory events
    const unsubscribeStockUpdated = socket.on('inventory:stock_updated', (data) => {
      if (data.organizationId === organizationId) {
        setInventoryData(prev => ({
          ...prev,
          stockUpdates: [data, ...(prev.stockUpdates || [])].slice(0, 50), // Keep last 50 updates
          lastUpdated: data.timestamp
        }));
      }
    });

    const unsubscribeLowStockAlert = socket.on('inventory:low_stock_alert', (data) => {
      if (data.organizationId === organizationId) {
        setInventoryData(prev => ({
          ...prev,
          lowStockAlerts: [data, ...(prev.lowStockAlerts || [])],
          lastUpdated: data.timestamp
        }));
      }
    });

    return () => {
      socket.leaveRoom(roomName);
      unsubscribeStockUpdated();
      unsubscribeLowStockAlert();
    };
  }, [socket.isConnected, organizationId, socket]);

  return {
    ...inventoryData,
    isConnected: socket.isConnected,
    error: socket.error
  };
}

/**
 * Hook for notifications
 */
export function useRealtimeNotifications(userId: string) {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!socket.isConnected || !userId) return;

    const roomName = RoomNames.user(userId);
    socket.joinRoom(roomName);

    // Listen for notification events
    const unsubscribeNew = socket.on('notification:new', (data) => {
      if (data.userId === userId) {
        setNotifications(prev => [data, ...prev]);
      }
    });

    const unsubscribeRead = socket.on('notification:read', (data) => {
      if (data.userId === userId) {
        setNotifications(prev => 
          prev.map(n => n.id === data.notificationId ? { ...n, read: true } : n)
        );
      }
    });

    const unsubscribeDismissed = socket.on('notification:dismissed', (data) => {
      if (data.userId === userId) {
        setNotifications(prev => 
          prev.filter(n => n.id !== data.notificationId)
        );
      }
    });

    return () => {
      socket.leaveRoom(roomName);
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeDismissed();
    };
  }, [socket.isConnected, userId, socket]);

  const markAsRead = useCallback((notificationId: string) => {
    socket.emit('notification:mark_read', { notificationId });
  }, [socket]);

  const dismiss = useCallback((notificationId: string) => {
    socket.emit('notification:dismiss', { notificationId });
  }, [socket]);

  return {
    notifications,
    markAsRead,
    dismiss,
    isConnected: socket.isConnected,
    error: socket.error
  };
}

