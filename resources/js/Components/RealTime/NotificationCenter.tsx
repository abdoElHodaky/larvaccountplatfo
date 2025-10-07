import React, { Fragment, memo, useMemo, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  Button,
  Divider,
  Avatar,
  Flex,
  Spacer,
  useToast,
} from '@chakra-ui/react';
import { useFinancialWebSocket } from '@/Utils/websocket';
import { useMemoizedCallback } from '@/Hooks';

/**
 * Performance-Optimized Real-time Notification Center
 * Handles real-time notifications with WebSocket integration
 */

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'report' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationCenterProps {
  tenantId?: string;
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
  showToasts?: boolean;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = memo(({
  tenantId,
  maxNotifications = 50,
  autoMarkAsRead = true,
  showToasts = true,
  className,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');

  // WebSocket connection
  const { status, connect, subscribeToNotifications } = useFinancialWebSocket(tenantId);

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((message) => {
      const notification: Notification = {
        id: message.id || `notif-${Date.now()}`,
        type: message.payload.type || 'info',
        title: message.payload.title,
        message: message.payload.message,
        timestamp: new Date(message.timestamp),
        read: false,
        actionUrl: message.payload.actionUrl,
        actionLabel: message.payload.actionLabel,
        metadata: message.payload.metadata,
        priority: message.payload.priority || 'medium',
      };

      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, maxNotifications);
        return updated;
      });

      // Show toast notification
      if (showToasts) {
        showToastNotification(notification);
      }
    });

    return unsubscribe;
  }, [subscribeToNotifications, maxNotifications, showToasts]);

  // Memoized unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Show toast notification
  const showToastNotification = useMemoizedCallback((notification: Notification) => {
    const status = notification.type === 'error' ? 'error' :
                  notification.type === 'warning' ? 'warning' :
                  notification.type === 'success' ? 'success' : 'info';

    toast({
      title: notification.title,
      description: notification.message,
      status,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      isClosable: true,
      position: 'top-right',
    });
  }, [toast]);

  // Mark notification as read
  const markAsRead = useMemoizedCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useMemoizedCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useMemoizedCallback(() => {
    setNotifications([]);
  }, []);

  // Handle notification click
  const handleNotificationClick = useMemoizedCallback((notification: Notification) => {
    if (autoMarkAsRead && !notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [autoMarkAsRead, markAsRead]);

  // Memoized notification icon
  const getNotificationIcon = useMemoizedCallback((type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V2H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
          </svg>
        );
      case 'report':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z" />
          </svg>
        );
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
        );
    }
  }, []);

  // Memoized notification color
  const getNotificationColor = useMemoizedCallback((type: Notification['type']) => {
    switch (type) {
      case 'transaction': return 'blue.500';
      case 'report': return 'purple.500';
      case 'success': return 'green.500';
      case 'warning': return 'orange.500';
      case 'error': return 'red.500';
      case 'system': return 'gray.500';
      default: return 'blue.500';
    }
  }, []);

  // Memoized notification list
  const notificationList = useMemo(() => (
    <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
      {notifications.length === 0 ? (
        <Box p={6} textAlign="center">
          <Text color="gray.500" fontSize="sm">
            No notifications yet
          </Text>
        </Box>
      ) : (
        <Fragment>
          {notifications.map((notification, index) => (
            <Fragment key={notification.id}>
              <Box
                p={3}
                bg={!notification.read ? unreadBg : 'transparent'}
                _hover={{ bg: hoverBg }}
                cursor="pointer"
                onClick={() => handleNotificationClick(notification)}
                transition="background-color 0.2s"
              >
                <HStack align="flex-start" spacing={3}>
                  {/* Icon */}
                  <Box
                    color={getNotificationColor(notification.type)}
                    mt={1}
                    flexShrink={0}
                  >
                    {getNotificationIcon(notification.type)}
                  </Box>

                  {/* Content */}
                  <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                    <HStack w="full" justify="space-between" align="flex-start">
                      <Text
                        fontSize="sm"
                        fontWeight={!notification.read ? 'semibold' : 'medium'}
                        noOfLines={1}
                        flex={1}
                      >
                        {notification.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500" flexShrink={0}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </HStack>
                    
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      noOfLines={2}
                      lineHeight="1.3"
                    >
                      {notification.message}
                    </Text>

                    {notification.actionLabel && (
                      <Text
                        fontSize="xs"
                        color="blue.500"
                        fontWeight="medium"
                        mt={1}
                      >
                        {notification.actionLabel} →
                      </Text>
                    )}
                  </VStack>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <Box
                      w={2}
                      h={2}
                      bg="blue.500"
                      borderRadius="full"
                      flexShrink={0}
                      mt={2}
                    />
                  )}
                </HStack>
              </Box>
              
              {index < notifications.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Fragment>
      )}
    </VStack>
  ), [
    notifications,
    unreadBg,
    hoverBg,
    handleNotificationClick,
    getNotificationColor,
    getNotificationIcon,
  ]);

  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Box position="relative" className={className}>
          <IconButton
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21" />
              </svg>
            }
            size="md"
            variant="ghost"
            aria-label="Notifications"
            position="relative"
          />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}

          {/* Connection status indicator */}
          <Box
            position="absolute"
            bottom="2px"
            right="2px"
            w="6px"
            h="6px"
            borderRadius="full"
            bg={status.connected ? 'green.400' : status.connecting ? 'yellow.400' : 'red.400'}
          />
        </Box>
      </PopoverTrigger>

      <PopoverContent w="380px" bg={bgColor} borderColor={borderColor}>
        <PopoverHeader borderBottomColor={borderColor}>
          <HStack justify="space-between" align="center">
            <Text fontWeight="semibold">Notifications</Text>
            <HStack spacing={2}>
              {unreadCount > 0 && (
                <Button size="xs" variant="ghost" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button size="xs" variant="ghost" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </HStack>
          </HStack>
        </PopoverHeader>

        <PopoverBody p={0}>
          {notificationList}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return timestamp.toLocaleDateString();
}

export default NotificationCenter;
