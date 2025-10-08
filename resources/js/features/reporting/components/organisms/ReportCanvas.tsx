import React, { Fragment, memo, useMemo, useCallback, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useColorModeValue,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDrop } from 'react-dnd';
import { CardContainer } from '@/Components/Base';
import { useMemoizedCallback } from '@/Hooks';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * Performance-Optimized Report Canvas Component
 * Drag-and-drop interface for building custom financial reports
 */

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image';
  title: string;
  config: any;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

export interface ReportCanvasProps {
  widgets: ReportWidget[];
  onWidgetsChange: (widgets: ReportWidget[]) => void;
  onWidgetSelect?: (widget: ReportWidget | null) => void;
  selectedWidget?: ReportWidget | null;
  isEditing?: boolean;
  className?: string;
  cols?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
}

export const ReportCanvas: React.FC<ReportCanvasProps> = memo(({
  widgets,
  onWidgetsChange,
  onWidgetSelect,
  selectedWidget,
  isEditing = true,
  className,
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight = 60,
  margin = [10, 10],
  containerPadding = [10, 10],
}) => {
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Memoized color values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300');
  const dropZoneColor = useColorModeValue('blue.100', 'blue.800');

  // Memoized layouts for responsive grid
  const layouts = useMemo(() => {
    const layoutsByBreakpoint: any = {};
    
    Object.keys(cols).forEach(breakpoint => {
      layoutsByBreakpoint[breakpoint] = widgets.map(widget => ({
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
        minW: widget.layout.minW || 2,
        minH: widget.layout.minH || 2,
        maxW: widget.layout.maxW,
        maxH: widget.layout.maxH,
      }));
    });

    return layoutsByBreakpoint;
  }, [widgets, cols]);

  // Memoized layout change handler
  const handleLayoutChange = useMemoizedCallback((layout: any[], layouts: any) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          layout: {
            ...widget.layout,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    onWidgetsChange(updatedWidgets);
  }, [widgets, onWidgetsChange]);

  // Memoized widget selection handler
  const handleWidgetSelect = useMemoizedCallback((widget: ReportWidget) => {
    if (onWidgetSelect) {
      onWidgetSelect(selectedWidget?.id === widget.id ? null : widget);
    }
  }, [onWidgetSelect, selectedWidget]);

  // Memoized widget deletion handler
  const handleWidgetDelete = useMemoizedCallback((widgetId: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    onWidgetsChange(updatedWidgets);
    
    if (selectedWidget?.id === widgetId && onWidgetSelect) {
      onWidgetSelect(null);
    }
  }, [widgets, onWidgetsChange, selectedWidget, onWidgetSelect]);

  // Memoized drop handler for new widgets
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'WIDGET',
    drop: (item: any, monitor) => {
      if (!monitor.didDrop()) {
        // Calculate position based on drop coordinates
        const clientOffset = monitor.getClientOffset();
        const canvasRect = (drop as any).current?.getBoundingClientRect();
        
        if (clientOffset && canvasRect) {
          const x = Math.floor((clientOffset.x - canvasRect.left) / (canvasRect.width / cols.lg));
          const y = Math.floor((clientOffset.y - canvasRect.top) / (rowHeight + margin[1]));
          
          const newWidget: ReportWidget = {
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: item.type,
            title: item.title || `New ${item.type}`,
            config: item.config || {},
            layout: {
              x: Math.max(0, Math.min(x, cols.lg - (item.defaultSize?.w || 4))),
              y: Math.max(0, y),
              w: item.defaultSize?.w || 4,
              h: item.defaultSize?.h || 3,
              minW: item.minSize?.w || 2,
              minH: item.minSize?.h || 2,
              maxW: item.maxSize?.w,
              maxH: item.maxSize?.h,
            },
          };

          onWidgetsChange([...widgets, newWidget]);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Memoized widget renderer
  const renderWidget = useMemoizedCallback((widget: ReportWidget) => {
    const isSelected = selectedWidget?.id === widget.id;
    
    return (
      <Box
        key={widget.id}
        position="relative"
        h="full"
        w="full"
        border="2px solid"
        borderColor={isSelected ? selectedBorderColor : borderColor}
        borderRadius="md"
        bg="white"
        cursor={isEditing ? 'pointer' : 'default'}
        onClick={() => isEditing && handleWidgetSelect(widget)}
        _hover={isEditing ? { borderColor: selectedBorderColor } : undefined}
        overflow="hidden"
      >
        {/* Widget Header */}
        {isEditing && (
          <HStack
            justify="space-between"
            align="center"
            px={2}
            py={1}
            bg={useColorModeValue('gray.100', 'gray.700')}
            borderBottom="1px solid"
            borderBottomColor={borderColor}
          >
            <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
              {widget.title}
            </Text>
            <IconButton
              icon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              }
              size="xs"
              variant="ghost"
              aria-label="Delete widget"
              onClick={(e) => {
                e.stopPropagation();
                handleWidgetDelete(widget.id);
              }}
            />
          </HStack>
        )}

        {/* Widget Content */}
        <Box
          p={2}
          h={isEditing ? 'calc(100% - 32px)' : 'full'}
          overflow="hidden"
        >
          <WidgetContent widget={widget} />
        </Box>
      </Box>
    );
  }, [
    selectedWidget,
    isEditing,
    selectedBorderColor,
    borderColor,
    handleWidgetSelect,
    handleWidgetDelete,
  ]);

  // Memoized empty state
  const emptyState = useMemo(() => (
    <VStack
      spacing={4}
      justify="center"
      align="center"
      h="400px"
      border="2px dashed"
      borderColor={borderColor}
      borderRadius="lg"
      bg={isOver && canDrop ? dropZoneColor : 'transparent'}
    >
      <Text fontSize="lg" color="gray.500" textAlign="center">
        {isEditing 
          ? 'Drag widgets from the palette to start building your report'
          : 'No widgets in this report'
        }
      </Text>
      {isEditing && (
        <Text fontSize="sm" color="gray.400" textAlign="center">
          You can drag charts, tables, metrics, and other components here
        </Text>
      )}
    </VStack>
  ), [borderColor, isOver, canDrop, dropZoneColor, isEditing]);

  return (
    <Box
      ref={drop}
      className={className}
      bg={bgColor}
      borderRadius="lg"
      p={4}
      minH="500px"
      position="relative"
    >
      {widgets.length === 0 ? (
        emptyState
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          cols={cols}
          rowHeight={rowHeight}
          margin={margin}
          containerPadding={containerPadding}
          isDraggable={isEditing}
          isResizable={isEditing}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map(renderWidget)}
        </ResponsiveGridLayout>
      )}

      {/* Drop zone overlay */}
      {isOver && canDrop && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={dropZoneColor}
          opacity={0.3}
          borderRadius="lg"
          pointerEvents="none"
        />
      )}
    </Box>
  );
});

ReportCanvas.displayName = 'ReportCanvas';

/**
 * Widget Content Renderer
 */
interface WidgetContentProps {
  widget: ReportWidget;
}

const WidgetContent: React.FC<WidgetContentProps> = memo(({ widget }) => {
  const content = useMemo(() => {
    switch (widget.type) {
      case 'chart':
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">📊</Text>
            <Text fontSize="sm" textAlign="center">
              {widget.config.chartType || 'Chart'} Widget
            </Text>
          </VStack>
        );
      
      case 'table':
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">📋</Text>
            <Text fontSize="sm" textAlign="center">
              Data Table Widget
            </Text>
          </VStack>
        );
      
      case 'metric':
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">📈</Text>
            <Text fontSize="sm" textAlign="center">
              Metric Widget
            </Text>
          </VStack>
        );
      
      case 'text':
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">📝</Text>
            <Text fontSize="sm" textAlign="center">
              Text Widget
            </Text>
          </VStack>
        );
      
      case 'image':
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">🖼️</Text>
            <Text fontSize="sm" textAlign="center">
              Image Widget
            </Text>
          </VStack>
        );
      
      default:
        return (
          <VStack spacing={2} align="center" justify="center" h="full">
            <Text fontSize="2xl">❓</Text>
            <Text fontSize="sm" textAlign="center">
              Unknown Widget
            </Text>
          </VStack>
        );
    }
  }, [widget.type, widget.config]);

  return <Fragment>{content}</Fragment>;
});

WidgetContent.displayName = 'WidgetContent';

export default ReportCanvas;
