import React, { Fragment, memo, useMemo, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useColorModeValue,
  Flex,
  Spacer,
  Badge,
} from '@chakra-ui/react';
import { Container } from '@/shared/components/molecules/Container';
import { AppLayout } from '@/shared/components/layouts/AppLayout';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Mobile Layout Component
 * Responsive layout optimized for mobile devices with touch interactions
 */

export interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = memo(({
  children,
  title = 'Financial App',
  subtitle,
  showBackButton = false,
  onBack,
  headerActions,
  bottomNavigation,
  sidebarContent,
  className,
  fullHeight = true,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('blue.500', 'blue.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const offlineBg = useColorModeValue('orange.100', 'orange.900');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Memoized back handler
  const handleBack = useMemoizedCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  // Memoized header
  const mobileHeader = useMemo(() => (
    <Box
      bg={headerBg}
      color="white"
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <HStack spacing={3} align="center">
        {/* Menu/Back Button */}
        {showBackButton ? (
          <IconButton
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            }
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            aria-label="Go back"
            onClick={handleBack}
          />
        ) : sidebarContent ? (
          <IconButton
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
              </svg>
            }
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            aria-label="Open menu"
            onClick={onOpen}
          />
        ) : null}

        {/* Title */}
        <VStack align="flex-start" spacing={0} flex={1}>
          <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="sm" opacity={0.8} noOfLines={1}>
              {subtitle}
            </Text>
          )}
        </VStack>

        {/* Header Actions */}
        {headerActions}
      </HStack>

      {/* Offline Indicator */}
      {!isOnline && (
        <Box
          bg={offlineBg}
          color="orange.800"
          px={3}
          py={2}
          mt={2}
          borderRadius="md"
          fontSize="sm"
          textAlign="center"
        >
          <HStack justify="center" spacing={2}>
            <Text fontSize="xs">📡</Text>
            <Text fontWeight="medium">You're offline</Text>
          </HStack>
        </Box>
      )}
    </Box>
  ), [
    headerBg,
    showBackButton,
    sidebarContent,
    title,
    subtitle,
    headerActions,
    isOnline,
    offlineBg,
    handleBack,
    onOpen,
  ]);

  // Memoized main content
  const mainContent = useMemo(() => (
    <Box
      flex={1}
      overflow="auto"
      bg={bgColor}
      position="relative"
      // Add safe area padding for iOS devices
      pb={bottomNavigation ? 'env(safe-area-inset-bottom)' : 0}
    >
      {children}
    </Box>
  ), [children, bgColor, bottomNavigation]);

  // Memoized bottom navigation
  const bottomNav = useMemo(() => {
    if (!bottomNavigation) return null;

    return (
      <Box
        bg={bgColor}
        borderTop="1px solid"
        borderTopColor={borderColor}
        px={4}
        py={2}
        position="sticky"
        bottom={0}
        zIndex={1000}
        // Add safe area padding for iOS devices
        pb="env(safe-area-inset-bottom)"
      >
        {bottomNavigation}
      </Box>
    );
  }, [bottomNavigation, bgColor, borderColor]);

  // Memoized sidebar drawer
  const sidebarDrawer = useMemo(() => {
    if (!sidebarContent) return null;

    return (
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Menu
          </DrawerHeader>
          <DrawerBody p={0}>
            {sidebarContent}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }, [isOpen, onClose, sidebarContent]);

  return (
    <Fragment>
      <Flex
        direction="column"
        h={fullHeight ? '100vh' : 'auto'}
        className={className}
        bg={bgColor}
        overflow="hidden"
      >
        {/* Mobile Header */}
        {mobileHeader}

        {/* Main Content */}
        {mainContent}

        {/* Bottom Navigation */}
        {bottomNav}
      </Flex>

      {/* Sidebar Drawer */}
      {sidebarDrawer}
    </Fragment>
  );
});

MobileLayout.displayName = 'MobileLayout';

/**
 * Mobile-optimized App Layout wrapper
 */
export const MobileAppLayout: React.FC<MobileLayoutProps> = memo((props) => {
  // Check if we're on a mobile device
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  if (isMobile) {
    return <MobileLayout {...props} />;
  }

  // Fall back to regular AppLayout for desktop
  return (
    <AppLayout>
      {props.children}
    </AppLayout>
  );
});

MobileAppLayout.displayName = 'MobileAppLayout';

export default MobileLayout;
