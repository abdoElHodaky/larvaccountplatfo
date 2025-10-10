import React, { memo, useMemo } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Mobile Navigation Component
 * Bottom navigation bar optimized for mobile touch interactions
 */

export interface MobileNavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
  path: string;
  isActive?: boolean;
}

export interface MobileNavigationProps {
  items: MobileNavigationItem[];
  onItemClick: (item: MobileNavigationItem) => void;
  activeItemId?: string;
  className?: string;
  variant?: 'default' | 'financial';
}

export const MobileNavigation: React.FC<MobileNavigationProps> = memo(({
  items,
  onItemClick,
  activeItemId,
  className,
  variant = 'default',
}) => {
  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = variant === 'financial' 
    ? useColorModeValue('blue.500', 'blue.400')
    : useColorModeValue('blue.500', 'blue.400');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  const activeBg = useColorModeValue('blue.50', 'blue.900');

  // Memoized item click handler
  const handleItemClick = useMemoizedCallback((item: MobileNavigationItem) => {
    onItemClick(item);
  }, [onItemClick]);

  // Memoized navigation items
  const navigationItems = useMemo(() => (
    <HStack spacing={0} w="full" justify="space-around">
      {items.map((item) => {
        const isActive = activeItemId === item.id || item.isActive;
        
        return (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={isActive}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            activeBg={activeBg}
            onClick={handleItemClick}
          />
        );
      })}
    </HStack>
  ), [items, activeItemId, activeColor, inactiveColor, activeBg, handleItemClick]);

  return (
    <Box
      className={className}
      bg={bgColor}
      borderTop="1px solid"
      borderTopColor={borderColor}
      px={2}
      py={1}
      position="sticky"
      bottom={0}
      zIndex={1000}
      // Add safe area padding for iOS devices
      pb="env(safe-area-inset-bottom)"
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
    >
      {navigationItems}
    </Box>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

/**
 * Individual Navigation Item Component
 */
interface NavigationItemProps {
  item: MobileNavigationItem;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  activeBg: string;
  onClick: (item: MobileNavigationItem) => void;
}

const NavigationItem: React.FC<NavigationItemProps> = memo(({
  item,
  isActive,
  activeColor,
  inactiveColor,
  activeBg,
  onClick,
}) => {
  // Memoized click handler
  const handleClick = useMemoizedCallback(() => {
    onClick(item);
  }, [onClick, item]);

  return (
    <Center
      flex={1}
      py={2}
      px={1}
      borderRadius="lg"
      bg={isActive ? activeBg : 'transparent'}
      cursor="pointer"
      transition="all 0.2s ease"
      _active={{ transform: 'scale(0.95)' }}
      onClick={handleClick}
      position="relative"
    >
      <VStack spacing={1} align="center">
        {/* Icon with badge */}
        <Box position="relative">
          <Box
            color={isActive ? activeColor : inactiveColor}
            fontSize="20px"
            transition="color 0.2s ease"
          >
            {isActive && item.activeIcon ? item.activeIcon : item.icon}
          </Box>
          
          {/* Badge */}
          {item.badge && (
            <Badge
              position="absolute"
              top="-8px"
              right="-8px"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </Box>

        {/* Label */}
        <Text
          fontSize="xs"
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isActive ? activeColor : inactiveColor}
          noOfLines={1}
          textAlign="center"
          transition="color 0.2s ease"
        >
          {item.label}
        </Text>
      </VStack>
    </Center>
  );
});

NavigationItem.displayName = 'NavigationItem';

/**
 * Financial Navigation with predefined items
 */
export const FinancialMobileNavigation: React.FC<Omit<MobileNavigationProps, 'items' | 'variant'>> = memo((props) => {
  const financialItems: MobileNavigationItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
        </svg>
      ),
      activeIcon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
        </svg>
      ),
      path: '/dashboard',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" />
        </svg>
      ),
      path: '/accounts',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V2H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
        </svg>
      ),
      path: '/transactions',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z" />
        </svg>
      ),
      path: '/reports',
    },
    {
      id: 'more',
      label: 'More',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z" />
        </svg>
      ),
      path: '/more',
    },
  ], []);

  return (
    <MobileNavigation
      {...props}
      items={financialItems}
      variant="financial"
    />
  );
});

FinancialMobileNavigation.displayName = 'FinancialMobileNavigation';

export default MobileNavigation;
