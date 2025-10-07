import React, { Fragment, memo, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CardContainer } from '@/Components/Base';
import { useMemoizedCallback } from '@/Hooks';

/**
 * Performance-Optimized Chart Container Component
 * Provides consistent wrapper for all chart types with export and interaction capabilities
 */

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  height?: number | string;
  width?: number | string;
  variant?: 'default' | 'financial' | 'compact';
  showExportMenu?: boolean;
  showFullscreenButton?: boolean;
  onExport?: (format: 'png' | 'pdf' | 'csv' | 'excel') => void;
  onFullscreen?: () => void;
  className?: string;
  headerActions?: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = memo(({
  title,
  subtitle,
  children,
  loading = false,
  error,
  height = 400,
  width = '100%',
  variant = 'default',
  showExportMenu = true,
  showFullscreenButton = true,
  onExport,
  onFullscreen,
  className,
  headerActions,
}) => {
  // Memoized color values
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');

  // Memoized export handler
  const handleExport = useMemoizedCallback((format: 'png' | 'pdf' | 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

  // Memoized fullscreen handler
  const handleFullscreen = useMemoizedCallback(() => {
    if (onFullscreen) {
      onFullscreen();
    }
  }, [onFullscreen]);

  // Memoized variant styles
  const variantStyles = useMemo(() => {
    const styles = {
      default: {
        borderWidth: '1px',
        borderColor,
        borderRadius: 'md',
      },
      financial: {
        borderWidth: '1px',
        borderColor,
        borderRadius: 'md',
        borderLeft: '4px solid',
        borderLeftColor: 'blue.400',
        bg: useColorModeValue('blue.50', 'blue.900'),
      },
      compact: {
        borderWidth: '1px',
        borderColor,
        borderRadius: 'sm',
        p: 2,
      },
    };
    return styles[variant];
  }, [variant, borderColor]);

  // Memoized header content
  const headerContent = useMemo(() => (
    <Fragment>
      <HStack justify="space-between" align="flex-start" w="full">
        <VStack align="flex-start" spacing={0} flex={1}>
          <Text
            fontSize="lg"
            fontWeight="semibold"
            color={titleColor}
            noOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              fontSize="sm"
              color={subtitleColor}
              noOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </VStack>

        <HStack spacing={2}>
          {headerActions}
          
          {showExportMenu && onExport && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                }
                size="sm"
                variant="ghost"
                aria-label="Export chart"
              />
              <MenuList>
                <MenuItem onClick={() => handleExport('png')}>
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>
                  Export as Excel
                </MenuItem>
              </MenuList>
            </Menu>
          )}

          {showFullscreenButton && onFullscreen && (
            <IconButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z" />
                </svg>
              }
              size="sm"
              variant="ghost"
              aria-label="Fullscreen"
              onClick={handleFullscreen}
            />
          )}
        </HStack>
      </HStack>
    </Fragment>
  ), [
    title,
    subtitle,
    titleColor,
    subtitleColor,
    headerActions,
    showExportMenu,
    showFullscreenButton,
    onExport,
    onFullscreen,
    handleExport,
    handleFullscreen,
  ]);

  // Memoized chart content
  const chartContent = useMemo(() => {
    if (loading) {
      return (
        <VStack spacing={4} align="stretch" h={height}>
          <Skeleton height="20px" width="60%" />
          <Skeleton height="calc(100% - 40px)" />
        </VStack>
      );
    }

    if (error) {
      return (
        <Alert status="error" h={height} flexDirection="column" justifyContent="center">
          <AlertIcon />
          <Text textAlign="center">{error}</Text>
        </Alert>
      );
    }

    return (
      <Box
        h={height}
        w={width}
        position="relative"
        overflow="hidden"
      >
        {children}
      </Box>
    );
  }, [loading, error, height, width, children]);

  return (
    <CardContainer
      header={headerContent}
      className={className}
      bg={bgColor}
      {...variantStyles}
    >
      {chartContent}
    </CardContainer>
  );
});

ChartContainer.displayName = 'ChartContainer';

/**
 * Financial Chart Container with specialized styling
 */
export const FinancialChartContainer: React.FC<Omit<ChartContainerProps, 'variant'>> = memo((props) => (
  <ChartContainer {...props} variant="financial" />
));

FinancialChartContainer.displayName = 'FinancialChartContainer';

/**
 * Compact Chart Container for dense layouts
 */
export const CompactChartContainer: React.FC<Omit<ChartContainerProps, 'variant'>> = memo((props) => (
  <ChartContainer {...props} variant="compact" height={250} />
));

CompactChartContainer.displayName = 'CompactChartContainer';

export default ChartContainer;
