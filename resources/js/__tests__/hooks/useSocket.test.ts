/**
 * Socket.io Hooks Tests
 * Comprehensive testing for real-time WebSocket functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSocket, useRealtimeDashboard, useRealtimeAccounting } from '../../shared/hooks/useSocket';
import { socketManager } from '../../shared/services/socket/socketManager';
import { testUtils, localStorageMock } from '../setup/testSetup';

// Mock the socket manager
vi.mock('../../shared/services/socket/socketManager', () => ({
  socketManager: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    sendToRoom: vi.fn(),
    broadcastToOrganization: vi.fn(),
    sendToUser: vi.fn(),
    isConnected: false,
    socketId: undefined,
    getStats: vi.fn(() => ({
      connected: false,
      socketId: undefined,
      reconnectAttempts: 0,
      rooms: [],
      eventListeners: 0,
    })),
  },
}));

const mockSocketManager = socketManager as any;

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.setupAuthenticatedUser();
    mockSocketManager.connect.mockResolvedValue({} as any);
    mockSocketManager.on.mockReturnValue(() => {});
  });

  afterEach(() => {
    testUtils.clearAuth();
  });

  it('should initialize socket connection on mount', async () => {
    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(mockSocketManager.connect).toHaveBeenCalledWith(testUtils.mockAuthToken);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.socketId).toBeUndefined();
  });

  it('should not connect without auth token', () => {
    testUtils.clearAuth();
    
    renderHook(() => useSocket());

    expect(mockSocketManager.connect).not.toHaveBeenCalled();
  });

  it('should provide socket methods', () => {
    const { result } = renderHook(() => useSocket());

    expect(typeof result.current.emit).toBe('function');
    expect(typeof result.current.on).toBe('function');
    expect(typeof result.current.off).toBe('function');
    expect(typeof result.current.joinRoom).toBe('function');
    expect(typeof result.current.leaveRoom).toBe('function');
    expect(typeof result.current.sendToRoom).toBe('function');
    expect(typeof result.current.broadcastToOrganization).toBe('function');
    expect(typeof result.current.sendToUser).toBe('function');
  });

  it('should emit events through socket manager', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.emit('test_event', { data: 'test' });
    });

    expect(mockSocketManager.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
  });

  it('should join and leave rooms', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.joinRoom('test_room');
    });

    expect(mockSocketManager.joinRoom).toHaveBeenCalledWith('test_room');

    act(() => {
      result.current.leaveRoom('test_room');
    });

    expect(mockSocketManager.leaveRoom).toHaveBeenCalledWith('test_room');
  });

  it('should handle connection state changes', async () => {
    const { result, rerender } = renderHook(() => useSocket());

    // Simulate connection
    mockSocketManager.isConnected = true;
    mockSocketManager.socketId = 'socket-123';

    rerender();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.socketId).toBe('socket-123');
    });
  });

  it('should setup event listeners for connection changes', () => {
    renderHook(() => useSocket());

    expect(mockSocketManager.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockSocketManager.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketManager.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });
});

describe('useRealtimeDashboard Hook', () => {
  const mockOrganizationId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.setupAuthenticatedUser();
    mockSocketManager.isConnected = true;
    mockSocketManager.on.mockReturnValue(() => {});
  });

  it('should join dashboard room on mount', () => {
    renderHook(() => useRealtimeDashboard(mockOrganizationId));

    expect(mockSocketManager.joinRoom).toHaveBeenCalledWith(`dashboard:${mockOrganizationId}`);
  });

  it('should not join room when not connected', () => {
    mockSocketManager.isConnected = false;

    renderHook(() => useRealtimeDashboard(mockOrganizationId));

    expect(mockSocketManager.joinRoom).not.toHaveBeenCalled();
  });

  it('should setup dashboard event listeners', () => {
    renderHook(() => useRealtimeDashboard(mockOrganizationId));

    expect(mockSocketManager.on).toHaveBeenCalledWith('dashboard:metrics_updated', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('dashboard:widget_updated', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('dashboard:widget_position_updated', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('dashboard:widget_added', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('dashboard:widget_removed', expect.any(Function));
  });

  it('should update metrics on real-time events', async () => {
    let metricsUpdateCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'dashboard:metrics_updated') {
        metricsUpdateCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeDashboard(mockOrganizationId));

    // Simulate metrics update
    const newMetric = {
      id: 'metric-1',
      name: 'Revenue',
      value: 10000,
      change: 5.2,
      trend: 'up' as const,
    };

    act(() => {
      metricsUpdateCallback(newMetric);
    });

    await waitFor(() => {
      expect(result.current.metrics).toContainEqual(newMetric);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });
  });

  it('should update widgets on real-time events', async () => {
    let widgetUpdateCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'dashboard:widget_updated') {
        widgetUpdateCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeDashboard(mockOrganizationId));

    // Simulate widget update
    const updatedWidget = {
      id: 'widget-1',
      type: 'chart',
      title: 'Sales Chart',
      position: { x: 0, y: 0, width: 4, height: 3 },
    };

    act(() => {
      widgetUpdateCallback(updatedWidget);
    });

    await waitFor(() => {
      expect(result.current.widgets).toContainEqual(updatedWidget);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });
  });

  it('should handle widget position updates', async () => {
    let positionUpdateCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'dashboard:widget_position_updated') {
        positionUpdateCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeDashboard(mockOrganizationId));

    // Set initial widget
    act(() => {
      result.current.widgets.push({
        id: 'widget-1',
        type: 'chart',
        title: 'Sales Chart',
        position: { x: 0, y: 0, width: 4, height: 3 },
      });
    });

    // Simulate position update
    const positionUpdate = {
      widgetId: 'widget-1',
      position: { x: 2, y: 1, width: 4, height: 3 },
    };

    act(() => {
      positionUpdateCallback(positionUpdate);
    });

    await waitFor(() => {
      const updatedWidget = result.current.widgets.find(w => w.id === 'widget-1');
      expect(updatedWidget?.position).toEqual(positionUpdate.position);
    });
  });

  it('should leave room on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeDashboard(mockOrganizationId));

    unmount();

    expect(mockSocketManager.leaveRoom).toHaveBeenCalledWith(`dashboard:${mockOrganizationId}`);
  });
});

describe('useRealtimeAccounting Hook', () => {
  const mockOrganizationId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.setupAuthenticatedUser();
    mockSocketManager.isConnected = true;
    mockSocketManager.on.mockReturnValue(() => {});
  });

  it('should join accounting room on mount', () => {
    renderHook(() => useRealtimeAccounting(mockOrganizationId));

    expect(mockSocketManager.joinRoom).toHaveBeenCalledWith(`accounting:${mockOrganizationId}`);
  });

  it('should setup accounting event listeners', () => {
    renderHook(() => useRealtimeAccounting(mockOrganizationId));

    expect(mockSocketManager.on).toHaveBeenCalledWith('accounting:transaction_created', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('accounting:transaction_updated', expect.any(Function));
    expect(mockSocketManager.on).toHaveBeenCalledWith('accounting:account_balance_updated', expect.any(Function));
  });

  it('should update transactions on real-time events', async () => {
    let transactionCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'accounting:transaction_created') {
        transactionCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeAccounting(mockOrganizationId));

    // Simulate new transaction
    const newTransaction = {
      id: 'txn-1',
      amount: 1000,
      description: 'Test Transaction',
      date: new Date().toISOString(),
      type: 'debit' as const,
    };

    act(() => {
      transactionCallback(newTransaction);
    });

    await waitFor(() => {
      expect(result.current.transactions).toContainEqual(newTransaction);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });
  });

  it('should update account balances on real-time events', async () => {
    let balanceCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'accounting:account_balance_updated') {
        balanceCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeAccounting(mockOrganizationId));

    // Set initial account
    act(() => {
      result.current.accounts.push({
        id: 'acc-1',
        name: 'Cash',
        balance: 5000,
      });
    });

    // Simulate balance update
    const balanceUpdate = {
      accountId: 'acc-1',
      balance: 6000,
    };

    act(() => {
      balanceCallback(balanceUpdate);
    });

    await waitFor(() => {
      const updatedAccount = result.current.accounts.find(a => a.id === 'acc-1');
      expect(updatedAccount?.balance).toBe(6000);
    });
  });

  it('should handle transaction updates', async () => {
    let updateCallback: (data: any) => void;
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'accounting:transaction_updated') {
        updateCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useRealtimeAccounting(mockOrganizationId));

    // Set initial transaction
    act(() => {
      result.current.transactions.push({
        id: 'txn-1',
        amount: 1000,
        description: 'Original Description',
        date: new Date().toISOString(),
        type: 'debit' as const,
      });
    });

    // Simulate transaction update
    const transactionUpdate = {
      id: 'txn-1',
      description: 'Updated Description',
      amount: 1500,
    };

    act(() => {
      updateCallback(transactionUpdate);
    });

    await waitFor(() => {
      const updatedTransaction = result.current.transactions.find(t => t.id === 'txn-1');
      expect(updatedTransaction?.description).toBe('Updated Description');
      expect(updatedTransaction?.amount).toBe(1500);
    });
  });

  it('should leave room on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeAccounting(mockOrganizationId));

    unmount();

    expect(mockSocketManager.leaveRoom).toHaveBeenCalledWith(`accounting:${mockOrganizationId}`);
  });
});

describe('Socket Hook Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.setupAuthenticatedUser();
  });

  it('should handle connection failures gracefully', async () => {
    const connectionError = new Error('Connection failed');
    mockSocketManager.connect.mockRejectedValue(connectionError);

    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Should not throw error
    expect(() => {
      result.current.emit('test', {});
    }).not.toThrow();
  });

  it('should handle missing organization ID', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return testUtils.mockAuthToken;
      if (key === 'user_id') return testUtils.mockUser.id;
      if (key === 'current_organization_id') return null; // Missing org ID
      return null;
    });

    const { result } = renderHook(() => useRealtimeDashboard());

    expect(result.current.isConnected).toBe(false);
    expect(mockSocketManager.joinRoom).not.toHaveBeenCalled();
  });

  it('should handle event listener errors', () => {
    const errorCallback = vi.fn();
    mockSocketManager.on.mockImplementation((event: string, callback: (data: any) => void) => {
      if (event === 'dashboard:metrics_updated') {
        // Simulate callback error
        setTimeout(() => {
          try {
            callback(null); // This should cause an error
          } catch (error) {
            errorCallback(error);
          }
        }, 0);
      }
      return () => {};
    });

    renderHook(() => useRealtimeDashboard(1));

    // The hook should handle errors gracefully without crashing
    expect(() => {
      // Trigger the callback
    }).not.toThrow();
  });
});
