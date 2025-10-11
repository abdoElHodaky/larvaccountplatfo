import { useEffect, useCallback, useRef, useState } from 'react';
import { socketManager, SocketEventCallback } from '../services/socket/socketManager';
import { getAuthToken, getCurrentOrganizationId } from '../services/alova/alova.config';

/**
 * Hook for managing Socket.io connection and events
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const socketRef = useRef(socketManager);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    // Connect to socket
    socketManager.connect(token).then(() => {
      setIsConnected(true);
      setSocketId(socketManager.socketId);
    }).catch(error => {
      console.error('Socket connection failed:', error);
      setIsConnected(false);
    });

    // Listen for connection status changes
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socketManager.socketId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(undefined);
    };

    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);

    // Cleanup on unmount
    return () => {
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketManager.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: SocketEventCallback) => {
    return socketManager.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: SocketEventCallback) => {
    socketManager.off(event, callback);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketManager.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketManager.leaveRoom(room);
  }, []);

  const sendToRoom = useCallback((room: string, event: string, data?: any) => {
    socketManager.sendToRoom(room, event, data);
  }, []);

  const broadcastToOrganization = useCallback((event: string, data?: any) => {
    socketManager.broadcastToOrganization(event, data);
  }, []);

  const sendToUser = useCallback((userId: string, event: string, data?: any) => {
    socketManager.sendToUser(userId, event, data);
  }, []);

  return {
    isConnected,
    socketId,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendToRoom,
    broadcastToOrganization,
    sendToUser,
    stats: socketManager.getStats()
  };
}

/**
 * Hook for real-time dashboard updates
 */
export function useRealtimeDashboard(organizationId?: number) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const orgId = organizationId || getCurrentOrganizationId();

  useEffect(() => {
    if (!orgId || !isConnected) return;

    const room = `dashboard:${orgId}`;
    joinRoom(room);

    // Listen for dashboard metric updates
    const unsubscribeMetrics = on('dashboard:metrics_updated', (data) => {
      console.log('📊 Dashboard metrics updated:', data);
      setMetrics(prevMetrics => {
        const updatedMetrics = [...prevMetrics];
        const index = updatedMetrics.findIndex(m => m.id === data.id);
        
        if (index >= 0) {
          updatedMetrics[index] = { ...updatedMetrics[index], ...data };
        } else {
          updatedMetrics.push(data);
        }
        
        return updatedMetrics;
      });
      setLastUpdate(new Date());
    });

    // Listen for widget updates
    const unsubscribeWidgets = on('dashboard:widget_updated', (data) => {
      console.log('🎛️ Dashboard widget updated:', data);
      setWidgets(prevWidgets => {
        const updatedWidgets = [...prevWidgets];
        const index = updatedWidgets.findIndex(w => w.id === data.id);
        
        if (index >= 0) {
          updatedWidgets[index] = { ...updatedWidgets[index], ...data };
        } else {
          updatedWidgets.push(data);
        }
        
        return updatedWidgets;
      });
      setLastUpdate(new Date());
    });

    // Listen for widget position updates
    const unsubscribePositions = on('dashboard:widget_position_updated', (data) => {
      console.log('📍 Widget position updated:', data);
      setWidgets(prevWidgets => 
        prevWidgets.map(widget => 
          widget.id === data.widgetId 
            ? { ...widget, position: data.position }
            : widget
        )
      );
    });

    // Listen for new widgets added
    const unsubscribeNewWidget = on('dashboard:widget_added', (data) => {
      console.log('➕ New widget added:', data);
      setWidgets(prevWidgets => [...prevWidgets, data]);
      setLastUpdate(new Date());
    });

    // Listen for widgets removed
    const unsubscribeRemovedWidget = on('dashboard:widget_removed', (data) => {
      console.log('➖ Widget removed:', data);
      setWidgets(prevWidgets => 
        prevWidgets.filter(widget => widget.id !== data.widgetId)
      );
      setLastUpdate(new Date());
    });

    return () => {
      leaveRoom(room);
      unsubscribeMetrics();
      unsubscribeWidgets();
      unsubscribePositions();
      unsubscribeNewWidget();
      unsubscribeRemovedWidget();
    };
  }, [orgId, isConnected, on, joinRoom, leaveRoom]);

  return {
    metrics,
    widgets,
    lastUpdate,
    isConnected
  };
}

/**
 * Hook for real-time accounting updates
 */
export function useRealtimeAccounting(organizationId?: number) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const orgId = organizationId || getCurrentOrganizationId();

  useEffect(() => {
    if (!orgId || !isConnected) return;

    const room = `accounting:${orgId}`;
    joinRoom(room);

    // Listen for new transactions
    const unsubscribeTransactions = on('accounting:transaction_created', (data) => {
      console.log('💰 New transaction:', data);
      setTransactions(prevTransactions => [data, ...prevTransactions]);
      setLastUpdate(new Date());
    });

    // Listen for transaction updates
    const unsubscribeTransactionUpdates = on('accounting:transaction_updated', (data) => {
      console.log('💰 Transaction updated:', data);
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === data.id ? { ...transaction, ...data } : transaction
        )
      );
      setLastUpdate(new Date());
    });

    // Listen for account balance updates
    const unsubscribeAccountUpdates = on('accounting:account_balance_updated', (data) => {
      console.log('🏦 Account balance updated:', data);
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === data.accountId 
            ? { ...account, balance: data.balance }
            : account
        )
      );
      setLastUpdate(new Date());
    });

    return () => {
      leaveRoom(room);
      unsubscribeTransactions();
      unsubscribeTransactionUpdates();
      unsubscribeAccountUpdates();
    };
  }, [orgId, isConnected, on, joinRoom, leaveRoom]);

  return {
    transactions,
    accounts,
    lastUpdate,
    isConnected
  };
}

/**
 * Hook for real-time inventory updates
 */
export function useRealtimeInventory(organizationId?: number) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();
  const [products, setProducts] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const orgId = organizationId || getCurrentOrganizationId();

  useEffect(() => {
    if (!orgId || !isConnected) return;

    const room = `inventory:${orgId}`;
    joinRoom(room);

    // Listen for stock level updates
    const unsubscribeStockUpdates = on('inventory:stock_updated', (data) => {
      console.log('📦 Stock updated:', data);
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === data.productId 
            ? { ...product, stockLevel: data.stockLevel }
            : product
        )
      );
      setLastUpdate(new Date());
    });

    // Listen for new stock movements
    const unsubscribeMovements = on('inventory:movement_created', (data) => {
      console.log('📦 Stock movement:', data);
      setStockMovements(prevMovements => [data, ...prevMovements]);
      setLastUpdate(new Date());
    });

    // Listen for low stock alerts
    const unsubscribeLowStock = on('inventory:low_stock_alert', (data) => {
      console.log('⚠️ Low stock alert:', data);
      // Handle low stock notification
      setLastUpdate(new Date());
    });

    return () => {
      leaveRoom(room);
      unsubscribeStockUpdates();
      unsubscribeMovements();
      unsubscribeLowStock();
    };
  }, [orgId, isConnected, on, joinRoom, leaveRoom]);

  return {
    products,
    stockMovements,
    lastUpdate,
    isConnected
  };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(userId?: string) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !isConnected) return;

    const room = `user:${userId}`;
    joinRoom(room);

    // Listen for new notifications
    const unsubscribeNotifications = on('notification:new', (data) => {
      console.log('🔔 New notification:', data);
      setNotifications(prevNotifications => [data, ...prevNotifications]);
      setUnreadCount(prevCount => prevCount + 1);
    });

    // Listen for notification read status
    const unsubscribeRead = on('notification:read', (data) => {
      console.log('👁️ Notification read:', data);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === data.notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    });

    return () => {
      leaveRoom(room);
      unsubscribeNotifications();
      unsubscribeRead();
    };
  }, [userId, isConnected, on, joinRoom, leaveRoom]);

  const markAsRead = useCallback((notificationId: string) => {
    socketManager.emit('notification:mark_read', { notificationId });
  }, []);

  const markAllAsRead = useCallback(() => {
    socketManager.emit('notification:mark_all_read');
    setUnreadCount(0);
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected
  };
}
