import React, { Fragment, memo, useMemo, useState, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Input,
    Select,
    useColorModeValue,
    Skeleton,
    Alert,
    AlertIcon,
    Badge,
} from '@chakra-ui/react';
import { DataTable, DataTableProps } from '@/shared/components/molecules/DataTable';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Touch-Optimized Table Component
 * Mobile-friendly data table with swipe gestures and touch interactions
 */

export interface TouchOptimizedTableProps extends Omit<DataTableProps, 'variant'> {
    enableSwipeActions?: boolean;
    swipeActions?: {
        left?: Array<{
            icon: React.ReactNode;
            label: string;
            color: string;
            action: (item: any) => void;
        }>;
        right?: Array<{
            icon: React.ReactNode;
            label: string;
            color: string;
            action: (item: any) => void;
        }>;
    };
    compactMode?: boolean;
    showMobileFilters?: boolean;
    mobileBreakpoint?: number;
}

export const TouchOptimizedTable: React.FC<TouchOptimizedTableProps> = memo(
    ({
        data,
        columns,
        loading = false,
        error,
        onSort,
        onFilter,
        onRowClick,
        enableSwipeActions = true,
        swipeActions,
        compactMode = false,
        showMobileFilters = true,
        mobileBreakpoint = 768,
        ...props
    }) => {
        const [isMobile, setIsMobile] = useState(false);
        const [swipedRow, setSwipedRow] = useState<string | null>(null);
        const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [sortColumn, setSortColumn] = useState<string>('');
        const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

        const tableRef = useRef<HTMLDivElement>(null);

        // Memoized color values
        const bgColor = useColorModeValue('white', 'gray.800');
        const borderColor = useColorModeValue('gray.200', 'gray.600');
        const hoverBg = useColorModeValue('gray.50', 'gray.700');
        const swipeActionBg = useColorModeValue('red.500', 'red.600');

        // Check if we're on mobile
        React.useEffect(() => {
            const checkMobile = () => {
                setIsMobile(window.innerWidth <= mobileBreakpoint);
            };

            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }, [mobileBreakpoint]);

        // Memoized filtered and sorted data
        const processedData = useMemo(() => {
            let filtered = data;

            // Apply search filter
            if (searchTerm) {
                filtered = data.filter((item) =>
                    Object.values(item).some((value) =>
                        String(value).toLowerCase().includes(searchTerm.toLowerCase())
                    )
                );
            }

            // Apply sorting
            if (sortColumn) {
                filtered = [...filtered].sort((a, b) => {
                    const aVal = a[sortColumn];
                    const bVal = b[sortColumn];

                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                    }

                    const aStr = String(aVal).toLowerCase();
                    const bStr = String(bVal).toLowerCase();

                    if (sortDirection === 'asc') {
                        return aStr.localeCompare(bStr);
                    } else {
                        return bStr.localeCompare(aStr);
                    }
                });
            }

            return filtered;
        }, [data, searchTerm, sortColumn, sortDirection]);

        // Memoized mobile columns (show only essential columns)
        const mobileColumns = useMemo(() => {
            if (!isMobile) return columns;

            // Show first 2-3 most important columns on mobile
            return columns.slice(0, compactMode ? 2 : 3);
        }, [columns, isMobile, compactMode]);

        // Touch handlers for swipe gestures
        const handleTouchStart = useMemoizedCallback(
            (e: React.TouchEvent, _rowId: string) => {
                if (!enableSwipeActions) return;

                const touch = e.touches[0];
                setTouchStart({ x: touch.clientX, y: touch.clientY });
            },
            [enableSwipeActions]
        );

        const handleTouchMove = useMemoizedCallback(
            (e: React.TouchEvent, rowId: string) => {
                if (!enableSwipeActions || !touchStart) return;

                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStart.x;
                const deltaY = Math.abs(touch.clientY - touchStart.y);

                // Only handle horizontal swipes
                if (deltaY > 50) return;

                if (Math.abs(deltaX) > 50) {
                    setSwipedRow(rowId);
                }
            },
            [enableSwipeActions, touchStart]
        );

        const handleTouchEnd = useMemoizedCallback(() => {
            setTouchStart(null);
        }, []);

        // Search handler
        const handleSearch = useMemoizedCallback(
            (value: string) => {
                setSearchTerm(value);
                if (onFilter) {
                    onFilter({ search: value });
                }
            },
            [onFilter]
        );

        // Sort handler
        const handleSort = useMemoizedCallback(
            (column: string) => {
                const newDirection =
                    sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
                setSortColumn(column);
                setSortDirection(newDirection);

                if (onSort) {
                    onSort({ column, direction: newDirection });
                }
            },
            [sortColumn, sortDirection, onSort]
        );

        // Memoized mobile filters
        const mobileFilters = useMemo(() => {
            if (!isMobile || !showMobileFilters) return null;

            return (
                <VStack
                    spacing={3}
                    p={4}
                    bg={bgColor}
                    borderBottom='1px solid'
                    borderBottomColor={borderColor}
                >
                    {/* Search */}
                    <Input
                        placeholder='Search...'
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        size='sm'
                    />

                    {/* Sort */}
                    <HStack w='full' spacing={2}>
                        <Select
                            placeholder='Sort by...'
                            value={sortColumn}
                            onChange={(e) => handleSort(e.target.value)}
                            size='sm'
                            flex={1}
                        >
                            {columns.map((column) => (
                                <option key={column.key} value={column.key}>
                                    {column.label}
                                </option>
                            ))}
                        </Select>

                        <IconButton
                            icon={
                                sortDirection === 'asc' ? (
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 24 24'
                                        fill='currentColor'
                                    >
                                        <path d='M19,17H22L18,21L14,17H17V3H19V17M2,17H12V19H2V17M6,5V7H2V5H6M2,11V13H9V11H2Z' />
                                    </svg>
                                ) : (
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 24 24'
                                        fill='currentColor'
                                    >
                                        <path d='M19,7H22L18,3L14,7H17V21H19V7M2,17H12V19H2V17M6,5V7H2V5H6M2,11V13H9V11H2Z' />
                                    </svg>
                                )
                            }
                            size='sm'
                            variant='outline'
                            aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                            isDisabled={!sortColumn}
                        />
                    </HStack>
                </VStack>
            );
        }, [
            isMobile,
            showMobileFilters,
            searchTerm,
            sortColumn,
            sortDirection,
            columns,
            bgColor,
            borderColor,
            handleSearch,
            handleSort,
        ]);

        // Memoized mobile row renderer
        const renderMobileRow = useMemoizedCallback(
            (item: any, index: number) => {
                const rowId = item.id || index.toString();
                const isSwipedRow = swipedRow === rowId;

                return (
                    <Box
                        key={rowId}
                        position='relative'
                        bg={bgColor}
                        borderBottom='1px solid'
                        borderBottomColor={borderColor}
                        onTouchStart={(e) => handleTouchStart(e, rowId)}
                        onTouchMove={(e) => handleTouchMove(e, rowId)}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => onRowClick?.(item)}
                        cursor={onRowClick ? 'pointer' : 'default'}
                        _hover={onRowClick ? { bg: hoverBg } : undefined}
                    >
                        {/* Swipe Actions Background */}
                        {isSwipedRow && swipeActions && (
                            <Fragment>
                                {/* Left Actions */}
                                {swipeActions.left && (
                                    <HStack
                                        position='absolute'
                                        left={0}
                                        top={0}
                                        bottom={0}
                                        bg={swipeActionBg}
                                        px={4}
                                        spacing={2}
                                        zIndex={1}
                                    >
                                        {swipeActions.left.map((action, idx) => (
                                            <IconButton
                                                key={idx}
                                                icon={action.icon}
                                                size='sm'
                                                colorScheme='white'
                                                variant='ghost'
                                                aria-label={action.label}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    action.action(item);
                                                    setSwipedRow(null);
                                                }}
                                            />
                                        ))}
                                    </HStack>
                                )}
                            </Fragment>
                        )}

                        {/* Row Content */}
                        <VStack
                            align='stretch'
                            spacing={1}
                            p={4}
                            bg={isSwipedRow ? 'transparent' : bgColor}
                            transform={isSwipedRow ? 'translateX(80px)' : 'translateX(0)'}
                            transition='transform 0.2s ease'
                        >
                            {mobileColumns.map((column, _colIndex) => (
                                <HStack key={column.key} justify='space-between' align='flex-start'>
                                    <Text
                                        fontSize='sm'
                                        color='gray.500'
                                        fontWeight='medium'
                                        minW='80px'
                                    >
                                        {column.label}:
                                    </Text>
                                    <Text fontSize='sm' textAlign='right' flex={1}>
                                        {column.render
                                            ? column.render(item[column.key], item)
                                            : item[column.key]}
                                    </Text>
                                </HStack>
                            ))}

                            {/* Show additional info if available */}
                            {columns.length > mobileColumns.length && (
                                <Badge size='sm' colorScheme='blue' alignSelf='flex-start'>
                                    +{columns.length - mobileColumns.length} more
                                </Badge>
                            )}
                        </VStack>
                    </Box>
                );
            },
            [
                swipedRow,
                swipeActions,
                mobileColumns,
                columns.length,
                bgColor,
                borderColor,
                hoverBg,
                swipeActionBg,
                onRowClick,
                handleTouchStart,
                handleTouchMove,
                handleTouchEnd,
            ]
        );

        // Error state
        if (error) {
            return (
                <Alert status='error'>
                    <AlertIcon />
                    {error}
                </Alert>
            );
        }

        // Loading state
        if (loading) {
            return (
                <VStack spacing={2} align='stretch'>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} height='80px' />
                    ))}
                </VStack>
            );
        }

        // Mobile view
        if (isMobile) {
            return (
                <Box ref={tableRef} bg={bgColor} borderRadius='md' overflow='hidden'>
                    {/* Mobile Filters */}
                    {mobileFilters}

                    {/* Mobile Rows */}
                    <VStack spacing={0} align='stretch'>
                        {processedData.length === 0 ? (
                            <Box p={8} textAlign='center'>
                                <Text color='gray.500'>No data available</Text>
                            </Box>
                        ) : (
                            processedData.map(renderMobileRow)
                        )}
                    </VStack>
                </Box>
            );
        }

        // Desktop view - use regular DataTable
        return (
            <DataTable
                {...props}
                data={processedData}
                columns={columns}
                loading={loading}
                error={error}
                onSort={onSort}
                onFilter={onFilter}
                onRowClick={onRowClick}
            />
        );
    }
);

TouchOptimizedTable.displayName = 'TouchOptimizedTable';

export default TouchOptimizedTable;
