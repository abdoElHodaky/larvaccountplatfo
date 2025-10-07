import React, { Fragment, memo, useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  AvatarGroup,
  Badge,
  useColorModeValue,
  Tooltip,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useFinancialWebSocket } from '@/Utils/websocket';
import { useMemoizedCallback } from '@/Hooks';

/**
 * Performance-Optimized Collaborative Editor Component
 * Handles real-time collaborative editing with user presence and cursor tracking
 */

export interface CollaborativeUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      start: number;
      end: number;
    };
  };
  lastActivity: Date;
}

export interface EditOperation {
  id: string;
  type: 'insert' | 'delete' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: any;
  userId: string;
  timestamp: Date;
}

export interface CollaborativeEditorProps {
  documentId: string;
  tenantId?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onOperationApplied?: (operation: EditOperation) => void;
  className?: string;
  readOnly?: boolean;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = memo(({
  documentId,
  tenantId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  initialContent = '',
  onContentChange,
  onOperationApplied,
  className,
  readOnly = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [collaborators, setCollaborators] = useState<CollaborativeUser[]>([]);
  const [operations, setOperations] = useState<EditOperation[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operationQueueRef = useRef<EditOperation[]>([]);

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cursorColors = [
    'red.500', 'blue.500', 'green.500', 'purple.500', 
    'orange.500', 'pink.500', 'teal.500', 'cyan.500'
  ];

  // WebSocket connection
  const { status, connect, subscribe, send } = useFinancialWebSocket(tenantId);

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Join document collaboration session
  useEffect(() => {
    if (status.connected) {
      send('document.join', {
        documentId,
        user: {
          id: currentUserId,
          name: currentUserName,
          avatar: currentUserAvatar,
          color: cursorColors[Math.floor(Math.random() * cursorColors.length)],
        },
      });
    }
  }, [status.connected, documentId, currentUserId, currentUserName, currentUserAvatar]);

  // Subscribe to collaboration events
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // User joined
    unsubscribers.push(
      subscribe('document.user-joined', (message) => {
        const user: CollaborativeUser = {
          ...message.payload.user,
          lastActivity: new Date(message.timestamp),
        };
        
        setCollaborators(prev => {
          const existing = prev.find(u => u.id === user.id);
          if (existing) {
            return prev.map(u => u.id === user.id ? user : u);
          }
          return [...prev, user];
        });
      })
    );

    // User left
    unsubscribers.push(
      subscribe('document.user-left', (message) => {
        setCollaborators(prev => 
          prev.filter(u => u.id !== message.payload.userId)
        );
      })
    );

    // Operation received
    unsubscribers.push(
      subscribe('document.operation', (message) => {
        const operation: EditOperation = {
          ...message.payload.operation,
          timestamp: new Date(message.timestamp),
        };
        
        if (operation.userId !== currentUserId) {
          applyOperation(operation);
        }
      })
    );

    // Cursor update
    unsubscribers.push(
      subscribe('document.cursor', (message) => {
        const { userId, cursor } = message.payload;
        
        if (userId !== currentUserId) {
          setCollaborators(prev =>
            prev.map(u => 
              u.id === userId 
                ? { ...u, cursor, lastActivity: new Date(message.timestamp) }
                : u
            )
          );
        }
      })
    );

    // Typing indicator
    unsubscribers.push(
      subscribe('document.typing', (message) => {
        const { userId, isTyping } = message.payload;
        
        if (userId !== currentUserId) {
          setCollaborators(prev =>
            prev.map(u => 
              u.id === userId 
                ? { ...u, lastActivity: new Date(message.timestamp) }
                : u
            )
          );
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, currentUserId]);

  // Apply operation to content
  const applyOperation = useMemoizedCallback((operation: EditOperation) => {
    setContent(prev => {
      let newContent = prev;
      
      switch (operation.type) {
        case 'insert':
          newContent = 
            prev.slice(0, operation.position) + 
            (operation.content || '') + 
            prev.slice(operation.position);
          break;
          
        case 'delete':
          newContent = 
            prev.slice(0, operation.position) + 
            prev.slice(operation.position + (operation.length || 0));
          break;
          
        case 'format':
          // Handle formatting operations
          break;
      }
      
      return newContent;
    });

    setOperations(prev => [...prev, operation]);
    
    if (onOperationApplied) {
      onOperationApplied(operation);
    }
  }, [onOperationApplied]);

  // Send operation to other collaborators
  const sendOperation = useMemoizedCallback((operation: Omit<EditOperation, 'id' | 'userId' | 'timestamp'>) => {
    const fullOperation: EditOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUserId,
      timestamp: new Date(),
    };

    send('document.operation', {
      documentId,
      operation: fullOperation,
    });

    setOperations(prev => [...prev, fullOperation]);
  }, [send, documentId, currentUserId]);

  // Handle content changes
  const handleContentChange = useMemoizedCallback((newContent: string) => {
    if (readOnly) return;

    const oldContent = content;
    setContent(newContent);

    // Calculate diff and create operations
    const operations = calculateDiff(oldContent, newContent);
    operations.forEach(op => sendOperation(op));

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      send('document.typing', {
        documentId,
        userId: currentUserId,
        isTyping: true,
      });
    }

    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      send('document.typing', {
        documentId,
        userId: currentUserId,
        isTyping: false,
      });
    }, 1000);

    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [content, readOnly, isTyping, send, documentId, currentUserId, onContentChange, sendOperation]);

  // Handle cursor/selection changes
  const handleSelectionChange = useMemoizedCallback(() => {
    if (readOnly) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cursor = {
        x: 0, // Would need to calculate actual position
        y: 0,
        selection: {
          start: range.startOffset,
          end: range.endOffset,
        },
      };

      send('document.cursor', {
        documentId,
        userId: currentUserId,
        cursor,
      });
    }
  }, [readOnly, send, documentId, currentUserId]);

  // Memoized collaborator avatars
  const collaboratorAvatars = useMemo(() => {
    const activeCollaborators = collaborators.filter(
      user => Date.now() - user.lastActivity.getTime() < 300000 // 5 minutes
    );

    if (activeCollaborators.length === 0) return null;

    return (
      <HStack spacing={2} align="center">
        <Text fontSize="xs" color="gray.500">
          {activeCollaborators.length} collaborator{activeCollaborators.length !== 1 ? 's' : ''}
        </Text>
        
        <AvatarGroup size="xs" max={5}>
          {activeCollaborators.map(user => (
            <Tooltip key={user.id} label={user.name} placement="top">
              <Avatar
                name={user.name}
                src={user.avatar}
                bg={user.color}
                color="white"
                size="xs"
              />
            </Tooltip>
          ))}
        </AvatarGroup>
      </HStack>
    );
  }, [collaborators]);

  // Memoized cursor overlays
  const cursorOverlays = useMemo(() => {
    return collaborators
      .filter(user => user.cursor && user.id !== currentUserId)
      .map(user => (
        <Box
          key={user.id}
          position="absolute"
          left={`${user.cursor!.x}px`}
          top={`${user.cursor!.y}px`}
          pointerEvents="none"
          zIndex={10}
        >
          {/* Cursor line */}
          <Box
            w="2px"
            h="20px"
            bg={user.color}
            position="relative"
          >
            {/* User label */}
            <Box
              position="absolute"
              top="-25px"
              left="0"
              bg={user.color}
              color="white"
              px={2}
              py={1}
              borderRadius="sm"
              fontSize="xs"
              whiteSpace="nowrap"
            >
              {user.name}
            </Box>
          </Box>
        </Box>
      ));
  }, [collaborators, currentUserId]);

  return (
    <Box className={className} position="relative">
      <VStack spacing={3} align="stretch">
        {/* Collaboration Header */}
        <Flex align="center" justify="space-between">
          <HStack spacing={2}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={status.connected ? 'green.400' : 'red.400'}
            />
            <Text fontSize="xs" color="gray.500">
              {status.connected ? 'Connected' : 'Disconnected'}
            </Text>
          </HStack>

          <Spacer />

          {collaboratorAvatars}
        </Flex>

        {/* Editor Container */}
        <Box position="relative">
          {/* Content Editor */}
          <Box
            ref={editorRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            p={4}
            minH="200px"
            outline="none"
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
            }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              handleContentChange(target.textContent || '');
            }}
            onSelect={handleSelectionChange}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Cursor Overlays */}
          {cursorOverlays}
        </Box>

        {/* Status Bar */}
        <HStack spacing={4} fontSize="xs" color="gray.500">
          <Text>{content.length} characters</Text>
          <Text>{operations.length} operations</Text>
          {isTyping && (
            <HStack spacing={1}>
              <Box w={1} h={1} bg="blue.500" borderRadius="full" />
              <Text>Typing...</Text>
            </HStack>
          )}
        </HStack>
      </VStack>
    </Box>
  );
});

CollaborativeEditor.displayName = 'CollaborativeEditor';

/**
 * Calculate diff between old and new content
 */
function calculateDiff(oldContent: string, newContent: string): Array<Omit<EditOperation, 'id' | 'userId' | 'timestamp'>> {
  const operations: Array<Omit<EditOperation, 'id' | 'userId' | 'timestamp'>> = [];
  
  // Simple diff algorithm - in production, use a more sophisticated approach
  if (newContent.length > oldContent.length) {
    // Content was inserted
    const insertPosition = findInsertPosition(oldContent, newContent);
    const insertedContent = newContent.slice(insertPosition, insertPosition + (newContent.length - oldContent.length));
    
    operations.push({
      type: 'insert',
      position: insertPosition,
      content: insertedContent,
    });
  } else if (newContent.length < oldContent.length) {
    // Content was deleted
    const deletePosition = findDeletePosition(oldContent, newContent);
    const deleteLength = oldContent.length - newContent.length;
    
    operations.push({
      type: 'delete',
      position: deletePosition,
      length: deleteLength,
    });
  }
  
  return operations;
}

/**
 * Find position where content was inserted
 */
function findInsertPosition(oldContent: string, newContent: string): number {
  for (let i = 0; i < Math.min(oldContent.length, newContent.length); i++) {
    if (oldContent[i] !== newContent[i]) {
      return i;
    }
  }
  return oldContent.length;
}

/**
 * Find position where content was deleted
 */
function findDeletePosition(oldContent: string, newContent: string): number {
  for (let i = 0; i < Math.min(oldContent.length, newContent.length); i++) {
    if (oldContent[i] !== newContent[i]) {
      return i;
    }
  }
  return newContent.length;
}

export default CollaborativeEditor;
