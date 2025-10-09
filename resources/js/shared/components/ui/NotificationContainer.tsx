/**
 * Notification Container Component
 * Global notification system with toast-like notifications
 */

import React from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
  Button,
  HStack,
  useColorModeValue,
  Slide,
  ScaleFade,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications, useAppActions } from '../../stores/appStore';

const MotionBox = motion(Box);

export const NotificationContainer: React.FC = () => {
  const notifications = useNotifications();
  const { removeNotification } = useAppActions();

  const bg = useColorModeValue('white', 'gray.800');
  const shadow = useColorModeValue('lg', 'dark-lg');

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      zIndex={9999}
      maxW="400px"
      w="full"
    >
      <VStack spacing={3} align="stretch">
        <AnimatePresence>
          {notifications.map((notification) => (
            <MotionBox
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Alert
                status={notification.type}
                bg={bg}
                boxShadow={shadow}
                borderRadius="md"
                border="1px"
                borderColor={`${notification.type}.200`}
                position="relative"
                pr={10}
              >
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="sm" fontWeight="semibold">
                    {notification.title}
                  </AlertTitle>
                  <AlertDescription fontSize="sm" mt={1}>
                    {notification.message}
                  </AlertDescription>
                  
                  {/* Action Buttons */}
                  {notification.actions && notification.actions.length > 0 && (
                    <HStack spacing={2} mt={3}>
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="xs"
                          variant={action.variant || 'solid'}
                          colorScheme={notification.type === 'error' ? 'red' : 'blue'}
                          onClick={() => {
                            action.action();
                            removeNotification(notification.id);
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </HStack>
                  )}
                </Box>
                
                {/* Close Button */}
                <CloseButton
                  position="absolute"
                  right={2}
                  top={2}
                  size="sm"
                  onClick={() => removeNotification(notification.id)}
                />
              </Alert>
            </MotionBox>
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
};

