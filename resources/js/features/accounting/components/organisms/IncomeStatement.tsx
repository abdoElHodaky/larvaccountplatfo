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
    // Badge,
    Button,
    Select,
    // Flex,
    Spacer,
    Divider,
    Progress,
} from '@chakra-ui/react';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Income Statement Component
 * Displays comprehensive income statement with revenue, expenses, and profitability analysis
 */

export interface IncomeStatementItem {
    id: string;
    code: string;
    name: string;
    type: 'revenue' | 'cost_of_goods_sold' | 'operating_expense' | 'other_income' | 'other_expense';
    category: string;
    subcategory?: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
}

export interface IncomeStatementData {
    items: IncomeStatementItem[];
    period: {
        startDate: string;
        endDate: string;
        name: string;
    };
    totals: {
        totalRevenue: number;
        totalCostOfGoodsSold: number;
        grossProfit: number;
        grossProfitMargin: number;
        totalOperatingExpenses: number;
        operatingIncome: number;
        operatingMargin: number;
        totalOtherIncome: number;
        totalOtherExpenses: number;
        netIncome: number;
        netProfitMargin: number;
    };
    metadata: {
        generatedAt: Date;
        currency: string;
        precision: number;
    };
}

export interface IncomeStatementProps {
    data: IncomeStatementData;
    onItemClick?: (item: IncomeStatementItem) => void;
    onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
    showPercentages?: boolean;
    showTrends?: boolean;
    comparisonData?: IncomeStatementData;
    className?: string;
    loading?: boolean;
}

export const IncomeStatement: React.FC<IncomeStatementProps> = memo(
    ({
        data,
        onItemClick,
        onExport,
        showPercentages = true,
        showTrends = true,
        // comparisonData,
        className,
        loading = false,
    }) => {
        const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
        const [sortBy, setSortBy] = useState<'name' | 'amount' | 'percentage'>('amount');

        // Memoized color values
        // const bgColor = useColorModeValue('white', 'gray.800');
        // const borderColor = useColorModeValue('gray.200', 'gray.600');
        const headerBg = useColorModeValue('gray.50', 'gray.700');
        const sectionBg = useColorModeValue('blue.50', 'blue.900');
        const positiveColor = useColorModeValue('green.500', 'green.400');
        const negativeColor = useColorModeValue('red.500', 'red.400');
        const hoverBg = useColorModeValue('gray.50', 'gray.700');

        // Group items by type
        const groupedItems = useMemo(() => {
            const groups: Record<string, IncomeStatementItem[]> = {
                revenue: [],
                cost_of_goods_sold: [],
                operating_expense: [],
                other_income: [],
                other_expense: [],
            };

            data.items.forEach((item) => {
                if (groups[item.type]) {
                    groups[item.type].push(item);
                }
            });

            // Sort each group
            Object.keys(groups).forEach((key) => {
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
        const formatCurrency = useMemoizedCallback(
            (amount: number) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: data.metadata.currency,
                    minimumFractionDigits: data.metadata.precision,
                    maximumFractionDigits: data.metadata.precision,
                }).format(amount);
            },
            [data.metadata.currency, data.metadata.precision]
        );

        // Format percentage
        const formatPercentage = useMemoizedCallback((percentage: number) => {
            return `${percentage.toFixed(1)}%`;
        }, []);

        // Handle item click
        const handleItemClick = useMemoizedCallback(
            (item: IncomeStatementItem) => {
                if (onItemClick) {
                    onItemClick(item);
                }
            },
            [onItemClick]
        );

        // Render trend indicator
        const renderTrendIndicator = useMemoizedCallback(
            (item: IncomeStatementItem) => {
                if (!showTrends) return null;

                const color =
                    item.trend === 'up'
                        ? positiveColor
                        : item.trend === 'down'
                          ? negativeColor
                          : 'gray.500';

                const icon = item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→';

                return (
                    <HStack spacing={1}>
                        <Text color={color} fontSize='xs'>
                            {icon}
                        </Text>
                        <Text color={color} fontSize='xs'>
                            {formatPercentage(Math.abs(item.trendPercentage))}
                        </Text>
                    </HStack>
                );
            },
            [showTrends, positiveColor, negativeColor, formatPercentage]
        );

        // Render section header
        const renderSectionHeader = useMemoizedCallback(
            (title: string, amount: number, isSubtotal = false) => (
                <Tr bg={isSubtotal ? sectionBg : headerBg}>
                    <Td
                        colSpan={
                            showPercentages && showTrends
                                ? 4
                                : showPercentages || showTrends
                                  ? 3
                                  : 2
                        }
                    >
                        <Text fontWeight='bold' fontSize={isSubtotal ? 'md' : 'sm'}>
                            {title}
                        </Text>
                    </Td>
                    <Td isNumeric fontFamily='mono' fontWeight='bold'>
                        <Text color={amount >= 0 ? positiveColor : negativeColor}>
                            {formatCurrency(amount)}
                        </Text>
                    </Td>
                </Tr>
            ),
            [
                showPercentages,
                showTrends,
                sectionBg,
                headerBg,
                positiveColor,
                negativeColor,
                formatCurrency,
            ]
        );

        // Render item row
        const renderItemRow = useMemoizedCallback(
            (item: IncomeStatementItem, _index: number) => (
                <Tr
                    key={item.id}
                    _hover={{ bg: hoverBg }}
                    cursor={onItemClick ? 'pointer' : 'default'}
                    onClick={() => handleItemClick(item)}
                >
                    <Td pl={6}>
                        <VStack align='flex-start' spacing={0}>
                            <Text fontWeight='medium'>{item.name}</Text>
                            <Text fontSize='xs' color='gray.500'>
                                {item.code} • {item.category}
                            </Text>
                        </VStack>
                    </Td>

                    <Td isNumeric fontFamily='mono'>
                        <Text color={item.amount >= 0 ? positiveColor : negativeColor}>
                            {formatCurrency(item.amount)}
                        </Text>
                    </Td>

                    {showPercentages && (
                        <Td isNumeric>
                            <Text fontSize='sm' color='gray.600'>
                                {formatPercentage(item.percentage)}
                            </Text>
                        </Td>
                    )}

                    {showTrends && <Td isNumeric>{renderTrendIndicator(item)}</Td>}
                </Tr>
            ),
            [
                onItemClick,
                handleItemClick,
                showPercentages,
                showTrends,
                positiveColor,
                negativeColor,
                formatCurrency,
                formatPercentage,
                renderTrendIndicator,
            ]
        );

        // Memoized header controls
        const headerControls = useMemo(
            () => (
                <VStack spacing={4} align='stretch'>
                    <HStack justify='space-between' align='center'>
                        <VStack align='flex-start' spacing={1}>
                            <Text fontSize='lg' fontWeight='bold'>
                                Income Statement
                            </Text>
                            <Text fontSize='sm' color='gray.500'>
                                {data.period.name} ({data.period.startDate} to {data.period.endDate}
                                )
                            </Text>
                        </VStack>

                        <VStack align='flex-end' spacing={1}>
                            <Text
                                fontSize='lg'
                                fontWeight='bold'
                                color={data.totals.netIncome >= 0 ? positiveColor : negativeColor}
                            >
                                {formatCurrency(data.totals.netIncome)}
                            </Text>
                            <Text fontSize='xs' color='gray.500'>
                                Net Income ({formatPercentage(data.totals.netProfitMargin)})
                            </Text>
                        </VStack>
                    </HStack>

                    <HStack spacing={4} wrap='wrap'>
                        <Select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'detailed' | 'summary')}
                            size='sm'
                            maxW='150px'
                        >
                            <option value='detailed'>Detailed View</option>
                            <option value='summary'>Summary View</option>
                        </Select>

                        <Select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as 'name' | 'amount' | 'percentage')
                            }
                            size='sm'
                            maxW='150px'
                        >
                            <option value='amount'>Sort by Amount</option>
                            <option value='name'>Sort by Name</option>
                            <option value='percentage'>Sort by Percentage</option>
                        </Select>

                        <Spacer />

                        {onExport && (
                            <HStack spacing={2}>
                                <Button size='sm' variant='outline' onClick={() => onExport('pdf')}>
                                    PDF
                                </Button>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => onExport('excel')}
                                >
                                    Excel
                                </Button>
                                <Button size='sm' variant='outline' onClick={() => onExport('csv')}>
                                    CSV
                                </Button>
                            </HStack>
                        )}
                    </HStack>
                </VStack>
            ),
            [
                data.period,
                data.totals.netIncome,
                data.totals.netProfitMargin,
                viewMode,
                sortBy,
                onExport,
                positiveColor,
                negativeColor,
                formatCurrency,
                formatPercentage,
            ]
        );

        // Memoized key metrics
        const keyMetrics = useMemo(
            () => (
                <HStack spacing={8} justify='center' wrap='wrap'>
                    <VStack spacing={1}>
                        <Text fontSize='xs' color='gray.500' textTransform='uppercase'>
                            Gross Profit Margin
                        </Text>
                        <Text
                            fontSize='lg'
                            fontWeight='bold'
                            color={
                                data.totals.grossProfitMargin >= 0 ? positiveColor : negativeColor
                            }
                        >
                            {formatPercentage(data.totals.grossProfitMargin)}
                        </Text>
                        <Progress
                            value={Math.abs(data.totals.grossProfitMargin)}
                            size='sm'
                            colorScheme={data.totals.grossProfitMargin >= 0 ? 'green' : 'red'}
                            w='80px'
                        />
                    </VStack>

                    <VStack spacing={1}>
                        <Text fontSize='xs' color='gray.500' textTransform='uppercase'>
                            Operating Margin
                        </Text>
                        <Text
                            fontSize='lg'
                            fontWeight='bold'
                            color={data.totals.operatingMargin >= 0 ? positiveColor : negativeColor}
                        >
                            {formatPercentage(data.totals.operatingMargin)}
                        </Text>
                        <Progress
                            value={Math.abs(data.totals.operatingMargin)}
                            size='sm'
                            colorScheme={data.totals.operatingMargin >= 0 ? 'green' : 'red'}
                            w='80px'
                        />
                    </VStack>

                    <VStack spacing={1}>
                        <Text fontSize='xs' color='gray.500' textTransform='uppercase'>
                            Net Profit Margin
                        </Text>
                        <Text
                            fontSize='lg'
                            fontWeight='bold'
                            color={data.totals.netProfitMargin >= 0 ? positiveColor : negativeColor}
                        >
                            {formatPercentage(data.totals.netProfitMargin)}
                        </Text>
                        <Progress
                            value={Math.abs(data.totals.netProfitMargin)}
                            size='sm'
                            colorScheme={data.totals.netProfitMargin >= 0 ? 'green' : 'red'}
                            w='80px'
                        />
                    </VStack>
                </HStack>
            ),
            [data.totals, positiveColor, negativeColor, formatPercentage]
        );

        // Memoized table content
        const tableContent = useMemo(() => {
            if (viewMode === 'summary') {
                return (
                    <Fragment>
                        {renderSectionHeader('REVENUE', data.totals.totalRevenue, true)}
                        {renderSectionHeader(
                            'COST OF GOODS SOLD',
                            -data.totals.totalCostOfGoodsSold
                        )}
                        {renderSectionHeader('GROSS PROFIT', data.totals.grossProfit, true)}
                        {renderSectionHeader(
                            'OPERATING EXPENSES',
                            -data.totals.totalOperatingExpenses
                        )}
                        {renderSectionHeader('OPERATING INCOME', data.totals.operatingIncome, true)}
                        {renderSectionHeader('OTHER INCOME', data.totals.totalOtherIncome)}
                        {renderSectionHeader('OTHER EXPENSES', -data.totals.totalOtherExpenses)}
                        {renderSectionHeader('NET INCOME', data.totals.netIncome, true)}
                    </Fragment>
                );
            }

            return (
                <Fragment>
                    {/* Revenue Section */}
                    {renderSectionHeader('REVENUE', data.totals.totalRevenue, true)}
                    {groupedItems.revenue.map((item, index) => renderItemRow(item, index))}

                    {/* Cost of Goods Sold Section */}
                    {renderSectionHeader('COST OF GOODS SOLD', -data.totals.totalCostOfGoodsSold)}
                    {groupedItems.cost_of_goods_sold.map((item, index) =>
                        renderItemRow(item, index)
                    )}

                    {/* Gross Profit */}
                    {renderSectionHeader('GROSS PROFIT', data.totals.grossProfit, true)}

                    {/* Operating Expenses Section */}
                    {renderSectionHeader('OPERATING EXPENSES', -data.totals.totalOperatingExpenses)}
                    {groupedItems.operating_expense.map((item, index) =>
                        renderItemRow(item, index)
                    )}

                    {/* Operating Income */}
                    {renderSectionHeader('OPERATING INCOME', data.totals.operatingIncome, true)}

                    {/* Other Income Section */}
                    {groupedItems.other_income.length > 0 && (
                        <Fragment>
                            {renderSectionHeader('OTHER INCOME', data.totals.totalOtherIncome)}
                            {groupedItems.other_income.map((item, index) =>
                                renderItemRow(item, index)
                            )}
                        </Fragment>
                    )}

                    {/* Other Expenses Section */}
                    {groupedItems.other_expense.length > 0 && (
                        <Fragment>
                            {renderSectionHeader('OTHER EXPENSES', -data.totals.totalOtherExpenses)}
                            {groupedItems.other_expense.map((item, index) =>
                                renderItemRow(item, index)
                            )}
                        </Fragment>
                    )}

                    {/* Net Income */}
                    {renderSectionHeader('NET INCOME', data.totals.netIncome, true)}
                </Fragment>
            );
        }, [viewMode, data.totals, groupedItems, renderSectionHeader, renderItemRow]);

        if (loading) {
            return (
                <CardContainer className={className}>
                    <VStack spacing={4} align='center' py={8}>
                        <Text>Loading income statement...</Text>
                    </VStack>
                </CardContainer>
            );
        }

        return (
            <CardContainer className={className}>
                <VStack spacing={6} align='stretch'>
                    {/* Header Controls */}
                    {headerControls}

                    {/* Key Metrics */}
                    <Box p={4} bg={sectionBg} borderRadius='md'>
                        {keyMetrics}
                    </Box>

                    <Divider />

                    {/* Income Statement Table */}
                    <Box overflowX='auto'>
                        <Table variant='simple' size='sm'>
                            <Thead bg={headerBg}>
                                <Tr>
                                    <Th>Account</Th>
                                    <Th isNumeric>Amount</Th>
                                    {showPercentages && <Th isNumeric>% of Revenue</Th>}
                                    {showTrends && <Th isNumeric>Trend</Th>}
                                </Tr>
                            </Thead>
                            <Tbody>{tableContent}</Tbody>
                        </Table>
                    </Box>

                    {/* Summary */}
                    <HStack justify='space-between' fontSize='sm' color='gray.500'>
                        <Text>Generated: {data.metadata.generatedAt.toLocaleString()}</Text>
                        <Text>{data.items.length} line items</Text>
                    </HStack>
                </VStack>
            </CardContainer>
        );
    }
);

IncomeStatement.displayName = 'IncomeStatement';

export default IncomeStatement;
