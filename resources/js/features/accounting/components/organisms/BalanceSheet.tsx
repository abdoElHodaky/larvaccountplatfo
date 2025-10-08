import React, { Fragment, memo, useMemo, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Badge,
  Button,
  Select,
  Flex,
  Spacer,
  Divider,
  Alert,
  AlertIcon,
  SimpleGrid,
} from '@chakra-ui/react';
import { CardContainer } from '@/Components/Base';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Balance Sheet Component
 * Displays comprehensive balance sheet with assets, liabilities, and equity
 */

export interface BalanceSheetItem {
  id: string;
  code: string;
  name: string;
  type: 'current_asset' | 'non_current_asset' | 'current_liability' | 'non_current_liability' | 'equity';
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface BalanceSheetData {
  items: BalanceSheetItem[];
  asOfDate: string;
  totals: {
    totalCurrentAssets: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    totalCurrentLiabilities: number;
    totalNonCurrentLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    variance: number;
  };
  ratios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquityRatio: number;
    debtToAssetsRatio: number;
    equityRatio: number;
    workingCapital: number;
  };
  metadata: {
    generatedAt: Date;
    currency: string;
    precision: number;
  };
}

export interface BalanceSheetProps {
  data: BalanceSheetData;
  onItemClick?: (item: BalanceSheetItem) => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  showPercentages?: boolean;
  showTrends?: boolean;
  showRatios?: boolean;
  comparisonData?: BalanceSheetData;
  className?: string;
  loading?: boolean;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = memo(({
  data,
  onItemClick,
  onExport,
  showPercentages = true,
  showTrends = true,
  showRatios = true,
  comparisonData,
  className,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'percentage'>('amount');

  // Memoized color values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('blue.50', 'blue.900');
  const positiveColor = useColorModeValue('green.500', 'green.400');
  const negativeColor = useColorModeValue('red.500', 'red.400');
  const balancedColor = useColorModeValue('green.500', 'green.400');
  const unbalancedColor = useColorModeValue('red.500', 'red.400');

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: Record<string, BalanceSheetItem[]> = {
      current_asset: [],
      non_current_asset: [],
      current_liability: [],
      non_current_liability: [],
      equity: [],
    };

    data.items.forEach(item => {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    });

    // Sort each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'amount':
            return Math.abs(b.amount) - Math.abs(a.amount);
          case 'percentage':
            return Math.abs(b.percentage) - Math.abs(a.percentage);
          default:
            return Math.abs(b.amount) - Math.abs(a.amount);
        }
      });
    });

    return groups;
  }, [data.items, sortBy]);

  // Format currency
  const formatCurrency = useMemoizedCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.metadata.currency,
      minimumFractionDigits: data.metadata.precision,
      maximumFractionDigits: data.metadata.precision,
    }).format(amount);
  }, [data.metadata.currency, data.metadata.precision]);

  // Format percentage
  const formatPercentage = useMemoizedCallback((percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  }, []);

  // Format ratio
  const formatRatio = useMemoizedCallback((ratio: number) => {
    return ratio.toFixed(2);
  }, []);

  // Handle item click
  const handleItemClick = useMemoizedCallback((item: BalanceSheetItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  // Render trend indicator
  const renderTrendIndicator = useMemoizedCallback((item: BalanceSheetItem) => {
    if (!showTrends) return null;

    const color = item.trend === 'up' ? positiveColor : 
                  item.trend === 'down' ? negativeColor : 'gray.500';
    
    const icon = item.trend === 'up' ? '↗' : 
                 item.trend === 'down' ? '↘' : '→';

    return (
      <HStack spacing={1}>
        <Text color={color} fontSize="xs">
          {icon}
        </Text>
        <Text color={color} fontSize="xs">
          {formatPercentage(Math.abs(item.trendPercentage))}
        </Text>
      </HStack>
    );
  }, [showTrends, positiveColor, negativeColor, formatPercentage]);

  // Render section header
  const renderSectionHeader = useMemoizedCallback((title: string, amount: number, isSubtotal = false) => (
    <Tr bg={isSubtotal ? sectionBg : headerBg}>
      <Td colSpan={showPercentages && showTrends ? 4 : showPercentages || showTrends ? 3 : 2}>
        <Text fontWeight="bold" fontSize={isSubtotal ? "md" : "sm"}>
          {title}
        </Text>
      </Td>
      <Td isNumeric fontFamily="mono" fontWeight="bold">
        <Text color={amount >= 0 ? positiveColor : negativeColor}>
          {formatCurrency(amount)}
        </Text>
      </Td>
    </Tr>
  ), [showPercentages, showTrends, sectionBg, headerBg, positiveColor, negativeColor, formatCurrency]);

  // Render item row
  const renderItemRow = useMemoizedCallback((item: BalanceSheetItem, index: number) => (
    <Tr
      key={item.id}
      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
      cursor={onItemClick ? 'pointer' : 'default'}
      onClick={() => handleItemClick(item)}
    >
      <Td pl={6}>
        <VStack align="flex-start" spacing={0}>
          <Text fontWeight="medium">{item.name}</Text>
          <Text fontSize="xs" color="gray.500">
            {item.code} • {item.category}
          </Text>
        </VStack>
      </Td>
      
      <Td isNumeric fontFamily="mono">
        <Text color={item.amount >= 0 ? positiveColor : negativeColor}>
          {formatCurrency(item.amount)}
        </Text>
      </Td>

      {showPercentages && (
        <Td isNumeric>
          <Text fontSize="sm" color="gray.600">
            {formatPercentage(item.percentage)}
          </Text>
        </Td>
      )}

      {showTrends && (
        <Td isNumeric>
          {renderTrendIndicator(item)}
        </Td>
      )}
    </Tr>
  ), [
    onItemClick,
    handleItemClick,
    showPercentages,
    showTrends,
    positiveColor,
    negativeColor,
    formatCurrency,
    formatPercentage,
    renderTrendIndicator,
  ]);

  // Memoized header controls
  const headerControls = useMemo(() => (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between" align="center">
        <VStack align="flex-start" spacing={1}>
          <Text fontSize="lg" fontWeight="bold">
            Balance Sheet
          </Text>
          <Text fontSize="sm" color="gray.500">
            As of {data.asOfDate}
          </Text>
        </VStack>

        <VStack align="flex-end" spacing={1}>
          <Badge
            colorScheme={data.totals.isBalanced ? 'green' : 'red'}
            size="lg"
            px={3}
            py={1}
          >
            {data.totals.isBalanced ? 'Balanced' : 'Unbalanced'}
          </Badge>
          {!data.totals.isBalanced && (
            <Text fontSize="xs" color={unbalancedColor}>
              Variance: {formatCurrency(data.totals.variance)}
            </Text>
          )}
        </VStack>
      </HStack>

      <HStack spacing={4} wrap="wrap">
        <Select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'detailed' | 'summary')}
          size="sm"
          maxW="150px"
        >
          <option value="detailed">Detailed View</option>
          <option value="summary">Summary View</option>
        </Select>

        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'amount' | 'percentage')}
          size="sm"
          maxW="150px"
        >
          <option value="amount">Sort by Amount</option>
          <option value="name">Sort by Name</option>
          <option value="percentage">Sort by Percentage</option>
        </Select>

        <Spacer />

        {onExport && (
          <HStack spacing={2}>
            <Button size="sm" variant="outline" onClick={() => onExport('pdf')}>
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport('excel')}>
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport('csv')}>
              CSV
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Balance Alert */}
      {!data.totals.isBalanced && (
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Text fontSize="sm">
            Balance sheet is not balanced. Assets do not equal Liabilities + Equity.
            Variance: {formatCurrency(Math.abs(data.totals.variance))}
          </Text>
        </Alert>
      )}
    </VStack>
  ), [
    data.asOfDate,
    data.totals,
    viewMode,
    sortBy,
    onExport,
    formatCurrency,
    unbalancedColor,
  ]);

  // Memoized financial ratios
  const financialRatios = useMemo(() => {
    if (!showRatios) return null;

    return (
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Current Ratio
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.currentRatio >= 1 ? positiveColor : negativeColor}>
            {formatRatio(data.ratios.currentRatio)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.currentRatio >= 1 ? 'Good' : 'Poor'}
          </Text>
        </VStack>

        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Quick Ratio
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.quickRatio >= 1 ? positiveColor : negativeColor}>
            {formatRatio(data.ratios.quickRatio)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.quickRatio >= 1 ? 'Good' : 'Poor'}
          </Text>
        </VStack>

        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Debt-to-Equity
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.debtToEquityRatio <= 1 ? positiveColor : negativeColor}>
            {formatRatio(data.ratios.debtToEquityRatio)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.debtToEquityRatio <= 1 ? 'Good' : 'High'}
          </Text>
        </VStack>

        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Debt-to-Assets
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.debtToAssetsRatio <= 0.5 ? positiveColor : negativeColor}>
            {formatPercentage(data.ratios.debtToAssetsRatio * 100)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.debtToAssetsRatio <= 0.5 ? 'Good' : 'High'}
          </Text>
        </VStack>

        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Equity Ratio
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.equityRatio >= 0.5 ? positiveColor : negativeColor}>
            {formatPercentage(data.ratios.equityRatio * 100)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.equityRatio >= 0.5 ? 'Good' : 'Low'}
          </Text>
        </VStack>

        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Working Capital
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={data.ratios.workingCapital >= 0 ? positiveColor : negativeColor}>
            {formatCurrency(data.ratios.workingCapital)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {data.ratios.workingCapital >= 0 ? 'Positive' : 'Negative'}
          </Text>
        </VStack>
      </SimpleGrid>
    );
  }, [
    showRatios,
    data.ratios,
    positiveColor,
    negativeColor,
    formatRatio,
    formatPercentage,
    formatCurrency,
  ]);

  // Memoized table content
  const tableContent = useMemo(() => {
    if (viewMode === 'summary') {
      return (
        <Fragment>
          {/* Assets */}
          {renderSectionHeader('ASSETS', data.totals.totalAssets, true)}
          {renderSectionHeader('Current Assets', data.totals.totalCurrentAssets)}
          {renderSectionHeader('Non-Current Assets', data.totals.totalNonCurrentAssets)}
          
          {/* Liabilities */}
          {renderSectionHeader('LIABILITIES', data.totals.totalLiabilities, true)}
          {renderSectionHeader('Current Liabilities', data.totals.totalCurrentLiabilities)}
          {renderSectionHeader('Non-Current Liabilities', data.totals.totalNonCurrentLiabilities)}
          
          {/* Equity */}
          {renderSectionHeader('EQUITY', data.totals.totalEquity, true)}
          
          {/* Total */}
          {renderSectionHeader('TOTAL LIABILITIES & EQUITY', data.totals.totalLiabilitiesAndEquity, true)}
        </Fragment>
      );
    }

    return (
      <Fragment>
        {/* Assets Section */}
        {renderSectionHeader('ASSETS', data.totals.totalAssets, true)}
        
        {/* Current Assets */}
        {renderSectionHeader('Current Assets', data.totals.totalCurrentAssets)}
        {groupedItems.current_asset.map((item, index) => renderItemRow(item, index))}

        {/* Non-Current Assets */}
        {renderSectionHeader('Non-Current Assets', data.totals.totalNonCurrentAssets)}
        {groupedItems.non_current_asset.map((item, index) => renderItemRow(item, index))}

        {/* Liabilities Section */}
        {renderSectionHeader('LIABILITIES', data.totals.totalLiabilities, true)}
        
        {/* Current Liabilities */}
        {renderSectionHeader('Current Liabilities', data.totals.totalCurrentLiabilities)}
        {groupedItems.current_liability.map((item, index) => renderItemRow(item, index))}

        {/* Non-Current Liabilities */}
        {renderSectionHeader('Non-Current Liabilities', data.totals.totalNonCurrentLiabilities)}
        {groupedItems.non_current_liability.map((item, index) => renderItemRow(item, index))}

        {/* Equity Section */}
        {renderSectionHeader('EQUITY', data.totals.totalEquity, true)}
        {groupedItems.equity.map((item, index) => renderItemRow(item, index))}

        {/* Total Liabilities & Equity */}
        {renderSectionHeader('TOTAL LIABILITIES & EQUITY', data.totals.totalLiabilitiesAndEquity, true)}
      </Fragment>
    );
  }, [
    viewMode,
    data.totals,
    groupedItems,
    renderSectionHeader,
    renderItemRow,
  ]);

  if (loading) {
    return (
      <CardContainer className={className}>
        <VStack spacing={4} align="center" py={8}>
          <Text>Loading balance sheet...</Text>
        </VStack>
      </CardContainer>
    );
  }

  return (
    <CardContainer className={className}>
      <VStack spacing={6} align="stretch">
        {/* Header Controls */}
        {headerControls}

        {/* Financial Ratios */}
        {financialRatios && (
          <Fragment>
            <Box p={4} bg={sectionBg} borderRadius="md">
              <VStack spacing={4}>
                <Text fontWeight="bold" fontSize="md">
                  Key Financial Ratios
                </Text>
                {financialRatios}
              </VStack>
            </Box>
            <Divider />
          </Fragment>
        )}

        {/* Balance Sheet Table */}
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th>Account</Th>
                <Th isNumeric>Amount</Th>
                {showPercentages && <Th isNumeric>% of Assets</Th>}
                {showTrends && <Th isNumeric>Trend</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {tableContent}
            </Tbody>
          </Table>
        </Box>

        {/* Summary */}
        <HStack justify="space-between" fontSize="sm" color="gray.500">
          <Text>
            Generated: {data.metadata.generatedAt.toLocaleString()}
          </Text>
          <Text>
            {data.items.length} line items
          </Text>
        </HStack>
      </VStack>
    </CardContainer>
  );
});

BalanceSheet.displayName = 'BalanceSheet';

export default BalanceSheet;
