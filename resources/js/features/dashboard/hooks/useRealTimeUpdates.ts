/**
 * React Hook for Real-time Dashboard Updates
 * Provides easy-to-use React hooks for WebSocket integration
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { DashboardWebSocketHelpers, dashboardWebSocket } from '../services/websocketService';
import { log } from '../../../shared/utils/logger';

export interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  autoConnect?: boolean;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface RealTimeStatus {
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  error?: Error;
}

/**
 * Hook for managing real-time WebSocket connection
 */
export function useRealTimeConnection(options: UseRealTimeUpdatesOptions = {}) {
  const {
    enabled = true,
    autoConnect = true,
    onError,
    onConnectionChange,
  } = options;

  const [status, setStatus] = useState<RealTimeStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
  });

  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback(() => {
    const wsStatus = dashboardWebSocket.getStatus();
    setStatus(prev => {
      const newStatus = {
        connected: wsStatus.connected,
        connecting: wsStatus.connecting,
        reconnectAttempts: wsStatus.reconnectAttempts,
        error: prev.error,
      };

      // Notify connection change
      if (prev.connected !== newStatus.connected && onConnectionChange) {
        onConnectionChange(newStatus.connected);
      }

      return newStatus;
    });
  }, [onConnectionChange]);

  const connect = useCallback(async () => {
    if (!enabled) return;

    try {
      setStatus(prev => ({ ...prev, connecting: true, error: undefined }));
      await DashboardWebSocketHelpers.initializeDashboardWebSocket();
      updateStatus();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Connection failed');
      setStatus(prev => ({ ...prev, connecting: false, error: err }));
      if (onError) {
        onError(err);
      }
    }
  }, [enabled, onError, updateStatus]);

  const disconnect = useCallback(() => {
    DashboardWebSocketHelpers.cleanup();
    updateStatus();
  }, [updateStatus]);

  useEffect(() => {
    if (enabled && autoConnect) {
      connect();
    }

    // Start status monitoring
    statusCheckInterval.current = setInterval(updateStatus, 1000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (enabled && autoConnect) {
        disconnect();
      }
    };
  }, [enabled, autoConnect, connect, disconnect, updateStatus]);

  return {
    status,
    connect,
    disconnect,
    isConnected: status.connected,
    isConnecting: status.connecting,
  };
}

/**
 * Hook for subscribing to widget data updates
 */
export function useWidgetRealTimeUpdates(
  widgetId: number | null,
  onUpdate: (data: any) => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const subscriptionId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !widgetId) return;

    subscriptionId.current = DashboardWebSocketHelpers.subscribeToWidgetUpdates(
      widgetId,
      (data) => {
        log.info('Widget data updated', { widgetId, data }, 'useWidgetRealTimeUpdates');
        onUpdate(data);
      }
    );

    return () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [widgetId, onUpdate, enabled]);

  return {
    subscriptionId: subscriptionId.current,
    unsubscribe: () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    },
  };
}

/**
 * Hook for subscribing to dashboard layout changes
 */
export function useDashboardRealTimeUpdates(
  organizationId: number | null,
  userId: number | null,
  onUpdate: (data: any) => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const subscriptionId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId || !userId) return;

    subscriptionId.current = DashboardWebSocketHelpers.subscribeToDashboardChanges(
      organizationId,
      userId,
      (data) => {
        log.info('Dashboard updated', { organizationId, userId, data }, 'useDashboardRealTimeUpdates');
        onUpdate(data);
      }
    );

    return () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [organizationId, userId, onUpdate, enabled]);

  return {
    subscriptionId: subscriptionId.current,
    unsubscribe: () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    },
  };
}

/**
 * Hook for subscribing to widget configuration changes
 */
export function useWidgetConfigRealTimeUpdates(
  widgetId: number | null,
  onUpdate: (data: any) => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const subscriptionId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !widgetId) return;

    subscriptionId.current = DashboardWebSocketHelpers.subscribeToWidgetConfigChanges(
      widgetId,
      (data) => {
        log.info('Widget configuration updated', { widgetId, data }, 'useWidgetConfigRealTimeUpdates');
        onUpdate(data);
      }
    );

    return () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [widgetId, onUpdate, enabled]);

  return {
    subscriptionId: subscriptionId.current,
    unsubscribe: () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    },
  };
}

/**
 * Hook for subscribing to performance metrics updates
 */
export function usePerformanceRealTimeUpdates(
  organizationId: number | null,
  onUpdate: (data: any) => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const subscriptionId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) return;

    subscriptionId.current = DashboardWebSocketHelpers.subscribeToPerformanceUpdates(
      organizationId,
      (data) => {
        log.info('Performance metrics updated', { organizationId, data }, 'usePerformanceRealTimeUpdates');
        onUpdate(data);
      }
    );

    return () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [organizationId, onUpdate, enabled]);

  return {
    subscriptionId: subscriptionId.current,
    unsubscribe: () => {
      if (subscriptionId.current) {
        dashboardWebSocket.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    },
  };
}

/**
 * Comprehensive hook that combines multiple real-time subscriptions
 */
export function useComprehensiveRealTimeUpdates(
  organizationId: number | null,
  userId: number | null,
  widgetIds: number[],
  callbacks: {
    onDashboardUpdate?: (data: any) => void;
    onWidgetUpdate?: (widgetId: number, data: any) => void;
    onWidgetConfigUpdate?: (widgetId: number, data: any) => void;
    onPerformanceUpdate?: (data: any) => void;
  },
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const subscriptions = useRef<string[]>([]);

  // Dashboard updates
  useDashboardRealTimeUpdates(
    organizationId,
    userId,
    callbacks.onDashboardUpdate || (() => {}),
    { enabled: enabled && !!callbacks.onDashboardUpdate }
  );

  // Performance updates
  usePerformanceRealTimeUpdates(
    organizationId,
    callbacks.onPerformanceUpdate || (() => {}),
    { enabled: enabled && !!callbacks.onPerformanceUpdate }
  );

  // Widget updates
  useEffect(() => {
    if (!enabled || !callbacks.onWidgetUpdate) return;

    // Subscribe to each widget
    widgetIds.forEach(widgetId => {
      const subscriptionId = DashboardWebSocketHelpers.subscribeToWidgetUpdates(
        widgetId,
        (data) => callbacks.onWidgetUpdate!(widgetId, data)
      );
      subscriptions.current.push(subscriptionId);
    });

    return () => {
      subscriptions.current.forEach(id => dashboardWebSocket.unsubscribe(id));
      subscriptions.current = [];
    };
  }, [widgetIds, callbacks.onWidgetUpdate, enabled]);

  // Widget config updates
  useEffect(() => {
    if (!enabled || !callbacks.onWidgetConfigUpdate) return;

    // Subscribe to each widget's config changes
    widgetIds.forEach(widgetId => {
      const subscriptionId = DashboardWebSocketHelpers.subscribeToWidgetConfigChanges(
        widgetId,
        (data) => callbacks.onWidgetConfigUpdate!(widgetId, data)
      );
      subscriptions.current.push(subscriptionId);
    });

    return () => {
      subscriptions.current.forEach(id => dashboardWebSocket.unsubscribe(id));
      subscriptions.current = [];
    };
  }, [widgetIds, callbacks.onWidgetConfigUpdate, enabled]);

  return {
    activeSubscriptions: subscriptions.current.length,
    cleanup: () => {
      subscriptions.current.forEach(id => dashboardWebSocket.unsubscribe(id));
      subscriptions.current = [];
    },
  };
}
