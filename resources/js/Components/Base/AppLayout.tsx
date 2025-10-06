import React, { Fragment, memo, useMemo } from 'react';
import {
  Box,
  Container,
  Flex,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';

/**
 * Performance-Optimized App Layout Component
 * Uses React.Fragment and memoization for optimal rendering
 */

interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  withSidebar?: boolean;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = memo(({
  children,
  header,
  sidebar,
  footer,
  maxWidth = '7xl',
  withSidebar = false,
  className,
}) => {
  // Memoized color values for performance
  const bgColor = useColorModeValue('bg-canvas', 'bg-canvas');
  const borderColor = useColorModeValue('border-default', 'border-default');
  
  // Responsive sidebar width
  const sidebarWidth = useBreakpointValue({
    base: '0',
    md: withSidebar ? '64' : '0',
    lg: withSidebar ? '72' : '0',
  });

  // Memoized layout styles to prevent unnecessary recalculations
  const layoutStyles = useMemo(() => ({
    minHeight: '100vh',
    bg: bgColor,
  }), [bgColor]);

  const mainContentStyles = useMemo(() => ({
    flex: 1,
    marginLeft: withSidebar ? sidebarWidth : 0,
    transition: 'margin-left 0.2s ease-in-out',
  }), [withSidebar, sidebarWidth]);

  const sidebarStyles = useMemo(() => ({
    position: 'fixed' as const,
    left: 0,
    top: 0,
    height: '100vh',
    width: sidebarWidth,
    bg: 'bg-surface',
    borderRight: '1px solid',
    borderColor,
    zIndex: 'docked',
    transform: withSidebar ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.2s ease-in-out',
  }), [sidebarWidth, borderColor, withSidebar]);

  return (
    <Box {...layoutStyles} className={className}>
      {/* Sidebar - Only render if provided and withSidebar is true */}
      {withSidebar && sidebar && (
        <Box {...sidebarStyles}>
          {sidebar}
        </Box>
      )}

      {/* Main Content Area */}
      <Flex direction="column" {...mainContentStyles}>
        {/* Header - Use Fragment to avoid unnecessary wrapper */}
        {header && (
          <Fragment>
            {header}
          </Fragment>
        )}

        {/* Main Content */}
        <Box as="main" flex="1" py={6}>
          <Container maxW={maxWidth} px={4}>
            {children}
          </Container>
        </Box>

        {/* Footer - Use Fragment to avoid unnecessary wrapper */}
        {footer && (
          <Fragment>
            {footer}
          </Fragment>
        )}
      </Flex>
    </Box>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;
