/**
 * WebSocket Service for Real-time Dashboard Updates
 * Handles WebSocket connections and real-time data streaming
 */

import { log } from '../../../shared/utils/logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  widgetId?: number;
  organizationId?: number;
  userId?: number;
}

export interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  enableLogging?: boolean;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export interface WebSocketSubscription {
  id: string;
  type: string;
  handler: WebSocketEventHandler;
  filters?: Record<string, any>;
}

/**
 * WebSocket Service for Dashboard Real-time Updates
 */
export class DashboardWebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enableLogging: config.enableLogging ?? true,
    };
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/dashboard`;
  }

  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      log.info(`[WebSocket] ${message}`, data, 'DashboardWebSocket');
    }
  }

  private logError(message: string, error?: any): void {
    log.error(`[WebSocket] ${message}`, error, 'DashboardWebSocket');
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;
    this.log('Connecting to WebSocket server', { url: this.config.url });

    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        const originalOnOpen = this.ws!.onopen;
        this.ws!.onopen = (event) => {
          clearTimeout(timeout);
          originalOnOpen?.call(this.ws, event);
          resolve();
        };

        const originalOnError = this.ws!.onerror;
        this.ws!.onerror = (event) => {
          clearTimeout(timeout);
          originalOnError?.call(this.ws, event);
          reject(new Error('WebSocket connection failed'));
        };
      });
    } catch (error) {
      this.isConnecting = false;
      this.logError('Failed to connect to WebSocket server', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting from WebSocket server');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(type: string, handler: WebSocketEventHandler, filters?: Record<string, any>): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: WebSocketSubscription = {
      id,
      type,
      handler,
      filters,
    };

    this.subscriptions.set(id, subscription);
    this.log('Added subscription', { id, type, filters });

    // Send subscription message to server if connected
    if (this.isConnected) {
      this.sendMessage({
        type: 'subscribe',
        data: { subscriptionType: type, filters },
        timestamp: new Date().toISOString(),
      });
    }

    return id;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.log('Removed subscription', { id: subscriptionId, type: subscription.type });

      // Send unsubscribe message to server if connected
      if (this.isConnected) {
        this.sendMessage({
          type: 'unsubscribe',
          data: { subscriptionId },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        this.log('Sent message', { type: message.type });
      } catch (error) {
        this.logError('Failed to send message', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      this.log('Queued message (not connected)', { type: message.type });
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(event: Event): void {
    this.log('WebSocket connection established');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start heartbeat
    this.startHeartbeat();

    // Send queued messages
    this.flushMessageQueue();

    // Re-subscribe to all subscriptions
    this.resubscribeAll();
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Received message', { type: message.type });

      // Handle system messages
      if (message.type === 'pong') {
        return; // Heartbeat response
      }

      // Route message to appropriate subscribers
      this.routeMessage(message);
    } catch (error) {
      this.logError('Failed to parse WebSocket message', error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    this.log('WebSocket connection closed', { code: event.code, reason: event.reason });
    this.isConnected = false;
    this.isConnecting = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    this.logError('WebSocket error occurred', event);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'ping',
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.config.reconnectInterval * this.reconnectAttempts, 30000);
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.logError('Reconnection attempt failed', error);
      });
    }, delay);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Re-subscribe to all subscriptions after reconnection
   */
  private resubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      this.sendMessage({
        type: 'subscribe',
        data: { subscriptionType: subscription.type, filters: subscription.filters },
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Route message to appropriate subscribers
   */
  private routeMessage(message: WebSocketMessage): void {
    this.subscriptions.forEach((subscription) => {
      if (this.messageMatchesSubscription(message, subscription)) {
        try {
          subscription.handler(message);
        } catch (error) {
          this.logError('Error in subscription handler', error);
        }
      }
    });
  }

  /**
   * Check if message matches subscription criteria
   */
  private messageMatchesSubscription(message: WebSocketMessage, subscription: WebSocketSubscription): boolean {
    // Basic type matching
    if (message.type !== subscription.type) {
      return false;
    }

    // Apply filters if present
    if (subscription.filters) {
      for (const [key, value] of Object.entries(subscription.filters)) {
        if (message[key as keyof WebSocketMessage] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; connecting: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create and export singleton instance
export const dashboardWebSocket = new DashboardWebSocketService();

// Dashboard-specific WebSocket helpers
export const DashboardWebSocketHelpers = {
  /**
   * Subscribe to widget data updates
   */
  subscribeToWidgetUpdates(widgetId: number, handler: (data: any) => void): string {
    return dashboardWebSocket.subscribe('widget_data_updated', (message) => {
      if (message.widgetId === widgetId) {
        handler(message.data);
      }
    }, { widgetId });
  },

  /**
   * Subscribe to dashboard layout changes
   */
  subscribeToDashboardChanges(organizationId: number, userId: number, handler: (data: any) => void): string {
    return dashboardWebSocket.subscribe('dashboard_updated', (message) => {
      if (message.organizationId === organizationId && message.userId === userId) {
        handler(message.data);
      }
    }, { organizationId, userId });
  },

  /**
   * Subscribe to widget configuration changes
   */
  subscribeToWidgetConfigChanges(widgetId: number, handler: (data: any) => void): string {
    return dashboardWebSocket.subscribe('widget_configured', (message) => {
      if (message.widgetId === widgetId) {
        handler(message.data);
      }
    }, { widgetId });
  },

  /**
   * Subscribe to performance metrics updates
   */
  subscribeToPerformanceUpdates(organizationId: number, handler: (data: any) => void): string {
    return dashboardWebSocket.subscribe('performance_updated', (message) => {
      if (message.organizationId === organizationId) {
        handler(message.data);
      }
    }, { organizationId });
  },

  /**
   * Initialize WebSocket connection for dashboard
   */
  async initializeDashboardWebSocket(): Promise<void> {
    try {
      await dashboardWebSocket.connect();
      log.info('Dashboard WebSocket initialized successfully', {}, 'DashboardWebSocket');
    } catch (error) {
      log.error('Failed to initialize Dashboard WebSocket', error, 'DashboardWebSocket');
      throw error;
    }
  },

  /**
   * Cleanup WebSocket connection
   */
  cleanup(): void {
    dashboardWebSocket.disconnect();
  },
};
