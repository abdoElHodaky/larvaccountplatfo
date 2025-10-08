import React, { Fragment, memo, useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { useFinancialWebSocket } from '@/Utils/websocket';
import { useMemoizedCallback } from '@/Hooks';

/**
 * Performance-Optimized Live Data Synchronization Component
 * Handles real-time data updates with conflict resolution and offline support
 */

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSync: Date | null;
  pendingChanges: number;
  conflictCount: number;
  progress: number;
}

export interface DataChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: Date;
  userId?: string;
  version?: number;
}

export interface ConflictResolution {
  changeId: string;
  resolution: 'accept' | 'reject' | 'merge';
  mergedData?: any;
}

export interface LiveDataSyncProps {
  tenantId?: string;
  entities: string[];
  onDataChange?: (change: DataChange) => void;
  onConflict?: (localChange: DataChange, remoteChange: DataChange) => ConflictResolution;
  autoResolveConflicts?: boolean;
  syncInterval?: number;
  className?: string;
}

export const LiveDataSync: React.FC<LiveDataSyncProps> = memo(({
  tenantId,
  entities = [],
  onDataChange,
  onConflict,
  autoResolveConflicts = true,
  syncInterval = 30000,
  className,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null,
    pendingChanges: 0,
    conflictCount: 0,
    progress: 0,
  });

  const [pendingChanges, setPendingChanges] = useState<DataChange[]>([]);
  const [conflicts, setConflicts] = useState<Array<{
    local: DataChange;
    remote: DataChange;
  }>>([]);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const changeQueueRef = useRef<DataChange[]>([]);

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const successColor = useColorModeValue('green.500', 'green.400');
  const errorColor = useColorModeValue('red.500', 'red.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');

  // WebSocket connection
  const { 
    status: wsStatus, 
    connect, 
    subscribe, 
    send,
    subscribeToTransactions,
    subscribeToAccountUpdates,
  } = useFinancialWebSocket(tenantId);

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Update sync status based on WebSocket status
  useEffect(() => {
    if (wsStatus.connected) {
      setSyncStatus(prev => ({
        ...prev,
        status: prev.status === 'offline' ? 'idle' : prev.status,
      }));
    } else {
      setSyncStatus(prev => ({
        ...prev,
        status: 'offline',
      }));
    }
  }, [wsStatus.connected]);

  // Subscribe to data changes for each entity
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    entities.forEach(entity => {
      const unsubscribe = subscribe(`${entity}.changed`, (message) => {
        const change: DataChange = {
          id: message.id || `change-${Date.now()}`,
          type: message.payload.type,
          entity: message.payload.entity,
          entityId: message.payload.entityId,
          data: message.payload.data,
          timestamp: new Date(message.timestamp),
          userId: message.payload.userId,
          version: message.payload.version,
        };

        handleRemoteChange(change);
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [entities, subscribe]);

  // Set up sync interval
  useEffect(() => {
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (wsStatus.connected && pendingChanges.length > 0) {
          syncPendingChanges();
        }
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [syncInterval, wsStatus.connected, pendingChanges.length]);

  // Handle remote data changes
  const handleRemoteChange = useMemoizedCallback((remoteChange: DataChange) => {
    // Check for conflicts with pending local changes
    const conflictingChange = pendingChanges.find(
      local => local.entity === remoteChange.entity && 
               local.entityId === remoteChange.entityId
    );

    if (conflictingChange) {
      handleConflict(conflictingChange, remoteChange);
    } else {
      // No conflict, apply the change
      if (onDataChange) {
        onDataChange(remoteChange);
      }
    }
  }, [pendingChanges, onDataChange]);

  // Handle conflicts between local and remote changes
  const handleConflict = useMemoizedCallback((localChange: DataChange, remoteChange: DataChange) => {
    if (autoResolveConflicts && onConflict) {
      const resolution = onConflict(localChange, remoteChange);
      resolveConflict(localChange, remoteChange, resolution);
    } else {
      // Add to conflicts list for manual resolution
      setConflicts(prev => [...prev, { local: localChange, remote: remoteChange }]);
      setSyncStatus(prev => ({
        ...prev,
        conflictCount: prev.conflictCount + 1,
      }));
    }
  }, [autoResolveConflicts, onConflict]);

  // Resolve a conflict
  const resolveConflict = useMemoizedCallback((
    localChange: DataChange,
    remoteChange: DataChange,
    resolution: ConflictResolution
  ) => {
    switch (resolution.resolution) {
      case 'accept':
        // Accept remote change, discard local
        setPendingChanges(prev => prev.filter(c => c.id !== localChange.id));
        if (onDataChange) {
          onDataChange(remoteChange);
        }
        break;

      case 'reject':
        // Keep local change, ignore remote
        // Local change will be synced on next sync cycle
        break;

      case 'merge':
        // Create merged change
        const mergedChange: DataChange = {
          ...localChange,
          data: resolution.mergedData || { ...remoteChange.data, ...localChange.data },
          timestamp: new Date(),
        };
        
        setPendingChanges(prev => 
          prev.map(c => c.id === localChange.id ? mergedChange : c)
        );
        break;
    }

    // Remove from conflicts
    setConflicts(prev => 
      prev.filter(c => c.local.id !== localChange.id)
    );

    setSyncStatus(prev => ({
      ...prev,
      conflictCount: Math.max(0, prev.conflictCount - 1),
    }));
  }, [onDataChange]);

  // Add a local change to the sync queue
  const queueChange = useMemoizedCallback((change: Omit<DataChange, 'id' | 'timestamp'>) => {
    const fullChange: DataChange = {
      ...change,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setPendingChanges(prev => [...prev, fullChange]);
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1,
    }));

    // Try to sync immediately if connected
    if (wsStatus.connected) {
      syncChange(fullChange);
    }
  }, [wsStatus.connected]);

  // Sync a single change
  const syncChange = useMemoizedCallback(async (change: DataChange) => {
    try {
      send('data.sync', {
        change,
        tenantId,
      });

      // Remove from pending changes on successful sync
      setPendingChanges(prev => prev.filter(c => c.id !== change.id));
      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: Math.max(0, prev.pendingChanges - 1),
        lastSync: new Date(),
      }));

    } catch (error) {
      console.error('Failed to sync change:', error);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
      }));
    }
  }, [send, tenantId]);

  // Sync all pending changes
  const syncPendingChanges = useMemoizedCallback(async () => {
    if (pendingChanges.length === 0) return;

    setSyncStatus(prev => ({
      ...prev,
      status: 'syncing',
      progress: 0,
    }));

    try {
      for (let i = 0; i < pendingChanges.length; i++) {
        const change = pendingChanges[i];
        await syncChange(change);
        
        setSyncStatus(prev => ({
          ...prev,
          progress: ((i + 1) / pendingChanges.length) * 100,
        }));
      }

      setSyncStatus(prev => ({
        ...prev,
        status: 'idle',
        progress: 100,
      }));

    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
      }));
    }
  }, [pendingChanges, syncChange]);

  // Memoized status indicator
  const statusIndicator = useMemo(() => {
    const getStatusColor = () => {
      switch (syncStatus.status) {
        case 'syncing': return 'blue.500';
        case 'error': return errorColor;
        case 'offline': return warningColor;
        default: return successColor;
      }
    };

    const getStatusText = () => {
      switch (syncStatus.status) {
        case 'syncing': return 'Syncing...';
        case 'error': return 'Sync Error';
        case 'offline': return 'Offline';
        default: return 'Synced';
      }
    };

    return (
      <HStack spacing={2} align="center">
        {syncStatus.status === 'syncing' ? (
          <Spinner size="xs" color="blue.500" />
        ) : (
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={getStatusColor()}
          />
        )}
        
        <Text fontSize="xs" color={getStatusColor()} fontWeight="medium">
          {getStatusText()}
        </Text>

        {syncStatus.pendingChanges > 0 && (
          <Badge size="sm" colorScheme="orange">
            {syncStatus.pendingChanges} pending
          </Badge>
        )}

        {syncStatus.conflictCount > 0 && (
          <Badge size="sm" colorScheme="red">
            {syncStatus.conflictCount} conflicts
          </Badge>
        )}
      </HStack>
    );
  }, [syncStatus, successColor, errorColor, warningColor]);

  // Memoized sync progress
  const syncProgress = useMemo(() => {
    if (syncStatus.status !== 'syncing' || syncStatus.progress === 0) {
      return null;
    }

    return (
      <Box w="full">
        <Progress
          value={syncStatus.progress}
          size="xs"
          colorScheme="blue"
          borderRadius="full"
        />
      </Box>
    );
  }, [syncStatus.status, syncStatus.progress]);

  // Memoized conflict alerts
  const conflictAlerts = useMemo(() => {
    if (conflicts.length === 0) return null;

    return (
      <VStack spacing={2} align="stretch">
        {conflicts.slice(0, 3).map((conflict, index) => (
          <Alert key={`${conflict.local.id}-${conflict.remote.id}`} status="warning" size="sm">
            <AlertIcon />
            <Text fontSize="xs">
              Conflict in {conflict.local.entity} #{conflict.local.entityId}
            </Text>
          </Alert>
        ))}
        
        {conflicts.length > 3 && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            +{conflicts.length - 3} more conflicts
          </Text>
        )}
      </VStack>
    );
  }, [conflicts]);

  return (
    <Box className={className}>
      <VStack spacing={2} align="stretch">
        {/* Status Indicator */}
        {statusIndicator}

        {/* Sync Progress */}
        {syncProgress}

        {/* Conflict Alerts */}
        {conflictAlerts}

        {/* Last Sync Time */}
        {syncStatus.lastSync && (
          <Text fontSize="xs" color="gray.500">
            Last synced: {syncStatus.lastSync.toLocaleTimeString()}
          </Text>
        )}
      </VStack>
    </Box>
  );
});

LiveDataSync.displayName = 'LiveDataSync';

/**
 * Hook for using live data synchronization
 */
export function useLiveDataSync(options: Omit<LiveDataSyncProps, 'className'>) {
  const syncRef = useRef<{
    queueChange: (change: Omit<DataChange, 'id' | 'timestamp'>) => void;
  } | null>(null);

  const queueChange = useMemoizedCallback((change: Omit<DataChange, 'id' | 'timestamp'>) => {
    if (syncRef.current) {
      syncRef.current.queueChange(change);
    }
  }, []);

  const SyncComponent = useMemo(() => {
    return React.forwardRef<any, LiveDataSyncProps>((props, ref) => (
      <LiveDataSync
        {...options}
        {...props}
        ref={(instance) => {
          syncRef.current = instance;
          if (typeof ref === 'function') {
            ref(instance);
          } else if (ref) {
            ref.current = instance;
          }
        }}
      />
    ));
  }, [options]);

  return {
    queueChange,
    SyncComponent,
  };
}

export default LiveDataSync;
