/**
 * Enhanced WebSocket Provider for Real-Time Communication
 * Provides optimized WebSocket context with connection management,
 * automatic reconnection, message queuing, and performance monitoring
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
    useCallback,
} from 'react';

// Connection states
export enum ConnectionState {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting',
    ERROR = 'error',
}

// Message types
interface WebSocketMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: number;
    priority?: 'high' | 'normal' | 'low';
}

// Connection statistics
interface ConnectionStats {
    totalMessages: number;
    messagesSent: number;
    messagesReceived: number;
    reconnectAttempts: number;
    lastConnected: Date | null;
    averageLatency: number;
    connectionUptime: number;
}

interface WebSocketContextType {
    socket: WebSocket | null;
    connectionState: ConnectionState;
    isConnected: boolean;
    sendMessage: (message: any, priority?: 'high' | 'normal' | 'low') => Promise<boolean>;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
    unsubscribe: (event: string) => void;
    reconnect: () => void;
    getStats: () => ConnectionStats;
    getQueueSize: () => number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
    url?: string;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    heartbeatInterval?: number;
    messageQueueSize?: number;
    enableCompression?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    url = process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    messageQueueSize = 1000,
    enableCompression = true,
}) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>(
        ConnectionState.DISCONNECTED
    );
    const [eventListeners, setEventListeners] = useState<Map<string, Set<(data: any) => void>>>(
        new Map()
    );

    // Connection management
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const connectionStartTime = useRef<Date | null>(null);

    // Message queuing
    const messageQueue = useRef<WebSocketMessage[]>([]);
    const pendingMessages = useRef<
        Map<string, { resolve: (value: boolean) => void; reject: (reason: any) => void }>
    >(new Map());

    // Statistics
    const stats = useRef<ConnectionStats>({
        totalMessages: 0,
        messagesSent: 0,
        messagesReceived: 0,
        reconnectAttempts: 0,
        lastConnected: null,
        averageLatency: 0,
        connectionUptime: 0,
    });

    // Latency tracking
    const latencyMeasurements = useRef<number[]>([]);

    // Generate unique message ID
    const generateMessageId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Process message queue
    const processMessageQueue = useCallback(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        // Sort by priority: high -> normal -> low
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        messageQueue.current.sort((a, b) => {
            const aPriority = priorityOrder[a.priority || 'normal'];
            const bPriority = priorityOrder[b.priority || 'normal'];
            return aPriority - bPriority;
        });

        // Send queued messages
        while (messageQueue.current.length > 0 && socket.readyState === WebSocket.OPEN) {
            const message = messageQueue.current.shift()!;
            try {
                const serialized = JSON.stringify(message);
                socket.send(serialized);
                stats.current.messagesSent++;

                // Resolve promise if exists
                const pending = pendingMessages.current.get(message.id);
                if (pending) {
                    pending.resolve(true);
                    pendingMessages.current.delete(message.id);
                }
            } catch (error) {
                console.error('Failed to send queued message:', error);
                const pending = pendingMessages.current.get(message.id);
                if (pending) {
                    pending.reject(error);
                    pendingMessages.current.delete(message.id);
                }
            }
        }
    }, [socket]);

    // Start heartbeat
    const startHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) {
            clearInterval(heartbeatTimer.current);
        }

        heartbeatTimer.current = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const pingTime = Date.now();
                socket.send(
                    JSON.stringify({
                        type: 'ping',
                        timestamp: pingTime,
                    })
                );
            }
        }, heartbeatInterval);
    }, [socket, heartbeatInterval]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (process.env.NODE_ENV === 'test') return;

        setConnectionState(ConnectionState.CONNECTING);

        try {
            const protocols = enableCompression ? ['permessage-deflate'] : [];
            const ws = new WebSocket(url, protocols);

            ws.onopen = () => {
                setConnectionState(ConnectionState.CONNECTED);
                setSocket(ws);
                reconnectAttempts.current = 0;
                connectionStartTime.current = new Date();
                stats.current.lastConnected = new Date();

                // Process any queued messages
                processMessageQueue();

                // Start heartbeat
                startHeartbeat();

                console.log('WebSocket connected successfully');
            };

            ws.onclose = (event) => {
                setConnectionState(ConnectionState.DISCONNECTED);
                setSocket(null);

                if (heartbeatTimer.current) {
                    clearInterval(heartbeatTimer.current);
                    heartbeatTimer.current = null;
                }

                // Calculate uptime
                if (connectionStartTime.current) {
                    stats.current.connectionUptime +=
                        Date.now() - connectionStartTime.current.getTime();
                    connectionStartTime.current = null;
                }

                // Attempt reconnection if not intentional close
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    setConnectionState(ConnectionState.RECONNECTING);
                    reconnectAttempts.current++;
                    stats.current.reconnectAttempts++;

                    reconnectTimer.current = setTimeout(
                        () => {
                            connect();
                        },
                        reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1)
                    ); // Exponential backoff
                }
            };

            ws.onerror = (error) => {
                setConnectionState(ConnectionState.ERROR);
                console.error('WebSocket error:', error);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    stats.current.messagesReceived++;
                    stats.current.totalMessages++;

                    // Handle pong for latency measurement
                    if (data.type === 'pong' && data.timestamp) {
                        const latency = Date.now() - data.timestamp;
                        latencyMeasurements.current.push(latency);

                        // Keep only last 10 measurements
                        if (latencyMeasurements.current.length > 10) {
                            latencyMeasurements.current.shift();
                        }

                        // Calculate average latency
                        stats.current.averageLatency =
                            latencyMeasurements.current.reduce((a, b) => a + b, 0) /
                            latencyMeasurements.current.length;
                        return;
                    }

                    // Notify subscribers
                    const listeners = eventListeners.get(data.type);
                    if (listeners) {
                        listeners.forEach((callback) => {
                            try {
                                callback(data.payload);
                            } catch (error) {
                                console.error('Error in WebSocket event listener:', error);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
        } catch (error) {
            setConnectionState(ConnectionState.ERROR);
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [
        url,
        maxReconnectAttempts,
        reconnectInterval,
        enableCompression,
        processMessageQueue,
        startHeartbeat,
    ]);

    // Initialize connection
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (heartbeatTimer.current) {
                clearInterval(heartbeatTimer.current);
            }
            if (socket) {
                socket.close(1000, 'Component unmounting');
            }
        };
    }, [connect]);

    // Send message with queuing and priority
    const sendMessage = useCallback(
        async (message: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<boolean> => {
            const messageId = generateMessageId();
            const wsMessage: WebSocketMessage = {
                id: messageId,
                type: message.type || 'message',
                payload: message,
                timestamp: Date.now(),
                priority,
            };

            return new Promise((resolve, reject) => {
                // Add to pending messages
                pendingMessages.current.set(messageId, { resolve, reject });

                if (socket && socket.readyState === WebSocket.OPEN) {
                    // Send immediately if connected
                    try {
                        const serialized = JSON.stringify(wsMessage);
                        socket.send(serialized);
                        stats.current.messagesSent++;
                        resolve(true);
                        pendingMessages.current.delete(messageId);
                    } catch (error) {
                        reject(error);
                        pendingMessages.current.delete(messageId);
                    }
                } else {
                    // Queue message if not connected
                    if (messageQueue.current.length >= messageQueueSize) {
                        // Remove oldest low priority message
                        const lowPriorityIndex = messageQueue.current.findIndex(
                            (m) => m.priority === 'low'
                        );
                        if (lowPriorityIndex !== -1) {
                            const removed = messageQueue.current.splice(lowPriorityIndex, 1)[0];
                            const removedPending = pendingMessages.current.get(removed.id);
                            if (removedPending) {
                                removedPending.reject(new Error('Message queue full'));
                                pendingMessages.current.delete(removed.id);
                            }
                        } else {
                            reject(new Error('Message queue full'));
                            pendingMessages.current.delete(messageId);
                            return;
                        }
                    }

                    messageQueue.current.push(wsMessage);
                }
            });
        },
        [socket, generateMessageId, messageQueueSize]
    );

    // Subscribe to events
    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        setEventListeners((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(event)) {
                newMap.set(event, new Set());
            }
            newMap.get(event)!.add(callback);
            return newMap;
        });

        // Return unsubscribe function
        return () => {
            setEventListeners((prev) => {
                const newMap = new Map(prev);
                const listeners = newMap.get(event);
                if (listeners) {
                    listeners.delete(callback);
                    if (listeners.size === 0) {
                        newMap.delete(event);
                    }
                }
                return newMap;
            });
        };
    }, []);

    // Unsubscribe from events
    const unsubscribe = useCallback((event: string) => {
        setEventListeners((prev) => {
            const newMap = new Map(prev);
            newMap.delete(event);
            return newMap;
        });
    }, []);

    // Manual reconnect
    const reconnect = useCallback(() => {
        if (socket) {
            socket.close(1000, 'Manual reconnect');
        }
        reconnectAttempts.current = 0;
        connect();
    }, [socket, connect]);

    // Get connection statistics
    const getStats = useCallback((): ConnectionStats => {
        const currentStats = { ...stats.current };
        if (connectionStartTime.current) {
            currentStats.connectionUptime += Date.now() - connectionStartTime.current.getTime();
        }
        return currentStats;
    }, []);

    // Get queue size
    const getQueueSize = useCallback(() => messageQueue.current.length, []);

    const value: WebSocketContextType = {
        socket,
        connectionState,
        isConnected: connectionState === ConnectionState.CONNECTED,
        sendMessage,
        subscribe,
        unsubscribe,
        reconnect,
        getStats,
        getQueueSize,
    };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export default WebSocketProvider;
