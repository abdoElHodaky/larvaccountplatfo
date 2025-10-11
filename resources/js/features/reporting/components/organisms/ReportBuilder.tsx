import React, { Fragment, memo, useMemo, useState } from 'react';
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
  Divider,
  Flex,
  Spacer,
  Badge,
} from '@chakra-ui/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReportCanvas } from './ReportCanvas';
import { WidgetPalette } from './WidgetPalette';
import { useReportBuilder } from '@/shared/hooks';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Report Builder Component
 * Complete drag-and-drop report building interface
 */

export interface ReportBuilderProps {
  reportId?: string;
  onSave?: (report: any) => Promise<void>;
  onLoad?: (reportId: string) => Promise<any>;
  onExport?: (report: any, format: string) => Promise<void>;
  className?: string;
  readOnly?: boolean;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = memo(({
  reportId,
  onSave,
  onLoad,
  onExport,
  className,
  readOnly = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPalette, setShowPalette] = useState(true);

  // Memoized color values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('white', 'gray.800');

  // Report builder hook
  const {
    report,
    widgets,
    selectedWidget,
    createReport,
    loadReport,
    saveReport,
    exportReport,
    updateWidgets,
    selectWidget,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    isLoading,
    error,
    lastSaved,
  } = useReportBuilder({
    autoSave: !readOnly,
    autoSaveInterval: 30000,
    onSave,
    onLoad,
  });

  // Initialize report on mount
  React.useEffect(() => {
    if (reportId && onLoad) {
      loadReport(reportId);
    } else if (!report) {
      createReport({
        name: 'New Financial Report',
        description: 'Custom financial dashboard',
        category: 'financial',
      });
    }
  }, [reportId, onLoad, loadReport, createReport, report]);

  // Memoized handlers
  const handleSave = useMemoizedCallback(async () => {
    await saveReport();
  }, [saveReport]);

  const handleExport = useMemoizedCallback(async (format: 'json' | 'pdf' | 'png') => {
    if (onExport && report) {
      await onExport(report, format);
    } else {
      await exportReport(format);
    }
  }, [onExport, report, exportReport]);

  const handleUndo = useMemoizedCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useMemoizedCallback(() => {
    redo();
  }, [redo]);

  const togglePalette = useMemoizedCallback(() => {
    setShowPalette(prev => !prev);
  }, []);

  // Memoized toolbar
  const toolbar = useMemo(() => (
    <HStack
      spacing={4}
      p={4}
      bg={headerBg}
      borderBottom="1px solid"
      borderBottomColor={borderColor}
      borderRadius="lg lg 0 0"
    >
      {/* Report Info */}
      <VStack align="flex-start" spacing={0} flex={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="bold">
            {report?.name || 'Untitled Report'}
          </Text>
          {isDirty && <Badge colorScheme="orange" size="sm">Unsaved</Badge>}
        </HStack>
        <Text fontSize="sm" color="gray.500">
          {report?.description || 'No description'}
        </Text>
      </VStack>

      {/* Actions */}
      <HStack spacing={2}>
        {/* History Controls */}
        {!readOnly && (
          <Fragment>
            <IconButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5,8C13.3,8 14,7.3 14,6.5V5.71L15.55,4.16C15.84,3.87 15.84,3.39 15.55,3.1L14.45,2C14.16,1.71 13.68,1.71 13.39,2L11.84,3.55H11.05C10.25,3.55 9.55,4.25 9.55,5.05V6.5C9.55,7.3 10.25,8 11.05,8H12.5M11.5,19L15.5,15H13V9H10V15H7.5L11.5,19Z" />
                </svg>
              }
              size="sm"
              variant="ghost"
              aria-label="Undo"
              isDisabled={!canUndo}
              onClick={handleUndo}
            />
            <IconButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5,8C10.7,8 10,7.3 10,6.5V5.71L8.45,4.16C8.16,3.87 8.16,3.39 8.45,3.1L9.55,2C9.84,1.71 10.32,1.71 10.61,2L12.16,3.55H12.95C13.75,3.55 14.45,4.25 14.45,5.05V6.5C14.45,7.3 13.75,8 12.95,8H11.5M12.5,19L8.5,15H11V9H14V15H16.5L12.5,19Z" />
                </svg>
              }
              size="sm"
              variant="ghost"
              aria-label="Redo"
              isDisabled={!canRedo}
              onClick={handleRedo}
            />
            <Divider orientation="vertical" h="20px" />
          </Fragment>
        )}

        {/* Palette Toggle */}
        <IconButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z" />
            </svg>
          }
          size="sm"
          variant={showPalette ? 'solid' : 'ghost'}
          colorScheme={showPalette ? 'blue' : 'gray'}
          aria-label="Toggle widget palette"
          onClick={togglePalette}
        />

        {/* Export Menu */}
        <Button
          size="sm"
          variant="ghost"
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          }
          onClick={() => handleExport('json')}
        >
          Export
        </Button>

        {/* Save Button */}
        {!readOnly && (
          <Button
            size="sm"
            colorScheme="blue"
            isLoading={isLoading}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
              </svg>
            }
            onClick={handleSave}
          >
            Save
          </Button>
        )}
      </HStack>
    </HStack>
  ), [
    report,
    isDirty,
    canUndo,
    canRedo,
    showPalette,
    isLoading,
    readOnly,
    headerBg,
    borderColor,
    handleUndo,
    handleRedo,
    togglePalette,
    handleExport,
    handleSave,
  ]);

  // Memoized main content
  const mainContent = useMemo(() => (
    <Grid
      templateColumns={showPalette ? '300px 1fr' : '1fr'}
      gap={4}
      h="calc(100vh - 120px)"
      overflow="hidden"
    >
      {/* Widget Palette */}
      {showPalette && (
        <GridItem>
          <Box h="full" overflowY="auto">
            <WidgetPalette
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              compact={false}
            />
          </Box>
        </GridItem>
      )}

      {/* Report Canvas */}
      <GridItem>
        <Box h="full" overflowY="auto">
          <ReportCanvas
            widgets={widgets}
            onWidgetsChange={updateWidgets}
            onWidgetSelect={selectWidget}
            selectedWidget={selectedWidget}
            isEditing={!readOnly}
            cols={report?.settings.layout.cols}
            rowHeight={report?.settings.layout.rowHeight}
            margin={report?.settings.layout.margin}
          />
        </Box>
      </GridItem>
    </Grid>
  ), [
    showPalette,
    selectedCategory,
    widgets,
    updateWidgets,
    selectWidget,
    selectedWidget,
    readOnly,
    report?.settings.layout,
  ]);

  // Error display
  if (error) {
    return (
      <Box
        className={className}
        p={8}
        textAlign="center"
        bg={bgColor}
        borderRadius="lg"
      >
        <Text color="red.500" fontSize="lg" mb={4}>
          Error: {error}
        </Text>
        <Button onClick={() => createReport()}>
          Create New Report
        </Button>
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box
        className={className}
        bg={bgColor}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        {/* Toolbar */}
        {toolbar}

        {/* Main Content */}
        {mainContent}

        {/* Status Bar */}
        <HStack
          spacing={4}
          p={2}
          px={4}
          bg={headerBg}
          borderTop="1px solid"
          borderTopColor={borderColor}
          fontSize="sm"
          color="gray.500"
        >
          <Text>
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </Text>
          <Spacer />
          {lastSaved && (
            <Text>
              Last saved: {lastSaved.toLocaleTimeString()}
            </Text>
          )}
        </HStack>
      </Box>
    </DndProvider>
  );
});

ReportBuilder.displayName = 'ReportBuilder';

export default ReportBuilder;
