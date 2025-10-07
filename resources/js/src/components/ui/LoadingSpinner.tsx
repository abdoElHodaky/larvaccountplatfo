/**
 * Loading Spinner Component
 * Reusable loading indicator with multiple sizes and variants
 */

import React from 'react';
import { Spinner, SpinnerProps, Box, Text, VStack } from '@chakra-ui/react';

export interface LoadingSpinnerProps extends Omit<SpinnerProps, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const sizeMap = {
  xs: '16px',
  sm: '20px',
  md: '32px',
  lg: '48px',
  xl: '64px',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  overlay = false,
  fullScreen = false,
  color = 'blue.500',
  ...props
}) => {
  const spinner = (
    <VStack spacing={3}>
      <Spinner
        size={sizeMap[size]}
        color={color}
        thickness="3px"
        speed="0.8s"
        {...props}
      />
      {label && (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {label}
        </Text>
      )}
    </VStack>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="rgba(255, 255, 255, 0.9)"
        zIndex={9999}
        backdropFilter="blur(2px)"
      >
        {spinner}
      </Box>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="rgba(255, 255, 255, 0.8)"
        zIndex={10}
        borderRadius="md"
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

