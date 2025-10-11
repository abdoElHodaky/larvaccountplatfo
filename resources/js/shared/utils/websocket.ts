import React from 'react';

/**
 * Real-time WebSocket Manager
 * Performance-optimized WebSocket connection management with reconnection logic
 */

export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
    id?: string;
}

export interface WebSocketOptions {
    url: string;
    protocols?: string[];
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    debug?: boolean;
}

export interface WebSocketStatus {
    connected: boolean;
    connecting: boolean;
    reconnecting: boolean;
    lastConnected: Date | null;
    reconnectAttempts: number;
    latency: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type WebSocketStatusHandler = (status: WebSocketStatus) => void;

/**
 * WebSocket Manager Class
 * Handles connection, reconnection, message queuing, and event management
 */
export class WebSocketManager {
    private static instance: WebSocketManager;
    private ws: WebSocket | null = null;
    private options: Required<WebSocketOptions>;
    private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
    private statusHandlers: Set<WebSocketStatusHandler> = new Set();
    private messageQueue: WebSocketMessage[] = [];
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private status: WebSocketStatus = {
        connected: false,
        connecting: false,
        reconnecting: false,
        lastConnected: null,
        reconnectAttempts: 0,
        latency: 0,
    };

    private constructor(options: WebSocketOptions) {
        this.options = {
            protocols: [],
            reconnectInterval: 3000,
            maxReconnectAttempts: 10,
            heartbeatInterval: 30000,
            debug: false,
            ...options,
        };
    }

    public static getInstance(options?: WebSocketOptions): WebSocketManager {
        if (!WebSocketManager.instance && options) {
            WebSocketManager.instance = new WebSocketManager(options);
        }
        return WebSocketManager.instance;
    }

    /**
     * Connect to WebSocket server
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            this.updateStatus({ connecting: true, reconnecting: false });
            this.log('Connecting to WebSocket...');

            try {
                this.ws = new WebSocket(this.options.url, this.options.protocols);

                this.ws.onopen = () => {
                    this.log('WebSocket connected');
                    this.updateStatus({
                        connected: true,
                        connecting: false,
                        reconnecting: false,
                        lastConnected: new Date(),
                        reconnectAttempts: 0,
                    });

                    this.startHeartbeat();
                    this.processMessageQueue();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onclose = (event) => {
                    this.log('WebSocket closed', event.code, event.reason);
                    this.handleDisconnection();
                };

                this.ws.onerror = (error) => {
                    this.log('WebSocket error', error);
                    reject(error);
                };
            } catch (error) {
                this.log('Failed to create WebSocket connection', error);
                this.updateStatus({ connecting: false });
                reject(error);
            }
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    public disconnect(): void {
        this.log('Disconnecting WebSocket...');

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.updateStatus({
            connected: false,
            connecting: false,
            reconnecting: false,
        });
    }

    /**
     * Send message to WebSocket server
     */
    public send(type: string, payload: any): void {
        const message: WebSocketMessage = {
            type,
            payload,
            timestamp: Date.now(),
            id: this.generateMessageId(),
        };

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            this.log('Message sent', message);
        } else {
            this.log('Queueing message (not connected)', message);
            this.messageQueue.push(message);
        }
    }

    /**
     * Subscribe to message type
     */
    public on(type: string, handler: WebSocketEventHandler): () => void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, new Set());
        }

        this.eventHandlers.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            const handlers = this.eventHandlers.get(type);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.eventHandlers.delete(type);
                }
            }
        };
    }

    /**
     * Subscribe to status changes
     */
    public onStatusChange(handler: WebSocketStatusHandler): () => void {
        this.statusHandlers.add(handler);

        // Return unsubscribe function
        return () => {
            this.statusHandlers.delete(handler);
        };
    }

    /**
     * Get current status
     */
    public getStatus(): WebSocketStatus {
        return { ...this.status };
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.log('Message received', message);

            // Handle heartbeat response
            if (message.type === 'pong') {
                const latency = Date.now() - message.payload.timestamp;
                this.updateStatus({ latency });
                return;
            }

            // Dispatch to handlers
            const handlers = this.eventHandlers.get(message.type);
            if (handlers) {
                handlers.forEach((handler) => {
                    try {
                        handler(message);
                    } catch (error) {
                        this.log('Error in message handler', error);
                    }
                });
            }
        } catch (error) {
            this.log('Failed to parse message', error);
        }
    }

    /**
     * Handle disconnection and attempt reconnection
     */
    private handleDisconnection(): void {
        this.updateStatus({ connected: false, connecting: false });

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        // Attempt reconnection if within limits
        if (this.status.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.updateStatus({
                reconnecting: true,
                reconnectAttempts: this.status.reconnectAttempts + 1,
            });

            this.log(
                `Reconnecting in ${this.options.reconnectInterval}ms (attempt ${this.status.reconnectAttempts})`
            );

            this.reconnectTimer = setTimeout(() => {
                this.connect().catch((error) => {
                    this.log('Reconnection failed', error);
                });
            }, this.options.reconnectInterval);
        } else {
            this.log('Max reconnection attempts reached');
            this.updateStatus({ reconnecting: false });
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send('ping', { timestamp: Date.now() });
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * Process queued messages
     */
    private processMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
            const message = this.messageQueue.shift()!;
            this.ws.send(JSON.stringify(message));
            this.log('Queued message sent', message);
        }
    }

    /**
     * Update status and notify handlers
     */
    private updateStatus(updates: Partial<WebSocketStatus>): void {
        this.status = { ...this.status, ...updates };
        this.statusHandlers.forEach((handler) => {
            try {
                handler(this.status);
            } catch (error) {
                this.log('Error in status handler', error);
            }
        });
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Debug logging
     */
    private log(message: string, ...args: any[]): void {
        if (this.options.debug) {
            console.log(`[WebSocket] ${message}`, ...args);
        }
    }
}

/**
 * React Hook for WebSocket functionality
 */
export function useWebSocket(options?: WebSocketOptions) {
    const [status, setStatus] = React.useState<WebSocketStatus>(() => ({
        connected: false,
        connecting: false,
        reconnecting: false,
        lastConnected: null,
        reconnectAttempts: 0,
        latency: 0,
    }));

    const wsManager = React.useMemo(() => {
        if (options) {
            return WebSocketManager.getInstance(options);
        }
        return WebSocketManager.getInstance();
    }, [options?.url]);

    React.useEffect(() => {
        if (!wsManager) return;

        const unsubscribe = wsManager.onStatusChange(setStatus);
        setStatus(wsManager.getStatus());

        return unsubscribe;
    }, [wsManager]);

    const connect = React.useCallback(async () => {
        if (wsManager) {
            await wsManager.connect();
        }
    }, [wsManager]);

    const disconnect = React.useCallback(() => {
        if (wsManager) {
            wsManager.disconnect();
        }
    }, [wsManager]);

    const send = React.useCallback(
        (type: string, payload: any) => {
            if (wsManager) {
                wsManager.send(type, payload);
            }
        },
        [wsManager]
    );

    const subscribe = React.useCallback(
        (type: string, handler: WebSocketEventHandler) => {
            if (wsManager) {
                return wsManager.on(type, handler);
            }
            return () => {};
        },
        [wsManager]
    );

    return {
        status,
        connect,
        disconnect,
        send,
        subscribe,
        wsManager,
    };
}

/**
 * Financial WebSocket Hook with predefined channels
 */
export function useFinancialWebSocket(tenantId?: string) {
    const wsUrl = React.useMemo(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const path = tenantId ? `/ws/tenant/${tenantId}` : '/ws';
        return `${protocol}//${host}${path}`;
    }, [tenantId]);

    const { status, connect, disconnect, send, subscribe } = useWebSocket({
        url: wsUrl,
        protocols: ['financial-data'],
        reconnectInterval: 2000,
        maxReconnectAttempts: 15,
        heartbeatInterval: 25000,
        debug: process.env.NODE_ENV === 'development',
    });

    // Financial-specific methods
    const subscribeToTransactions = React.useCallback(
        (handler: WebSocketEventHandler) => {
            return subscribe('transaction.created', handler);
        },
        [subscribe]
    );

    const subscribeToAccountUpdates = React.useCallback(
        (handler: WebSocketEventHandler) => {
            return subscribe('account.updated', handler);
        },
        [subscribe]
    );

    const subscribeToReportUpdates = React.useCallback(
        (handler: WebSocketEventHandler) => {
            return subscribe('report.generated', handler);
        },
        [subscribe]
    );

    const subscribeToNotifications = React.useCallback(
        (handler: WebSocketEventHandler) => {
            return subscribe('notification', handler);
        },
        [subscribe]
    );

    const sendTransactionUpdate = React.useCallback(
        (transactionId: string, data: any) => {
            send('transaction.update', { transactionId, data });
        },
        [send]
    );

    const sendReportRequest = React.useCallback(
        (reportType: string, params: any) => {
            send('report.request', { reportType, params });
        },
        [send]
    );

    return {
        status,
        connect,
        disconnect,
        subscribeToTransactions,
        subscribeToAccountUpdates,
        subscribeToReportUpdates,
        subscribeToNotifications,
        sendTransactionUpdate,
        sendReportRequest,
    };
}

export default WebSocketManager;
