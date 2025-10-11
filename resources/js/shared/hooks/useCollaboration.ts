/**
 * Real-time Collaboration Hooks
 * Enables multi-user collaborative editing and real-time synchronization
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from './useSocket';
import { getCurrentOrganizationId } from '../services/alova/alova.config';

// Types for collaboration
export interface CollaborationUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    color: string;
    cursor?: {
        x: number;
        y: number;
    };
    selection?: {
        start: number;
        end: number;
    };
    lastSeen: Date;
}

export interface CollaborationSession {
    id: string;
    documentId: string;
    documentType: 'dashboard' | 'account' | 'transaction' | 'report';
    users: CollaborationUser[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CollaborationChange {
    id: string;
    userId: string;
    type: 'insert' | 'delete' | 'update' | 'move';
    path: string;
    oldValue?: any;
    newValue?: any;
    timestamp: Date;
    applied: boolean;
}

export interface CollaborationConflict {
    id: string;
    changeId: string;
    conflictingChangeId: string;
    type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied';
    resolution?: 'accept_local' | 'accept_remote' | 'merge' | 'manual';
    resolvedAt?: Date;
}

/**
 * Hook for managing collaborative document editing
 */
export function useCollaborativeDocument<T>(
    documentId: string,
    documentType: 'dashboard' | 'account' | 'transaction' | 'report',
    initialData: T,
    options: {
        autoSave?: boolean;
        saveInterval?: number;
        conflictResolution?: 'auto' | 'manual';
        enableCursors?: boolean;
        enablePresence?: boolean;
    } = {}
) {
    const {
        autoSave = true,
        saveInterval = 2000,
        conflictResolution = 'auto',
        enableCursors = true,
        enablePresence = true,
    } = options;

    const { emit, on, joinRoom, leaveRoom, isConnected } = useSocket();
    const [data, setData] = useState<T>(initialData);
    const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
    const [changes, setChanges] = useState<CollaborationChange[]>([]);
    const [conflicts, setConflicts] = useState<CollaborationConflict[]>([]);
    const [isLocked, setIsLocked] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const organizationId = getCurrentOrganizationId();

    // Join collaboration room
    useEffect(() => {
        if (!isConnected || !organizationId) return;

        const room = `collab:${documentType}:${documentId}`;
        joinRoom(room);

        // Announce presence
        if (enablePresence) {
            emit('collaboration:join', {
                documentId,
                documentType,
                organizationId,
                user: {
                    id: 'current-user-id', // Get from auth context
                    name: 'Current User',
                    email: 'user@example.com',
                    color: generateUserColor(),
                },
            });
        }

        return () => {
            leaveRoom(room);
            if (enablePresence) {
                emit('collaboration:leave', { documentId, documentType });
            }
        };
    }, [documentId, documentType, isConnected, organizationId, enablePresence]);

    // Listen for collaboration events
    useEffect(() => {
        if (!isConnected) return;

        // User joined
        const unsubscribeJoin = on('collaboration:user_joined', (user: CollaborationUser) => {
            setCollaborators((prev) => {
                const existing = prev.find((u) => u.id === user.id);
                if (existing) {
                    return prev.map((u) =>
                        u.id === user.id ? { ...u, ...user, lastSeen: new Date() } : u
                    );
                }
                return [...prev, { ...user, lastSeen: new Date() }];
            });
        });

        // User left
        const unsubscribeLeave = on('collaboration:user_left', (userId: string) => {
            setCollaborators((prev) => prev.filter((u) => u.id !== userId));
        });

        // Document changes
        const unsubscribeChange = on('collaboration:change', (change: CollaborationChange) => {
            if (change.userId !== 'current-user-id') {
                // Don't apply own changes
                applyRemoteChange(change);
            }
        });

        // Cursor movements
        const unsubscribeCursor = on(
            'collaboration:cursor',
            (data: { userId: string; cursor: { x: number; y: number } }) => {
                if (enableCursors) {
                    setCollaborators((prev) =>
                        prev.map((user) =>
                            user.id === data.userId
                                ? { ...user, cursor: data.cursor, lastSeen: new Date() }
                                : user
                        )
                    );
                }
            }
        );

        // Conflicts
        const unsubscribeConflict = on(
            'collaboration:conflict',
            (conflict: CollaborationConflict) => {
                setConflicts((prev) => [...prev, conflict]);

                if (conflictResolution === 'auto') {
                    resolveConflict(conflict.id, 'accept_remote');
                }
            }
        );

        // Document locked/unlocked
        const unsubscribeLock = on('collaboration:lock_changed', (locked: boolean) => {
            setIsLocked(locked);
        });

        return () => {
            unsubscribeJoin();
            unsubscribeLeave();
            unsubscribeChange();
            unsubscribeCursor();
            unsubscribeConflict();
            unsubscribeLock();
        };
    }, [isConnected, enableCursors, conflictResolution]);

    // Auto-save functionality
    useEffect(() => {
        if (!autoSave || !hasUnsavedChanges) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveDocument();
        }, saveInterval);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [data, autoSave, saveInterval, hasUnsavedChanges]);

    // Apply remote change to local data
    const applyRemoteChange = useCallback((change: CollaborationChange) => {
        setData((prevData) => {
            try {
                const newData = applyChange(prevData, change);
                setChanges((prev) => [...prev, { ...change, applied: true }]);
                return newData;
            } catch (error) {
                console.error('Failed to apply remote change:', error);
                // Create conflict
                const conflict: CollaborationConflict = {
                    id: generateId(),
                    changeId: change.id,
                    conflictingChangeId: 'local-change',
                    type: 'concurrent_edit',
                };
                setConflicts((prev) => [...prev, conflict]);
                return prevData;
            }
        });
    }, []);

    // Apply change to data structure
    const applyChange = useCallback((data: T, change: CollaborationChange): T => {
        const { type, path, newValue, oldValue: _oldValue } = change;
        const pathArray = path.split('.');

        switch (type) {
            case 'update':
                return updateNestedProperty(data, pathArray, newValue);
            case 'insert':
                return insertNestedProperty(data, pathArray, newValue);
            case 'delete':
                return deleteNestedProperty(data, pathArray);
            case 'move':
                return moveNestedProperty(data, pathArray, newValue);
            default:
                throw new Error(`Unknown change type: ${type}`);
        }
    }, []);

    // Update document data
    const updateData = useCallback(
        (updater: (prevData: T) => T) => {
            setData((prevData) => {
                const newData = updater(prevData);
                const change: CollaborationChange = {
                    id: generateId(),
                    userId: 'current-user-id',
                    type: 'update',
                    path: '', // Calculate path based on diff
                    oldValue: prevData,
                    newValue: newData,
                    timestamp: new Date(),
                    applied: true,
                };

                // Emit change to other collaborators
                emit('collaboration:change', {
                    documentId,
                    documentType,
                    change,
                });

                setChanges((prev) => [...prev, change]);
                setHasUnsavedChanges(true);

                return newData;
            });
        },
        [documentId, documentType, emit]
    );

    // Save document
    const saveDocument = useCallback(async () => {
        try {
            // Emit save event
            emit('collaboration:save', {
                documentId,
                documentType,
                data,
                changes: changes.filter((c) => !c.applied),
            });

            setLastSaved(new Date());
            setHasUnsavedChanges(false);

            // Clear applied changes
            setChanges((prev) => prev.filter((c) => !c.applied));

            console.log('✅ Document saved successfully');
        } catch (error) {
            console.error('❌ Failed to save document:', error);
        }
    }, [documentId, documentType, data, changes, emit]);

    // Resolve conflict
    const resolveConflict = useCallback(
        (conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge') => {
            setConflicts((prev) =>
                prev.map((conflict) =>
                    conflict.id === conflictId
                        ? { ...conflict, resolution, resolvedAt: new Date() }
                        : conflict
                )
            );

            emit('collaboration:resolve_conflict', {
                documentId,
                conflictId,
                resolution,
            });
        },
        [documentId, emit]
    );

    // Update cursor position
    const updateCursor = useCallback(
        (x: number, y: number) => {
            if (!enableCursors) return;

            emit('collaboration:cursor', {
                documentId,
                cursor: { x, y },
            });
        },
        [documentId, enableCursors, emit]
    );

    // Lock/unlock document
    const lockDocument = useCallback(
        (lock: boolean) => {
            emit('collaboration:lock', {
                documentId,
                locked: lock,
            });
        },
        [documentId, emit]
    );

    return {
        // Data
        data,
        updateData,

        // Collaboration
        collaborators,
        isLocked,

        // Changes and conflicts
        changes,
        conflicts,
        resolveConflict,

        // Save state
        lastSaved,
        hasUnsavedChanges,
        saveDocument,

        // Cursor and presence
        updateCursor,

        // Document control
        lockDocument,

        // Connection state
        isConnected,
    };
}

/**
 * Hook for real-time dashboard collaboration
 */
export function useCollaborativeDashboard(dashboardId: string) {
    return useCollaborativeDocument(
        dashboardId,
        'dashboard',
        { widgets: [], layout: null },
        {
            enableCursors: true,
            enablePresence: true,
            autoSave: true,
            saveInterval: 1000, // Faster saves for dashboard
        }
    );
}

/**
 * Hook for collaborative account editing
 */
export function useCollaborativeAccount(accountId: string) {
    return useCollaborativeDocument(
        accountId,
        'account',
        { name: '', code: '', type: 'asset', balance: 0 },
        {
            enableCursors: false, // Less useful for account editing
            enablePresence: true,
            conflictResolution: 'manual', // Manual resolution for financial data
        }
    );
}

/**
 * Hook for collaborative transaction editing
 */
export function useCollaborativeTransaction(transactionId: string) {
    return useCollaborativeDocument(
        transactionId,
        'transaction',
        { amount: 0, description: '', account: null, date: new Date() },
        {
            enablePresence: true,
            conflictResolution: 'manual', // Critical for financial accuracy
            autoSave: false, // Manual save for transactions
        }
    );
}

/**
 * Hook for managing collaboration sessions
 */
export function useCollaborationSessions(organizationId?: number) {
    const { on, emit, isConnected } = useSocket();
    const [sessions, setSessions] = useState<CollaborationSession[]>([]);
    const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([]);

    const orgId = organizationId || getCurrentOrganizationId();

    useEffect(() => {
        if (!isConnected || !orgId) return;

        // Join organization collaboration room
        const _room = `collab:org:${orgId}`;

        // Request current sessions
        emit('collaboration:get_sessions', { organizationId: orgId });

        // Listen for session updates
        const unsubscribeSessions = on(
            'collaboration:sessions_updated',
            (data: { sessions: CollaborationSession[] }) => {
                setSessions(data.sessions);
                setActiveSessions(data.sessions.filter((s) => s.isActive));
            }
        );

        const unsubscribeSessionCreated = on(
            'collaboration:session_created',
            (session: CollaborationSession) => {
                setSessions((prev) => [...prev, session]);
                if (session.isActive) {
                    setActiveSessions((prev) => [...prev, session]);
                }
            }
        );

        const unsubscribeSessionEnded = on('collaboration:session_ended', (sessionId: string) => {
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
        });

        return () => {
            unsubscribeSessions();
            unsubscribeSessionCreated();
            unsubscribeSessionEnded();
        };
    }, [isConnected, orgId, on, emit]);

    const createSession = useCallback(
        (documentId: string, documentType: string) => {
            emit('collaboration:create_session', {
                documentId,
                documentType,
                organizationId: orgId,
            });
        },
        [emit, orgId]
    );

    const endSession = useCallback(
        (sessionId: string) => {
            emit('collaboration:end_session', { sessionId });
        },
        [emit]
    );

    return {
        sessions,
        activeSessions,
        createSession,
        endSession,
        isConnected,
    };
}

// Utility functions
function generateUserColor(): string {
    const colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E9',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function updateNestedProperty(obj: any, path: string[], value: any): any {
    if (path.length === 0) return value;

    const [head, ...tail] = path;
    return {
        ...obj,
        [head]: updateNestedProperty(obj[head], tail, value),
    };
}

function insertNestedProperty(obj: any, path: string[], value: any): any {
    if (path.length === 1) {
        if (Array.isArray(obj)) {
            const index = parseInt(path[0]);
            return [...obj.slice(0, index), value, ...obj.slice(index)];
        } else {
            return { ...obj, [path[0]]: value };
        }
    }

    const [head, ...tail] = path;
    return {
        ...obj,
        [head]: insertNestedProperty(obj[head], tail, value),
    };
}

function deleteNestedProperty(obj: any, path: string[]): any {
    if (path.length === 1) {
        if (Array.isArray(obj)) {
            const index = parseInt(path[0]);
            return [...obj.slice(0, index), ...obj.slice(index + 1)];
        } else {
            const { [path[0]]: _deleted, ...rest } = obj;
            return rest;
        }
    }

    const [head, ...tail] = path;
    return {
        ...obj,
        [head]: deleteNestedProperty(obj[head], tail),
    };
}

function moveNestedProperty(obj: any, _path: string[], _newPath: string): any {
    // Implementation for moving properties
    // This would be more complex and depend on the specific use case
    return obj;
}
