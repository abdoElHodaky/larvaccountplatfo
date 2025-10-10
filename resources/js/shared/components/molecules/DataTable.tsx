import React, { useMemo, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  HStack,
  Text,
  Input,

  Badge,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { useMemoizedCallback, useDebounce } from '@/shared/hooks';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

/**
 * Performance-Optimized Data Table Component
 * Specialized for financial data with sorting, filtering, and virtualization
 */

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'badge' | 'custom';
  currency?: string;
  precision?: number;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
  filterFn?: (value: any, filterValue: string) => boolean;
}

export interface TableData {
  [key: string]: any;
}

export interface DataTableProps<T = TableData> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string>;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowKey?: string;
  variant?: 'default' | 'financial' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  isVirtualized?: boolean;
  className?: string;
}

export const DataTable = <T extends TableData = TableData>({
  columns,
  data,
  loading = false,
  error,
  emptyMessage = 'No data available',
  pageSize = 10,
  currentPage = 1,
  totalPages: _totalPages,
  totalItems: _totalItems,
  onPageChange,
  onSort,
  onFilter,
  sortColumn,
  sortDirection = 'asc',
  filters = {},
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = 'id',
  variant = 'default',
  size = 'md',
  isVirtualized: _isVirtualized = false,
  className,
}: DataTableProps<T>) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(filters);
  const [localSort, setLocalSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: sortColumn || '',
    direction: sortDirection,
  });

  // Debounced filters for performance
  const debouncedFilters = useDebounce(localFilters, 300);

  // Memoized color values
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(debouncedFilters).forEach(([columnKey, filterValue]) => {
      if (!filterValue) return;
      
      const column = columns.find(col => col.key === columnKey);
      if (!column) return;

      result = result.filter(row => {
        const cellValue = row[columnKey];
        
        if (column.filterFn) {
          return column.filterFn(cellValue, filterValue);
        }

        // Default filtering logic
        const stringValue = String(cellValue || '').toLowerCase();
        const filterString = filterValue.toLowerCase();
        
        return stringValue.includes(filterString);
      });
    });

    // Apply sorting
    if (localSort.column) {
      const column = columns.find(col => col.key === localSort.column);
      if (column) {
        result.sort((a, b) => {
          if (column.sortFn) {
            const sortResult = column.sortFn(a, b);
            return localSort.direction === 'desc' ? -sortResult : sortResult;
          }

          // Default sorting logic
          const aValue = a[localSort.column];
          const bValue = b[localSort.column];

          if (aValue === bValue) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;

          let comparison = 0;
          if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
            comparison = Number(aValue) - Number(bValue);
          } else if (column.type === 'date') {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            comparison = String(aValue).localeCompare(String(bValue));
          }

          return localSort.direction === 'desc' ? -comparison : comparison;
        });
      }
    }

    return result;
  }, [data, debouncedFilters, localSort, columns]);

  // Memoized pagination
  const paginatedData = useMemo(() => {
    if (!onPageChange) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, onPageChange]);

  // Memoized sort handler
  const handleSort = useMemoizedCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    const newDirection = 
      localSort.column === columnKey && localSort.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    const newSort = { column: columnKey, direction: newDirection };
    setLocalSort(newSort);

    if (onSort) {
      onSort(columnKey, newDirection);
    }
  }, [columns, localSort, onSort]);

  // Memoized filter handler
  const handleFilter = useMemoizedCallback((columnKey: string, value: string) => {
    const newFilters = { ...localFilters, [columnKey]: value };
    setLocalFilters(newFilters);

    if (onFilter) {
      onFilter(newFilters);
    }
  }, [localFilters, onFilter]);

  // Memoized cell renderer
  const renderCell = useMemoizedCallback((
    column: TableColumn<T>,
    value: any,
    row: T,
    index: number
  ) => {
    if (column.render) {
      return column.render(value, row, index);
    }

    switch (column.type) {
      case 'currency':
        return (
          <Text fontVariantNumeric="lining-nums tabular-nums">
            {FinancialPerformanceUtils.formatCurrency(
              Number(value) || 0,
              column.currency || 'USD'
            )}
          </Text>
        );
      
      case 'percentage':
        return (
          <Text fontVariantNumeric="lining-nums tabular-nums">
            {FinancialPerformanceUtils.formatPercentage(Number(value) || 0)}
          </Text>
        );
      
      case 'number':
        return (
          <Text fontVariantNumeric="lining-nums tabular-nums">
            {FinancialPerformanceUtils.formatNumber(
              Number(value) || 0,
              column.precision || 2
            )}
          </Text>
        );
      
      case 'date':
        return (
          <Text>
            {value ? new Date(value).toLocaleDateString() : '—'}
          </Text>
        );
      
      case 'badge':
        return (
          <Badge variant="subtle" colorScheme="blue">
            {value}
          </Badge>
        );
      
      default:
        return <Text>{value || '—'}</Text>;
    }
  }, []);

  // Memoized table header
  const tableHeader = useMemo(() => (
    <Thead bg={headerBg}>
      <Tr>
        {selectable && (
          <Th width="40px" textAlign="center">
            <input
              type="checkbox"
              checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
              onChange={(e) => {
                if (onSelectionChange) {
                  const allIds = paginatedData.map(row => String(row[rowKey]));
                  onSelectionChange(e.target.checked ? allIds : []);
                }
              }}
            />
          </Th>
        )}
        
        {columns.map((column) => (
          <Th
            key={column.key}
            width={column.width}
            minWidth={column.minWidth}
            textAlign={column.align || 'left'}
            cursor={column.sortable ? 'pointer' : 'default'}
            onClick={() => column.sortable && handleSort(column.key)}
            _hover={column.sortable ? { bg: hoverBg } : undefined}
          >
            <HStack spacing={2} justify={column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'}>
              <Text>{column.label}</Text>
              {column.sortable && (
                <Text fontSize="xs" color="gray.500">
                  {localSort.column === column.key 
                    ? (localSort.direction === 'asc' ? '↑' : '↓')
                    : '↕'
                  }
                </Text>
              )}
            </HStack>
          </Th>
        ))}
      </Tr>
      
      {/* Filter Row */}
      <Tr>
        {selectable && <Th></Th>}
        {columns.map((column) => (
          <Th key={`filter-${column.key}`} py={2}>
            {column.filterable && (
              <Input
                size="sm"
                placeholder={`Filter ${column.label.toLowerCase()}...`}
                value={localFilters[column.key] || ''}
                onChange={(e) => handleFilter(column.key, e.target.value)}
              />
            )}
          </Th>
        ))}
      </Tr>
    </Thead>
  ), [
    columns,
    selectable,
    selectedRows,
    paginatedData,
    rowKey,
    onSelectionChange,
    localSort,
    localFilters,
    handleSort,
    handleFilter,
    headerBg,
    hoverBg,
  ]);

  // Memoized table body
  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <Tbody>
          {Array.from({ length: pageSize }).map((_, index) => (
            <Tr key={`skeleton-${index}`}>
              {selectable && <Td><Skeleton height="20px" /></Td>}
              {columns.map((column) => (
                <Td key={`skeleton-${column.key}-${index}`}>
                  <Skeleton height="20px" />
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      );
    }

    if (error) {
      return (
        <Tbody>
          <Tr>
            <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center" py={8}>
              <Text color="red.500">{error}</Text>
            </Td>
          </Tr>
        </Tbody>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <Tbody>
          <Tr>
            <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center" py={8}>
              <Text color="gray.500">{emptyMessage}</Text>
            </Td>
          </Tr>
        </Tbody>
      );
    }

    return (
      <Tbody>
        {paginatedData.map((row, index) => {
          const rowId = String(row[rowKey]);
          const isSelected = selectedRows.includes(rowId);
          
          return (
            <Tr
              key={rowId}
              bg={isSelected ? selectedBg : 'transparent'}
              _hover={{ bg: isSelected ? selectedBg : hoverBg }}
            >
              {selectable && (
                <Td textAlign="center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (onSelectionChange) {
                        const newSelection = e.target.checked
                          ? [...selectedRows, rowId]
                          : selectedRows.filter(id => id !== rowId);
                        onSelectionChange(newSelection);
                      }
                    }}
                  />
                </Td>
              )}
              
              {columns.map((column) => (
                <Td
                  key={`${rowId}-${column.key}`}
                  textAlign={column.align || 'left'}
                  width={column.width}
                  minWidth={column.minWidth}
                >
                  {renderCell(column, row[column.key], row, index)}
                </Td>
              ))}
            </Tr>
          );
        })}
      </Tbody>
    );
  }, [
    loading,
    error,
    emptyMessage,
    paginatedData,
    columns,
    selectable,
    selectedRows,
    rowKey,
    onSelectionChange,
    pageSize,
    selectedBg,
    hoverBg,
    renderCell,
  ]);

  return (
    <Box className={className} overflowX="auto">
      <Table variant={variant} size={size} borderWidth="1px" borderColor={borderColor}>
        {tableHeader}
        {tableBody}
      </Table>
    </Box>
  );
};

DataTable.displayName = 'DataTable';

export default DataTable;
