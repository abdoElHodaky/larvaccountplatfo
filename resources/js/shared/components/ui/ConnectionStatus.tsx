/**
 * Connection Status Component
 * Shows real-time connection status with Socket.IO
 */

import React from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiWifi, 
  FiWifiOff, 
  FiLoader, 
  FiAlertCircle,
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';
import { useConnectionStatus } from '../../hooks/useRealTime';

export const ConnectionStatus: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    connectionHistory,
  } = useConnectionStatus();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getStatusColor = () => {
    if (connectionError) return 'red';
    if (isConnecting) return 'yellow';
    if (isConnected) return 'green';
    return 'gray';
  };

  const getStatusIcon = () => {
    if (connectionError) return FiAlertCircle;
    if (isConnecting) return FiLoader;
    if (isConnected) return FiWifi;
    return FiWifiOff;
  };

  const getStatusText = () => {
    if (connectionError) return 'Connection Error';
    if (isConnecting) {
      return reconnectAttempts > 0 
        ? `Reconnecting (${reconnectAttempts})` 
        : 'Connecting';
    }
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const StatusIndicator = () => (
    <HStack spacing={2}>
      <Icon
        as={getStatusIcon()}
        color={`${getStatusColor()}.500`}
        boxSize={4}
        className={isConnecting ? 'animate-spin' : ''}
      />
      <Text fontSize="sm" color={`${getStatusColor()}.600`}>
        {getStatusText()}
      </Text>
      <Badge
        colorScheme={getStatusColor()}
        variant="subtle"
        size="sm"
      >
        Real-time
      </Badge>
    </HStack>
  );

  const ConnectionHistory = () => (
    <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
      <Text fontWeight="semibold" fontSize="sm">
        Connection History
      </Text>
      {connectionHistory.length === 0 ? (
        <Text fontSize="xs" color="gray.500">
          No connection events yet
        </Text>
      ) : (
        connectionHistory.map((event, index) => (
          <HStack key={index} spacing={2} fontSize="xs">
            <Icon
              as={
                event.event === 'connected' ? FiCheck :
                event.event === 'error' ? FiX : FiClock
              }
              color={
                event.event === 'connected' ? 'green.500' :
                event.event === 'error' ? 'red.500' : 'gray.500'
              }
              boxSize={3}
            />
            <Text flex={1}>
              {event.event === 'connected' && 'Connected'}
              {event.event === 'disconnected' && 'Disconnected'}
              {event.event === 'error' && `Error: ${event.details}`}
            </Text>
            <Text color="gray.500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </Text>
          </HStack>
        ))
      )}
    </VStack>
  );

  return (
    <Popover placement="top-end">
      <PopoverTrigger>
        <Box
          p={2}
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
          bg={bgColor}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
          transition="all 0.2s"
        >
          <StatusIndicator />
        </Box>
      </PopoverTrigger>
      
      <PopoverContent maxW="300px">
        <PopoverBody>
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>
                Real-time Status
              </Text>
              <StatusIndicator />
              
              {connectionError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {connectionError}
                </Text>
              )}
              
              {reconnectAttempts > 0 && (
                <Text fontSize="xs" color="yellow.600" mt={1}>
                  Reconnection attempt {reconnectAttempts} of 5
                </Text>
              )}
            </Box>
            
            <ConnectionHistory />
            
            <Box pt={2} borderTop="1px" borderColor={borderColor}>
              <Text fontSize="xs" color="gray.500">
                Real-time features: {isConnected ? 'Active' : 'Inactive'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                • Live notifications
              </Text>
              <Text fontSize="xs" color="gray.500">
                • Transaction updates
              </Text>
              <Text fontSize="xs" color="gray.500">
                • User presence
              </Text>
            </Box>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Compact connection status for headers/toolbars
 */
export const CompactConnectionStatus: React.FC = () => {
  const { isConnected, isConnecting, connectionError } = useConnectionStatus();

  const getStatusColor = () => {
    if (connectionError) return 'red';
    if (isConnecting) return 'yellow';
    if (isConnected) return 'green';
    return 'gray';
  };

  const getStatusIcon = () => {
    if (connectionError) return FiAlertCircle;
    if (isConnecting) return FiLoader;
    if (isConnected) return FiWifi;
    return FiWifiOff;
  };

  return (
    <Tooltip
      label={
        connectionError ? 'Connection Error' :
        isConnecting ? 'Connecting...' :
        isConnected ? 'Real-time Connected' :
        'Disconnected'
      }
      placement="bottom"
    >
      <Box>
        <Icon
          as={getStatusIcon()}
          color={`${getStatusColor()}.500`}
          boxSize={4}
          className={isConnecting ? 'animate-spin' : ''}
        />
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus;

