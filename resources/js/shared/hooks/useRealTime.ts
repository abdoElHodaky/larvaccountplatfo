/**
 * Real-Time Hooks using Socket.IO
 * Custom hooks for real-time features with Socket.IO integration
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { socketClient } from '../services/socket/socket-GETDASHBOARDMETRICS';
import { useSocket } from '../providers/SocketProvider';
import { useAuth, useAppActions } from './useRematchStore';

// Types
interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId: string;
  createdAt: string;
}

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface UserPresence {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface TypingIndicator {
  userId: string;
  location: string;
  timestamp: string;
}

/**
 * Hook for real-time notifications
 */
export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const { showNotification } = useAppActions();
  const { isConnected } = useSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const handleNewNotification = (data: NotificationData) => {
      console.log('🔔 New notification:', data);
      
      // Add to notifications list
      setNotifications(prev => [data, ...prev]);
      
      // Show toast notification
      showNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        duration: 5000,
      });
    };

    const handleNotificationRead = (data: { notificationId: string; userId: string }) => {
      console.log('👁️ Notification read:', data);
      
      // Remove from notifications list
      setNotifications(prev => 
        prev.filter(notification => notification.id !== data.notificationId)
      );
    };

    // Subscribe to notification events
    socketClient.on('notification.new', handleNewNotification);
    socketClient.on('notification.read', handleNotificationRead);

    return () => {
      socketClient.off('notification.new', handleNewNotification);
      socketClient.off('notification.read', handleNotificationRead);
    };
  }, [isConnected, user?.id, showNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    // This would typically make an API call to mark as read
    // The server would then broadcast the notification.read event
    console.log('Marking notification as read:', notificationId);
  }, []);

  return {
    notifications,
    markAsRead,
  };
};

/**
 * Hook for real-time transaction updates
 */
export const useRealTimeTransactions = () => {
  const { currentTenant } = useAuth();
  // const { loadTransactions } = useFinancialActions(); // useFinancialActions not available
  const { showSuccess, showInfo } = useAppActions();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !currentTenant?.id) return;

    const handleTransactionCreated = (data: { transaction: TransactionData; tenantId: string }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('💰 Transaction created:', data.transaction);
        
        showSuccess(
          `New transaction: ${data.transaction.description}`,
          'Transaction Created'
        );
        
        // Refresh transactions list
        // loadTransactions(1); // Function not available
      }
    };

    const handleTransactionUpdated = (data: { transaction: TransactionData; tenantId: string }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('✏️ Transaction updated:', data.transaction);
        
        showInfo(
          `Transaction updated: ${data.transaction.description}`,
          'Transaction Updated'
        );
        
        // Refresh transactions list
        // loadTransactions(1); // Function not available
      }
    };

    const handleTransactionDeleted = (data: { transactionId: string; tenantId: string }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('🗑️ Transaction deleted:', data.transactionId);
        
        showInfo('Transaction deleted', 'Transaction Removed');
        
        // Refresh transactions list
        // loadTransactions(1); // Function not available
      }
    };

    // Subscribe to transaction events
    socketClient.on('transaction.created', handleTransactionCreated);
    socketClient.on('transaction.updated', handleTransactionUpdated);
    socketClient.on('transaction.deleted', handleTransactionDeleted);

    return () => {
      socketClient.off('transaction.created', handleTransactionCreated);
      socketClient.off('transaction.updated', handleTransactionUpdated);
      socketClient.off('transaction.deleted', handleTransactionDeleted);
    };
  }, [isConnected, currentTenant?.id, showSuccess, showInfo]);
};

/**
 * Hook for real-time account balance updates
 */
export const useRealTimeAccountBalances = () => {
  const { currentTenant } = useAuth();
  // const { loadAccounts } = useFinancialActions(); // useFinancialActions not available
  const { isConnected } = useSocket();
  const [balanceUpdates, setBalanceUpdates] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!isConnected || !currentTenant?.id) return;

    const handleBalanceUpdate = (data: { 
      accountId: string; 
      balance: number; 
      tenantId: string; 
    }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('💰 Account balance updated:', data);
        
        // Update local balance cache
        setBalanceUpdates(prev => new Map(prev).set(data.accountId, data.balance));
        
        // Refresh accounts data
        // loadAccounts(); // Function not available
      }
    };

    // Subscribe to balance update events
    socketClient.on('account.balance.updated', handleBalanceUpdate);

    return () => {
      socketClient.off('account.balance.updated', handleBalanceUpdate);
    };
  }, [isConnected, currentTenant?.id]);

  const getLatestBalance = useCallback((accountId: string): number | undefined => {
    return balanceUpdates.get(accountId);
  }, [balanceUpdates]);

  return {
    balanceUpdates,
    getLatestBalance,
  };
};

/**
 * Hook for user presence and collaboration
 */
export const useUserPresence = () => {
  const { currentTenant, user } = useAuth();
  const { isConnected, emitTyping } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isConnected || !currentTenant?.id) return;

    const handlePresenceHere = (data: { users: any[]; tenantId: string }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('👥 Users currently online:', data.users);
        
        const presenceData = data.users.map(user => ({
          userId: user.id,
          status: 'online' as const,
        }));
        
        setOnlineUsers(presenceData);
      }
    };

    const handleUserPresence = (data: UserPresence & { tenantId: string }) => {
      if (data.tenantId === currentTenant.id) {
        console.log('👤 User presence changed:', data);
        
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.status === 'online') {
            return [...filtered, { userId: data.userId, status: data.status }];
          }
          return filtered;
        });
      }
    };

    const handleUserTyping = (data: TypingIndicator & { tenantId: string }) => {
      if (data.tenantId === currentTenant.id && data.userId !== user?.id) {
        console.log('⌨️ User typing:', data);
        
        setTypingUsers(prev => {
          const filtered = prev.filter(t => 
            !(t.userId === data.userId && t.location === data.location)
          );
          return [...filtered, {
            userId: data.userId,
            location: data.location,
            timestamp: data.timestamp,
          }];
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => 
            prev.filter(t => 
              !(t.userId === data.userId && t.location === data.location)
            )
          );
        }, 3000);
      }
    };

    // Subscribe to presence events
    socketClient.on('presence.here', handlePresenceHere);
    socketClient.on('user.presence', handleUserPresence);
    socketClient.on('user.typing', handleUserTyping);

    return () => {
      socketClient.off('presence.here', handlePresenceHere);
      socketClient.off('user.presence', handleUserPresence);
      socketClient.off('user.typing', handleUserTyping);
    };
  }, [isConnected, currentTenant?.id, user?.id]);

  const startTyping = useCallback((location: string) => {
    if (!currentTenant?.id) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing event
    emitTyping(location, currentTenant.id);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      // Could emit a "stopped typing" event here if needed
    }, 2000);
  }, [currentTenant?.id, emitTyping]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.some(u => u.userId === userId && u.status === 'online');
  }, [onlineUsers]);

  const getUsersTypingAt = useCallback((location: string): TypingIndicator[] => {
    return typingUsers.filter(t => t.location === location);
  }, [typingUsers]);

  return {
    onlineUsers,
    typingUsers,
    startTyping,
    isUserOnline,
    getUsersTypingAt,
  };
};

/**
 * Hook for system-wide real-time events
 */
export const useSystemEvents = () => {
  const { showWarning, showInfo } = useAppActions();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleMaintenanceScheduled = (data: { message: string; scheduledAt: string }) => {
      console.log('🔧 Maintenance scheduled:', data);
      
      showWarning(
        `System maintenance scheduled for ${new Date(data.scheduledAt).toLocaleString()}`,
        'Maintenance Notice'
      );
    };

    const handleSystemUpdate = (data: { version: string; features: string[] }) => {
      console.log('🚀 System update available:', data);
      
      showInfo(
        `New version ${data.version} available with ${data.features.length} new features`,
        'System Update'
      );
    };

    // Subscribe to system events
    socketClient.on('system.maintenance', handleMaintenanceScheduled);
    socketClient.on('system.update', handleSystemUpdate);

    return () => {
      socketClient.off('system.maintenance', handleMaintenanceScheduled);
      socketClient.off('system.update', handleSystemUpdate);
    };
  }, [isConnected, showWarning, showInfo]);
};

/**
 * Hook for connection status monitoring
 */
export const useConnectionStatus = () => {
  const { isConnected, isConnecting, connectionError, reconnectAttempts } = useSocket();
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: string;
    event: 'connected' | 'disconnected' | 'error';
    details?: string;
  }>>([]);

  useEffect(() => {
    const addToHistory = (event: 'connected' | 'disconnected' | 'error', details?: string) => {
      setConnectionHistory(prev => [
        {
          timestamp: new Date().toISOString(),
          event,
          details,
        },
        ...prev.slice(0, 9), // Keep last 10 events
      ]);
    };

    if (isConnected) {
      addToHistory('connected');
    } else if (connectionError) {
      addToHistory('error', connectionError);
    } else if (!isConnecting) {
      addToHistory('disconnected');
    }
  }, [isConnected, isConnecting, connectionError]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    connectionHistory,
  };
};
