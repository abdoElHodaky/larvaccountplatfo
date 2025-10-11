import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'ws://localhost:6001',
  autoConnect = true,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscribers, setSubscribers] = useState<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { channel, payload } = data;

            // Notify subscribers
            const channelSubscribers = subscribers.get(channel);
            if (channelSubscribers) {
              channelSubscribers.forEach(callback => callback(payload));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        setSocket(ws);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [url, autoConnect]);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const subscribe = (channel: string, callback: (data: any) => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev);
      if (!newSubscribers.has(channel)) {
        newSubscribers.set(channel, new Set());
      }
      newSubscribers.get(channel)!.add(callback);
      return newSubscribers;
    });

    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newSubscribers = new Map(prev);
        const channelSubscribers = newSubscribers.get(channel);
        if (channelSubscribers) {
          channelSubscribers.delete(callback);
          if (channelSubscribers.size === 0) {
            newSubscribers.delete(channel);
          }
        }
        return newSubscribers;
      });
    };
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;
