import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-GETDASHBOARDMETRICS';

// Simplified real-time hook
export function useRealtime(organizationId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    // Initialize Socket.io connection
    const socketInstance = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080', {
      auth: {
        token: localStorage.getItem('auth_token'),
        organizationId: organizationId,
      },
      transports: ['websocket'],
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    // Real-time event listeners
    socketInstance.on('accounting:transaction_created', (data: { transaction: any; account_balance_updated?: any }) => {
      console.log('Transaction created:', data);
      setTransactions(prev => [data.transaction, ...prev]);
      if (data.account_balance_updated) {
        // Update metrics or account balances
      }
    });

    socketInstance.on('accounting:transaction_updated', (data: { transaction: any }) => {
      console.log('Transaction updated:', data);
      setTransactions(prev => 
        prev.map(t => t.id === data.transaction.id ? data.transaction : t)
      );
    });

    socketInstance.on('inventory:stock_updated', (data: { product: any }) => {
      console.log('Stock updated:', data);
      setProducts(prev => 
        prev.map(p => p.id === data.product.id ? data.product : p)
      );
    });

    socketInstance.on('dashboard:metrics_updated', (data) => {
      console.log('Metrics updated:', data);
      setMetrics(data.metrics);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [organizationId]);

  return {
    socket,
    connected,
    transactions,
    products,
    metrics,
  };
}

// Specific hooks for different features
export function useRealtimeTransactions(organizationId: string) {
  const { transactions, connected } = useRealtime(organizationId);
  return { transactions, connected };
}

export function useRealtimeInventory(organizationId: string) {
  const { products, connected } = useRealtime(organizationId);
  return { products, connected };
}

export function useRealtimeDashboard(organizationId: string) {
  const { metrics, connected } = useRealtime(organizationId);
  return { metrics, connected };
}
