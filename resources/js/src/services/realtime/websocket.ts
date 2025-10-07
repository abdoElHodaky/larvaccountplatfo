/**
 * WebSocket Real-time Service
 * Integration with Laravel Reverb for real-time features
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { store } from '../../stores';

// Configure Pusher for Laravel Reverb
window.Pusher = Pusher;

// Types
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  tenantId?: string;
}

export interface FinancialUpdateEvent extends RealtimeEvent {
  type: 'financial.account.updated' | 'financial.transaction.created' | 'financial.transaction.updated';
  data: {
    id: string;
    type: 'account' | 'transaction';
    action: 'created' | 'updated' | 'deleted';
    payload: any;
  };
}

export interface TenantUpdateEvent extends RealtimeEvent {
  type: 'tenant.user.invited' | 'tenant.settings.updated' | 'tenant.subscription.changed';
  data: {
    tenantId: string;
    action: string;
    payload: any;
  };
}

export interface NotificationEvent extends RealtimeEvent {
  type: 'notification.created';
  data: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    userId: string;
  };
}

// WebSocket Service Class
class WebSocketService {
  private echo: Echo | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private channels: Map<string, any> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeEcho();
  }

  private initializeEcho() {
    const state = store.getState();
    const token = state.auth.token;
    const currentTenant = state.auth.currentTenant;

    if (!token) {
      console.warn('WebSocket: No authentication token available');
      return;
    }

    try {
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: process.env.VITE_REVERB_APP_KEY || 'app-key',
        wsHost: process.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: process.env.VITE_REVERB_PORT || 8080,
        wssPort: process.env.VITE_REVERB_PORT || 8080,
        forceTLS: process.env.VITE_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': currentTenant?.id || '',
          },
        },
        authEndpoint: '/api/broadcasting/auth',
      });

      this.setupConnectionHandlers();
      this.setupGlobalChannels();
      
      console.log('WebSocket: Echo initialized successfully');
    } catch (error) {
      console.error('WebSocket: Failed to initialize Echo:', error);
      this.scheduleReconnect();
    }
  }

  private setupConnectionHandlers() {
    if (!this.echo) return;

    // Connection established
    this.echo.connector.pusher.connection.bind('connected', () => {
      console.log('WebSocket: Connected to Laravel Reverb');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      store.dispatch.app.showSuccess({
        title: 'Real-time Connected',
        message: 'Live updates are now active',
        duration: 3000,
      });
    });

    // Connection lost
    this.echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('WebSocket: Disconnected from Laravel Reverb');
      this.isConnected = false;
      
      store.dispatch.app.showWarning({
        title: 'Real-time Disconnected',
        message: 'Attempting to reconnect...',
        duration: 5000,
      });
      
      this.scheduleReconnect();
    });

    // Connection error
    this.echo.connector.pusher.connection.bind('error', (error: any) => {
      console.error('WebSocket: Connection error:', error);
      this.isConnected = false;
      
      store.dispatch.app.showError({
        title: 'Real-time Connection Error',
        message: 'Unable to establish real-time connection',
        persistent: true,
      });
    });
  }

  private setupGlobalChannels() {
    if (!this.echo) return;

    const state = store.getState();
    const currentUser = state.auth.user;
    const currentTenant = state.auth.currentTenant;

    if (!currentUser || !currentTenant) return;

    // User-specific private channel
    this.subscribeToPrivateChannel(`user.${currentUser.id}`, {
      // User notifications
      'notification.created': (event: NotificationEvent) => {
        store.dispatch.app.showNotification({
          type: event.data.type,
          title: event.data.title,
          message: event.data.message,
        });
      },

      // Session updates
      'auth.session.expired': () => {
        store.dispatch.auth.logout();
        store.dispatch.app.showError({
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          persistent: true,
        });
      },
    });

    // Tenant-specific private channel
    this.subscribeToPrivateChannel(`tenant.${currentTenant.id}`, {
      // Financial updates
      'financial.account.updated': (event: FinancialUpdateEvent) => {
        this.handleFinancialUpdate(event);
      },
      
      'financial.transaction.created': (event: FinancialUpdateEvent) => {
        this.handleFinancialUpdate(event);
      },
      
      'financial.transaction.updated': (event: FinancialUpdateEvent) => {
        this.handleFinancialUpdate(event);
      },

      // Tenant updates
      'tenant.user.invited': (event: TenantUpdateEvent) => {
        store.dispatch.tenant.addInvitation(event.data.payload);
        store.dispatch.app.showInfo({
          title: 'New User Invited',
          message: `${event.data.payload.email} has been invited to the tenant`,
        });
      },

      'tenant.settings.updated': (event: TenantUpdateEvent) => {
        store.dispatch.tenant.updateTenantSettings(event.data.payload);
        store.dispatch.app.showSuccess({
          title: 'Settings Updated',
          message: 'Tenant settings have been updated',
        });
      },

      'tenant.subscription.changed': (event: TenantUpdateEvent) => {
        store.dispatch.tenant.setSubscription(event.data.payload);
        store.dispatch.app.showInfo({
          title: 'Subscription Updated',
          message: 'Your subscription plan has been updated',
        });
      },
    });

    // Global public channel for system announcements
    this.subscribeToChannel('system.announcements', {
      'system.maintenance.scheduled': (event: RealtimeEvent) => {
        store.dispatch.app.showWarning({
          title: 'Maintenance Scheduled',
          message: event.data.message,
          persistent: true,
        });
      },

      'system.feature.released': (event: RealtimeEvent) => {
        store.dispatch.app.showSuccess({
          title: 'New Feature Available',
          message: event.data.message,
          duration: 10000,
        });
      },
    });
  }

  private handleFinancialUpdate(event: FinancialUpdateEvent) {
    const { data } = event;
    
    switch (data.type) {
      case 'account':
        if (data.action === 'created') {
          store.dispatch.financial.addAccount(data.payload);
        } else if (data.action === 'updated') {
          store.dispatch.financial.updateAccount(data.payload);
        } else if (data.action === 'deleted') {
          store.dispatch.financial.removeAccount(data.payload.id);
        }
        break;
        
      case 'transaction':
        if (data.action === 'created') {
          store.dispatch.financial.addTransaction(data.payload);
          store.dispatch.app.showSuccess({
            title: 'New Transaction',
            message: `Transaction ${data.payload.referenceNumber} has been created`,
          });
        } else if (data.action === 'updated') {
          store.dispatch.financial.updateTransaction(data.payload);
        } else if (data.action === 'deleted') {
          store.dispatch.financial.removeTransaction(data.payload.id);
        }
        break;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: Max reconnection attempts reached');
      store.dispatch.app.showError({
        title: 'Connection Failed',
        message: 'Unable to establish real-time connection. Please refresh the page.',
        persistent: true,
      });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`WebSocket: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.disconnect();
      this.initializeEcho();
    }, delay);
  }

  // Public methods
  public connect() {
    if (!this.echo) {
      this.initializeEcho();
    }
  }

  public disconnect() {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
    this.isConnected = false;
    this.channels.clear();
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  public subscribeToChannel(channelName: string, events: Record<string, Function>) {
    if (!this.echo) {
      console.warn('WebSocket: Echo not initialized');
      return;
    }

    const channel = this.echo.channel(channelName);
    this.channels.set(channelName, channel);

    Object.entries(events).forEach(([eventName, handler]) => {
      channel.listen(eventName, handler);
    });

    return channel;
  }

  public subscribeToPrivateChannel(channelName: string, events: Record<string, Function>) {
    if (!this.echo) {
      console.warn('WebSocket: Echo not initialized');
      return;
    }

    const channel = this.echo.private(channelName);
    this.channels.set(channelName, channel);

    Object.entries(events).forEach(([eventName, handler]) => {
      channel.listen(eventName, handler);
    });

    return channel;
  }

  public subscribeToPresenceChannel(channelName: string, events: Record<string, Function>) {
    if (!this.echo) {
      console.warn('WebSocket: Echo not initialized');
      return;
    }

    const channel = this.echo.join(channelName);
    this.channels.set(channelName, channel);

    Object.entries(events).forEach(([eventName, handler]) => {
      if (eventName === 'here' || eventName === 'joining' || eventName === 'leaving') {
        channel[eventName](handler);
      } else {
        channel.listen(eventName, handler);
      }
    });

    return channel;
  }

  public unsubscribeFromChannel(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.stopListening();
      this.channels.delete(channelName);
    }
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.echo) return 'disconnected';
    
    const state = this.echo.connector.pusher.connection.state;
    switch (state) {
      case 'connected':
        return 'connected';
      case 'connecting':
      case 'unavailable':
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  // Update authentication when user logs in/out
  public updateAuthentication() {
    this.disconnect();
    this.initializeEcho();
  }

  // Update tenant context when switching tenants
  public updateTenantContext() {
    this.disconnect();
    this.initializeEcho();
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export for use in components
export default webSocketService;
