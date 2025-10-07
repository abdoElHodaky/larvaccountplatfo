import React, { Fragment, memo, useMemo, useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  useColorModeValue,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useMemoizedCallback } from '@/Hooks';

/**
 * Performance-Optimized Swipeable Cards Component
 * Touch-friendly card interface with swipe gestures for mobile
 */

export interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  backgroundColor: string;
  action: (item: any) => void;
}

export interface SwipeableCardItem {
  id: string;
  content: React.ReactNode;
  data?: any;
}

export interface SwipeableCardsProps {
  items: SwipeableCardItem[];
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (item: SwipeableCardItem, direction: 'left' | 'right', action?: SwipeAction) => void;
  onCardClick?: (item: SwipeableCardItem) => void;
  className?: string;
  cardSpacing?: number;
  swipeThreshold?: number;
  animationDuration?: number;
}

export const SwipeableCards: React.FC<SwipeableCardsProps> = memo(({
  items,
  leftActions = [],
  rightActions = [],
  onSwipe,
  onCardClick,
  className,
  cardSpacing = 2,
  swipeThreshold = 80,
  animationDuration = 200,
}) => {
  const [swipedCard, setSwipedCard] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Memoized cards
  const cards = useMemo(() => (
    <VStack spacing={cardSpacing} align="stretch">
      {items.map((item) => (
        <SwipeableCard
          key={item.id}
          item={item}
          leftActions={leftActions}
          rightActions={rightActions}
          isSwipedCard={swipedCard === item.id}
          swipeDirection={swipeDirection}
          swipeThreshold={swipeThreshold}
          animationDuration={animationDuration}
          bgColor={bgColor}
          borderColor={borderColor}
          onSwipe={onSwipe}
          onCardClick={onCardClick}
          onSwipeStateChange={(cardId, direction) => {
            setSwipedCard(cardId);
            setSwipeDirection(direction);
          }}
        />
      ))}
    </VStack>
  ), [
    items,
    leftActions,
    rightActions,
    swipedCard,
    swipeDirection,
    cardSpacing,
    swipeThreshold,
    animationDuration,
    bgColor,
    borderColor,
    onSwipe,
    onCardClick,
  ]);

  return (
    <Box className={className}>
      {cards}
    </Box>
  );
});

SwipeableCards.displayName = 'SwipeableCards';

/**
 * Individual Swipeable Card Component
 */
interface SwipeableCardProps {
  item: SwipeableCardItem;
  leftActions: SwipeAction[];
  rightActions: SwipeAction[];
  isSwipedCard: boolean;
  swipeDirection: 'left' | 'right' | null;
  swipeThreshold: number;
  animationDuration: number;
  bgColor: string;
  borderColor: string;
  onSwipe?: (item: SwipeableCardItem, direction: 'left' | 'right', action?: SwipeAction) => void;
  onCardClick?: (item: SwipeableCardItem) => void;
  onSwipeStateChange: (cardId: string | null, direction: 'left' | 'right' | null) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = memo(({
  item,
  leftActions,
  rightActions,
  isSwipedCard,
  swipeDirection,
  swipeThreshold,
  animationDuration,
  bgColor,
  borderColor,
  onSwipe,
  onCardClick,
  onSwipeStateChange,
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [currentTransform, setCurrentTransform] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Touch handlers
  const handleTouchStart = useMemoizedCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, []);

  const handleTouchMove = useMemoizedCallback((e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // Only handle horizontal swipes
    if (deltaY > 50) return;

    // Prevent default to avoid scrolling
    e.preventDefault();

    // Update transform
    setCurrentTransform(deltaX);

    // Determine swipe direction and update state
    if (Math.abs(deltaX) > swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      onSwipeStateChange(item.id, direction);
    } else {
      onSwipeStateChange(null, null);
    }
  }, [touchStart, isDragging, swipeThreshold, item.id, onSwipeStateChange]);

  const handleTouchEnd = useMemoizedCallback(() => {
    if (!touchStart || !isDragging) return;

    setIsDragging(false);
    setTouchStart(null);

    // Determine if swipe was significant enough
    if (Math.abs(currentTransform) > swipeThreshold) {
      const direction = currentTransform > 0 ? 'right' : 'left';
      const actions = direction === 'right' ? rightActions : leftActions;
      
      if (actions.length > 0 && onSwipe) {
        onSwipe(item, direction, actions[0]); // Use first action by default
      }
    }

    // Reset transform
    setCurrentTransform(0);
    onSwipeStateChange(null, null);
  }, [
    touchStart,
    isDragging,
    currentTransform,
    swipeThreshold,
    item,
    leftActions,
    rightActions,
    onSwipe,
    onSwipeStateChange,
  ]);

  // Card click handler
  const handleCardClick = useMemoizedCallback(() => {
    if (!isDragging && Math.abs(currentTransform) < 10 && onCardClick) {
      onCardClick(item);
    }
  }, [isDragging, currentTransform, onCardClick, item]);

  // Action click handler
  const handleActionClick = useMemoizedCallback((action: SwipeAction, e: React.MouseEvent) => {
    e.stopPropagation();
    action.action(item.data || item);
    onSwipeStateChange(null, null);
  }, [item, onSwipeStateChange]);

  // Memoized transform value
  const transformValue = useMemo(() => {
    if (isDragging) {
      return currentTransform;
    }
    
    if (isSwipedCard && swipeDirection) {
      return swipeDirection === 'right' ? swipeThreshold + 20 : -(swipeThreshold + 20);
    }
    
    return 0;
  }, [isDragging, currentTransform, isSwipedCard, swipeDirection, swipeThreshold]);

  // Memoized background actions
  const backgroundActions = useMemo(() => {
    if (!isSwipedCard || !swipeDirection) return null;

    const actions = swipeDirection === 'right' ? rightActions : leftActions;
    const isLeft = swipeDirection === 'left';

    return (
      <HStack
        position="absolute"
        top={0}
        bottom={0}
        left={isLeft ? 0 : undefined}
        right={!isLeft ? 0 : undefined}
        bg={actions[0]?.backgroundColor || 'red.500'}
        px={4}
        spacing={2}
        align="center"
        zIndex={1}
      >
        {actions.map((action) => (
          <IconButton
            key={action.id}
            icon={action.icon}
            size="sm"
            variant="ghost"
            color={action.color}
            aria-label={action.label}
            onClick={(e) => handleActionClick(action, e)}
          />
        ))}
      </HStack>
    );
  }, [isSwipedCard, swipeDirection, leftActions, rightActions, handleActionClick]);

  return (
    <Box position="relative" overflow="hidden" borderRadius="md">
      {/* Background Actions */}
      {backgroundActions}

      {/* Card Content */}
      <Box
        ref={cardRef}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        position="relative"
        zIndex={2}
        transform={`translateX(${transformValue}px)`}
        transition={isDragging ? 'none' : `transform ${animationDuration}ms ease-out`}
        cursor={onCardClick ? 'pointer' : 'default'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        _active={{ transform: `translateX(${transformValue}px) scale(0.98)` }}
      >
        {item.content}
      </Box>
    </Box>
  );
});

SwipeableCard.displayName = 'SwipeableCard';

/**
 * Financial Swipeable Cards with predefined actions
 */
export const FinancialSwipeableCards: React.FC<Omit<SwipeableCardsProps, 'leftActions' | 'rightActions'> & {
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onArchive?: (item: any) => void;
  onFavorite?: (item: any) => void;
}> = memo(({
  onEdit,
  onDelete,
  onArchive,
  onFavorite,
  ...props
}) => {
  const leftActions: SwipeAction[] = useMemo(() => [
    ...(onEdit ? [{
      id: 'edit',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
        </svg>
      ),
      label: 'Edit',
      color: 'white',
      backgroundColor: 'blue.500',
      action: onEdit,
    }] : []),
    ...(onFavorite ? [{
      id: 'favorite',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
        </svg>
      ),
      label: 'Favorite',
      color: 'white',
      backgroundColor: 'yellow.500',
      action: onFavorite,
    }] : []),
  ], [onEdit, onFavorite]);

  const rightActions: SwipeAction[] = useMemo(() => [
    ...(onArchive ? [{
      id: 'archive',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20,21H4V10H6V19H18V10H20V21M3,3H21V9H3V3M9.5,11A0.5,0.5 0 0,0 9,11.5V13H15V11.5A0.5,0.5 0 0,0 14.5,11H9.5Z" />
        </svg>
      ),
      label: 'Archive',
      color: 'white',
      backgroundColor: 'orange.500',
      action: onArchive,
    }] : []),
    ...(onDelete ? [{
      id: 'delete',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>
      ),
      label: 'Delete',
      color: 'white',
      backgroundColor: 'red.500',
      action: onDelete,
    }] : []),
  ], [onArchive, onDelete]);

  return (
    <SwipeableCards
      {...props}
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
});

FinancialSwipeableCards.displayName = 'FinancialSwipeableCards';

export default SwipeableCards;
