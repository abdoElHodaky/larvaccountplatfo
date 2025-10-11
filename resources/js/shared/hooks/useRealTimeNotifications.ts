/**
 * Real-Time Notifications Hook
 * Manages real-time notifications and alerts
 */

import { useEffect, useCallback, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useWebSocket } from '../components/realtime/WebSocketProvider';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
}

interface NotificationPreferences {
    transactionAlerts: boolean;
    accountAlerts: boolean;
    reportAlerts: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
}

interface UseRealTimeNotificationsOptions {
    tenantId?: string;
    userId?: string;
    preferences?: Partial<NotificationPreferences>;
    maxNotifications?: number;
    autoMarkAsRead?: boolean;
}

export const useRealTimeNotifications = (options: UseRealTimeNotificationsOptions = {}) => {
    const {
        tenantId,
        userId,
        preferences = {},
        maxNotifications = 50,
        autoMarkAsRead = false,
    } = options;

    const { subscribe, unsubscribe, emit, isConnected } = useWebSocket();
    const toast = useToast();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const defaultPreferences: NotificationPreferences = {
        transactionAlerts: true,
        accountAlerts: true,
        reportAlerts: true,
        systemAlerts: true,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true,
        ...preferences,
    };

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (defaultPreferences.soundEnabled) {
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(console.warn);
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        }
    }, [defaultPreferences.soundEnabled]);

    // Add notification to state
    const addNotification = useCallback(
        (notification: Notification) => {
            setNotifications((prev) => {
                const updated = [notification, ...prev].slice(0, maxNotifications);
                return updated;
            });

            if (!notification.read) {
                setUnreadCount((prev) => prev + 1);
            }

            // Show toast notification
            toast({
                title: notification.title,
                description: notification.message,
                status: notification.type,
                duration: notification.type === 'error' ? 8000 : 5000,
                isClosable: true,
                position: 'top-right',
            });

            // Play sound
            playNotificationSound();
        },
        [maxNotifications, toast, playNotificationSound]
    );

    // Mark notification as read
    const markAsRead = useCallback(
        (notificationId: string) => {
            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );

            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Emit to server
            if (isConnected) {
                emit('notification:read', { notificationId, tenantId, userId });
            }
        },
        [emit, isConnected, tenantId, userId]
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

        if (unreadIds.length === 0) return;

        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

        setUnreadCount(0);

        // Emit to server
        if (isConnected) {
            emit('notifications:mark-all-read', { tenantId, userId });
        }
    }, [notifications, emit, isConnected, tenantId, userId]);

    // Remove notification
    const removeNotification = useCallback(
        (notificationId: string) => {
            setNotifications((prev) => {
                const notification = prev.find((n) => n.id === notificationId);
                if (notification && !notification.read) {
                    setUnreadCount((count) => Math.max(0, count - 1));
                }
                return prev.filter((n) => n.id !== notificationId);
            });

            // Emit to server
            if (isConnected) {
                emit('notification:remove', { notificationId, tenantId, userId });
            }
        },
        [emit, isConnected, tenantId, userId]
    );

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);

        // Emit to server
        if (isConnected) {
            emit('notifications:clear-all', { tenantId, userId });
        }
    }, [emit, isConnected, tenantId, userId]);

    // Load initial notifications
    const loadNotifications = useCallback(async () => {
        if (!isConnected || !tenantId) return;

        setIsLoading(true);

        try {
            emit('notifications:load', {
                tenantId,
                userId,
                limit: maxNotifications,
            });
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [emit, isConnected, tenantId, userId, maxNotifications]);

    // Update preferences
    const updatePreferences = useCallback(
        (newPreferences: Partial<NotificationPreferences>) => {
            if (!isConnected || !tenantId) return;

            emit('notifications:update-preferences', {
                tenantId,
                userId,
                preferences: { ...defaultPreferences, ...newPreferences },
            });
        },
        [emit, isConnected, tenantId, userId, defaultPreferences]
    );

    // Set up real-time subscriptions
    useEffect(() => {
        if (!isConnected || !tenantId) return;

        const subscriptions = [
            // New notification
            subscribe('notification:new', (data: any) => {
                const notification: Notification = {
                    id: data.id,
                    type: data.type || 'info',
                    title: data.title,
                    message: data.message,
                    timestamp: new Date(data.timestamp),
                    read: false,
                    actionUrl: data.actionUrl,
                    actionLabel: data.actionLabel,
                    metadata: data.metadata,
                };

                // Check preferences before showing
                const shouldShow =
                    (data.category === 'transaction' && defaultPreferences.transactionAlerts) ||
                    (data.category === 'account' && defaultPreferences.accountAlerts) ||
                    (data.category === 'report' && defaultPreferences.reportAlerts) ||
                    (data.category === 'system' && defaultPreferences.systemAlerts) ||
                    !data.category;

                if (shouldShow) {
                    addNotification(notification);
                }
            }),

            // Notification marked as read (from another device)
            subscribe('notification:read', (data: any) => {
                if (data.userId === userId) {
                    markAsRead(data.notificationId);
                }
            }),

            // All notifications marked as read (from another device)
            subscribe('notifications:all-read', (data: any) => {
                if (data.userId === userId) {
                    markAllAsRead();
                }
            }),

            // Notification removed (from another device)
            subscribe('notification:removed', (data: any) => {
                if (data.userId === userId) {
                    removeNotification(data.notificationId);
                }
            }),

            // Initial notifications loaded
            subscribe('notifications:loaded', (data: any) => {
                const loadedNotifications: Notification[] = data.notifications.map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    timestamp: new Date(n.timestamp),
                    read: n.read,
                    actionUrl: n.actionUrl,
                    actionLabel: n.actionLabel,
                    metadata: n.metadata,
                }));

                setNotifications(loadedNotifications);
                setUnreadCount(loadedNotifications.filter((n) => !n.read).length);
                setIsLoading(false);
            }),

            // Transaction alerts
            subscribe(`tenant.${tenantId}.transaction.created`, (data: any) => {
                if (defaultPreferences.transactionAlerts) {
                    addNotification({
                        id: `transaction-${data.id}`,
                        type: 'info',
                        title: 'New Transaction',
                        message: `${data.description}: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                        }).format(data.amount)}`,
                        timestamp: new Date(),
                        read: false,
                        actionUrl: `/transactions/${data.id}`,
                        actionLabel: 'View Transaction',
                        metadata: { transactionId: data.id },
                    });
                }
            }),

            // Account alerts
            subscribe(`tenant.${tenantId}.account.balance-warning`, (data: any) => {
                if (defaultPreferences.accountAlerts) {
                    addNotification({
                        id: `account-warning-${data.accountId}`,
                        type: 'warning',
                        title: 'Account Balance Warning',
                        message: `${data.accountName} balance is ${data.status}`,
                        timestamp: new Date(),
                        read: false,
                        actionUrl: `/accounts/${data.accountId}`,
                        actionLabel: 'View Account',
                        metadata: { accountId: data.accountId },
                    });
                }
            }),

            // Report alerts
            subscribe(`tenant.${tenantId}.report.generated`, (data: any) => {
                if (defaultPreferences.reportAlerts) {
                    addNotification({
                        id: `report-${data.id}`,
                        type: 'success',
                        title: 'Report Ready',
                        message: `${data.name} has been generated`,
                        timestamp: new Date(),
                        read: false,
                        actionUrl: `/reports/${data.id}`,
                        actionLabel: 'View Report',
                        metadata: { reportId: data.id },
                    });
                }
            }),

            // System alerts
            subscribe('system:alert', (data: any) => {
                if (defaultPreferences.systemAlerts) {
                    addNotification({
                        id: `system-${Date.now()}`,
                        type: data.severity || 'info',
                        title: data.title || 'System Alert',
                        message: data.message,
                        timestamp: new Date(),
                        read: false,
                        metadata: data.metadata,
                    });
                }
            }),
        ];

        // Load initial notifications
        loadNotifications();

        return () => {
            subscriptions.forEach(unsubscribe);
        };
    }, [
        isConnected,
        tenantId,
        userId,
        subscribe,
        unsubscribe,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        loadNotifications,
        defaultPreferences,
    ]);

    // Auto-mark as read when viewed
    useEffect(() => {
        if (autoMarkAsRead && notifications.length > 0) {
            const unreadNotifications = notifications.filter((n) => !n.read);
            if (unreadNotifications.length > 0) {
                setTimeout(() => {
                    unreadNotifications.forEach((n) => markAsRead(n.id));
                }, 2000);
            }
        }
    }, [notifications, autoMarkAsRead, markAsRead]);

    return {
        notifications,
        unreadCount,
        isLoading,
        preferences: defaultPreferences,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        updatePreferences,
        loadNotifications,
    };
};

export default useRealTimeNotifications;
