import React, { Fragment, memo, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { useDrag } from 'react-dnd';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Widget Palette Component
 * Provides draggable widgets for the report builder
 */

export interface WidgetDefinition {
  type: 'chart' | 'table' | 'metric' | 'text' | 'image';
  title: string;
  description: string;
  icon: string;
  category: 'visualization' | 'data' | 'content' | 'layout';
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  config: any;
  subTypes?: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
    config: any;
  }>;
}

export interface WidgetPaletteProps {
  onWidgetSelect?: (widget: WidgetDefinition) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  className?: string;
  compact?: boolean;
}

// Predefined widget definitions
const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Visualization Widgets
  {
    type: 'chart',
    title: 'Line Chart',
    description: 'Time-series data visualization',
    icon: '📈',
    category: 'visualization',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    config: { chartType: 'line' },
    subTypes: [
      {
        type: 'line',
        title: 'Line Chart',
        description: 'Basic line chart for trends',
        icon: '📈',
        config: { chartType: 'line', showGrid: true, showLegend: true },
      },
      {
        type: 'area',
        title: 'Area Chart',
        description: 'Filled area chart for volume data',
        icon: '📊',
        config: { chartType: 'area', showGrid: true, showLegend: true },
      },
    ],
  },
  {
    type: 'chart',
    title: 'Bar Chart',
    description: 'Categorical data comparison',
    icon: '📊',
    category: 'visualization',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    config: { chartType: 'bar' },
    subTypes: [
      {
        type: 'bar',
        title: 'Bar Chart',
        description: 'Vertical bar chart',
        icon: '📊',
        config: { chartType: 'bar', layout: 'vertical' },
      },
      {
        type: 'horizontal-bar',
        title: 'Horizontal Bar',
        description: 'Horizontal bar chart',
        icon: '📋',
        config: { chartType: 'bar', layout: 'horizontal' },
      },
    ],
  },
  {
    type: 'chart',
    title: 'Pie Chart',
    description: 'Proportional data visualization',
    icon: '🥧',
    category: 'visualization',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 8 },
    config: { chartType: 'pie' },
    subTypes: [
      {
        type: 'pie',
        title: 'Pie Chart',
        description: 'Traditional pie chart',
        icon: '🥧',
        config: { chartType: 'pie', innerRadius: 0 },
      },
      {
        type: 'donut',
        title: 'Donut Chart',
        description: 'Pie chart with center hole',
        icon: '🍩',
        config: { chartType: 'pie', innerRadius: 60 },
      },
    ],
  },

  // Data Widgets
  {
    type: 'table',
    title: 'Data Table',
    description: 'Tabular data display with sorting and filtering',
    icon: '📋',
    category: 'data',
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 10 },
    config: { showPagination: true, showSearch: true },
  },
  {
    type: 'metric',
    title: 'Metric Card',
    description: 'Key performance indicator display',
    icon: '📈',
    category: 'data',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 4 },
    config: { showTrend: true, showChange: true },
  },

  // Content Widgets
  {
    type: 'text',
    title: 'Text Block',
    description: 'Rich text content and descriptions',
    icon: '📝',
    category: 'content',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 12, h: 8 },
    config: { allowFormatting: true },
  },
  {
    type: 'image',
    title: 'Image',
    description: 'Images, logos, and visual content',
    icon: '🖼️',
    category: 'content',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 8, h: 6 },
    config: { allowResize: true },
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Widgets', icon: '🔧' },
  { key: 'visualization', label: 'Charts', icon: '📊' },
  { key: 'data', label: 'Data', icon: '📋' },
  { key: 'content', label: 'Content', icon: '📝' },
  { key: 'layout', label: 'Layout', icon: '📐' },
];

export const WidgetPalette: React.FC<WidgetPaletteProps> = memo(({
  onWidgetSelect,
  selectedCategory = 'all',
  onCategoryChange,
  className,
  compact = false,
}) => {
  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Memoized filtered widgets
  const filteredWidgets = useMemo(() => {
    if (selectedCategory === 'all') {
      return WIDGET_DEFINITIONS;
    }
    return WIDGET_DEFINITIONS.filter(widget => widget.category === selectedCategory);
  }, [selectedCategory]);

  // Memoized category change handler
  const handleCategoryChange = useMemoizedCallback((category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  }, [onCategoryChange]);

  // Memoized category tabs
  const categoryTabs = useMemo(() => (
    <HStack spacing={1} overflowX="auto" pb={2}>
      {CATEGORIES.map(category => (
        <Box
          key={category.key}
          px={3}
          py={2}
          borderRadius="md"
          bg={selectedCategory === category.key ? 'blue.500' : 'transparent'}
          color={selectedCategory === category.key ? 'white' : 'gray.600'}
          cursor="pointer"
          fontSize="sm"
          fontWeight="medium"
          whiteSpace="nowrap"
          _hover={{
            bg: selectedCategory === category.key ? 'blue.600' : hoverBg,
          }}
          onClick={() => handleCategoryChange(category.key)}
        >
          <HStack spacing={2}>
            <Text>{category.icon}</Text>
            {!compact && <Text>{category.label}</Text>}
          </HStack>
        </Box>
      ))}
    </HStack>
  ), [selectedCategory, compact, hoverBg, handleCategoryChange]);

  return (
    <CardContainer className={className} bg={bgColor}>
      <VStack spacing={4} align="stretch">
        {/* Category Tabs */}
        {categoryTabs}

        {/* Widget Grid */}
        <SimpleGrid columns={compact ? 2 : 3} spacing={3}>
          {filteredWidgets.map((widget, index) => (
            <DraggableWidget
              key={`${widget.type}-${widget.title}-${index}`}
              widget={widget}
              onSelect={onWidgetSelect}
              compact={compact}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </CardContainer>
  );
});

WidgetPalette.displayName = 'WidgetPalette';

/**
 * Draggable Widget Component
 */
interface DraggableWidgetProps {
  widget: WidgetDefinition;
  onSelect?: (widget: WidgetDefinition) => void;
  compact?: boolean;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = memo(({
  widget,
  onSelect,
  compact = false,
}) => {
  // Memoized color values
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.400');

  // Drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: () => ({
      type: widget.type,
      title: widget.title,
      config: widget.config,
      defaultSize: widget.defaultSize,
      minSize: widget.minSize,
      maxSize: widget.maxSize,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Memoized click handler
  const handleClick = useMemoizedCallback(() => {
    if (onSelect) {
      onSelect(widget);
    }
  }, [onSelect, widget]);

  return (
    <Tooltip
      label={widget.description}
      placement="top"
      hasArrow
      isDisabled={compact}
    >
      <Box
        ref={drag}
        p={compact ? 2 : 3}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        cursor="grab"
        opacity={isDragging ? 0.5 : 1}
        _hover={{
          bg: hoverBg,
          borderColor: hoverBorderColor,
          transform: 'translateY(-1px)',
        }}
        _active={{
          cursor: 'grabbing',
        }}
        transition="all 0.2s"
        onClick={handleClick}
      >
        <VStack spacing={compact ? 1 : 2} align="center">
          <Text fontSize={compact ? 'lg' : 'xl'}>{widget.icon}</Text>
          <Text
            fontSize={compact ? 'xs' : 'sm'}
            fontWeight="medium"
            textAlign="center"
            noOfLines={1}
          >
            {widget.title}
          </Text>
          {!compact && (
            <Text
              fontSize="xs"
              color="gray.500"
              textAlign="center"
              noOfLines={2}
            >
              {widget.description}
            </Text>
          )}
        </VStack>
      </Box>
    </Tooltip>
  );
});

DraggableWidget.displayName = 'DraggableWidget';

export default WidgetPalette;
