/**
 * Error Fallback Component
 * Error boundary fallback UI for graceful error handling
 */

import React from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Code,
    Collapse,
    useDisclosure,
    Icon,
} from '@chakra-ui/react';
import { FiRefreshCw, FiChevronDown, FiChevronUp, FiAlertTriangle } from 'react-icons/fi';

export interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    resetKeys?: Array<string | number>;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    const { isOpen, onToggle } = useDisclosure();

    const handleReload = () => {
        window.location.reload();
    };

    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <Box
            minH='100vh'
            display='flex'
            alignItems='center'
            justifyContent='center'
            bg='gray.50'
            p={4}
        >
            <Box maxW='2xl' w='full'>
                <VStack spacing={6} textAlign='center'>
                    {/* Error Icon */}
                    <Box p={4} borderRadius='full' bg='red.100' color='red.500'>
                        <Icon as={FiAlertTriangle} boxSize={12} />
                    </Box>

                    {/* Error Title */}
                    <VStack spacing={2}>
                        <Heading size='lg' color='gray.800'>
                            Oops! Something went wrong
                        </Heading>
                        <Text color='gray.600' fontSize='lg'>
                            We encountered an unexpected error. Please try refreshing the page.
                        </Text>
                    </VStack>

                    {/* Error Alert */}
                    <Alert status='error' borderRadius='md' maxW='lg'>
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Error Details:</AlertTitle>
                            <AlertDescription>
                                {error.message || 'An unknown error occurred'}
                            </AlertDescription>
                        </Box>
                    </Alert>

                    {/* Action Buttons */}
                    <VStack spacing={3}>
                        <Button
                            colorScheme='blue'
                            size='lg'
                            leftIcon={<FiRefreshCw />}
                            onClick={resetErrorBoundary}
                        >
                            Try Again
                        </Button>

                        <Button variant='outline' size='md' onClick={handleReload}>
                            Reload Page
                        </Button>
                    </VStack>

                    {/* Developer Information */}
                    {isDevelopment && (
                        <Box w='full' maxW='lg'>
                            <Button
                                variant='ghost'
                                size='sm'
                                rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                onClick={onToggle}
                                mb={3}
                            >
                                {isOpen ? 'Hide' : 'Show'} Technical Details
                            </Button>

                            <Collapse in={isOpen}>
                                <Box
                                    p={4}
                                    bg='gray.100'
                                    borderRadius='md'
                                    textAlign='left'
                                    fontSize='sm'
                                >
                                    <Text fontWeight='semibold' mb={2}>
                                        Error Stack:
                                    </Text>
                                    <Code
                                        display='block'
                                        whiteSpace='pre-wrap'
                                        p={3}
                                        bg='gray.800'
                                        color='green.300'
                                        borderRadius='md'
                                        fontSize='xs'
                                        maxH='200px'
                                        overflowY='auto'
                                    >
                                        {error.stack}
                                    </Code>
                                </Box>
                            </Collapse>
                        </Box>
                    )}

                    {/* Help Text */}
                    <Text fontSize='sm' color='gray.500' maxW='md'>
                        If this problem persists, please contact support with the error details
                        above. We apologize for the inconvenience.
                    </Text>
                </VStack>
            </Box>
        </Box>
    );
};
