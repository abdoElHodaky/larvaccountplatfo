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
  Input,
  // Flex,
  Spacer,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Performance-Optimized Trial Balance Component
 * Displays trial balance with debits, credits, and balance verification
 */

export interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  normalBalance: 'debit' | 'credit';
  category: string;
  subcategory?: string;
}

export interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  period: {
    startDate: string;
    endDate: string;
    name: string;
  };
  totals: {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    variance: number;
  };
  metadata: {
    generatedAt: Date;
    currency: string;
    precision: number;
  };
}

export interface TrialBalanceProps {
  data: TrialBalanceData;
  onAccountClick?: (account: TrialBalanceAccount) => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onPeriodChange?: (startDate: string, endDate: string) => void;
  showComparison?: boolean;
  comparisonData?: TrialBalanceData;
  className?: string;
  loading?: boolean;
}

export const TrialBalance: React.FC<TrialBalanceProps> = memo(({
  data,
  onAccountClick,
  onExport,
  // onPeriodChange,
  showComparison = false,
  comparisonData,
  className,
  loading = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'debit' | 'credit'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoized color values
  // const bgColor = useColorModeValue('white', 'gray.800');
  // const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const evenRowBg = useColorModeValue('gray.50', 'gray.700');
  // const balancedColor = useColorModeValue('green.500', 'green.400');
  const unbalancedColor = useColorModeValue('red.500', 'red.400');

  // Memoized filtered and sorted accounts
  const processedAccounts = useMemo(() => {
    let filtered = data.accounts;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(account => account.type === filterType);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(term) ||
        account.code.toLowerCase().includes(term) ||
        account.category.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'code':
          aVal = a.code;
          bVal = b.code;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'debit':
          aVal = a.debitBalance;
          bVal = b.debitBalance;
          break;
        case 'credit':
          aVal = a.creditBalance;
          bVal = b.creditBalance;
          break;
        default:
          aVal = a.code;
          bVal = b.code;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  }, [data.accounts, filterType, searchTerm, sortBy, sortDirection]);

  // Memoized account type groups
  const accountGroups = useMemo(() => {
    const groups: Record<string, TrialBalanceAccount[]> = {};
    
    processedAccounts.forEach(account => {
      if (!groups[account.type]) {
        groups[account.type] = [];
      }
      groups[account.type].push(account);
    });

    return groups;
  }, [processedAccounts]);

  // Format currency
  const formatCurrency = useMemoizedCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.metadata.currency,
      minimumFractionDigits: data.metadata.precision,
      maximumFractionDigits: data.metadata.precision,
    }).format(amount);
  }, [data.metadata.currency, data.metadata.precision]);

  // Handle sort
  const handleSort = useMemoizedCallback((column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }, [sortBy]);

  // Handle account click
  const handleAccountClick = useMemoizedCallback((account: TrialBalanceAccount) => {
    if (onAccountClick) {
      onAccountClick(account);
    }
  }, [onAccountClick]);

  // Memoized header controls
  const headerControls = useMemo(() => (
    <VStack spacing={4} align="stretch">
      {/* Period and Balance Status */}
      <HStack justify="space-between" align="center">
        <VStack align="flex-start" spacing={1}>
          <Text fontSize="lg" fontWeight="bold">
            Trial Balance
          </Text>
          <Text fontSize="sm" color="gray.500">
            {data.period.name} ({data.period.startDate} to {data.period.endDate})
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

      {/* Filters and Search */}
      <HStack spacing={4} wrap="wrap">
        <Select
          value={filterType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
          size="sm"
          maxW="200px"
        >
          <option value="all">All Account Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </Select>

        <Input
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          size="sm"
          maxW="300px"
        />

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
            Trial balance is not balanced. Please review account entries.
            Variance: {formatCurrency(Math.abs(data.totals.variance))}
          </Text>
        </Alert>
      )}
    </VStack>
  ), [
    data.period,
    data.totals,
    filterType,
    searchTerm,
    onExport,
    formatCurrency,
    unbalancedColor,
  ]);

  // Memoized table header
  const tableHeader = useMemo(() => (
    <Thead bg={headerBg}>
      <Tr>
        <Th
          cursor="pointer"
          onClick={() => handleSort('code')}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <HStack spacing={1}>
            <Text>Account Code</Text>
            {sortBy === 'code' && (
              <Text fontSize="xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </HStack>
        </Th>
        <Th
          cursor="pointer"
          onClick={() => handleSort('name')}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <HStack spacing={1}>
            <Text>Account Name</Text>
            {sortBy === 'name' && (
              <Text fontSize="xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </HStack>
        </Th>
        <Th>Type</Th>
        <Th
          isNumeric
          cursor="pointer"
          onClick={() => handleSort('debit')}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <HStack spacing={1} justify="flex-end">
            <Text>Debit</Text>
            {sortBy === 'debit' && (
              <Text fontSize="xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </HStack>
        </Th>
        <Th
          isNumeric
          cursor="pointer"
          onClick={() => handleSort('credit')}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <HStack spacing={1} justify="flex-end">
            <Text>Credit</Text>
            {sortBy === 'credit' && (
              <Text fontSize="xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </HStack>
        </Th>
        {showComparison && comparisonData && (
          <Fragment>
            <Th isNumeric>Variance</Th>
            <Th isNumeric>% Change</Th>
          </Fragment>
        )}
      </Tr>
    </Thead>
  ), [
    headerBg,
    sortBy,
    sortDirection,
    handleSort,
    showComparison,
    comparisonData,
  ]);

  // Memoized table rows
  const tableRows = useMemo(() => {
    return Object.entries(accountGroups).map(([type, accounts]) => (
      <Fragment key={type}>
        {/* Group Header */}
        <Tr bg={headerBg}>
          <Td colSpan={showComparison ? 7 : 5} fontWeight="bold" textTransform="capitalize">
            {type} Accounts ({accounts.length})
          </Td>
        </Tr>

        {/* Account Rows */}
        {accounts.map((account, index) => {
          const comparisonAccount = comparisonData?.accounts.find(
            a => a.id === account.id
          );
          
          const debitVariance = comparisonAccount 
            ? account.debitBalance - comparisonAccount.debitBalance
            : 0;
          
          const creditVariance = comparisonAccount
            ? account.creditBalance - comparisonAccount.creditBalance
            : 0;

          const totalVariance = debitVariance - creditVariance;
          
          const percentChange = comparisonAccount
            ? ((account.debitBalance + account.creditBalance) - 
               (comparisonAccount.debitBalance + comparisonAccount.creditBalance)) /
              Math.max(comparisonAccount.debitBalance + comparisonAccount.creditBalance, 1) * 100
            : 0;

          return (
            <Tr
              key={account.id}
              bg={index % 2 === 0 ? evenRowBg : 'transparent'}
              _hover={{ bg: useColorModeValue('blue.50', 'blue.900') }}
              cursor={onAccountClick ? 'pointer' : 'default'}
              onClick={() => handleAccountClick(account)}
            >
              <Td fontFamily="mono" fontSize="sm">
                {account.code}
              </Td>
              <Td>
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="medium">{account.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {account.category}
                  </Text>
                </VStack>
              </Td>
              <Td>
                <Badge
                  size="sm"
                  colorScheme={
                    account.type === 'asset' ? 'blue' :
                    account.type === 'liability' ? 'red' :
                    account.type === 'equity' ? 'purple' :
                    account.type === 'revenue' ? 'green' : 'orange'
                  }
                >
                  {account.type}
                </Badge>
              </Td>
              <Td isNumeric fontFamily="mono">
                {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : '—'}
              </Td>
              <Td isNumeric fontFamily="mono">
                {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : '—'}
              </Td>
              
              {showComparison && comparisonData && (
                <Fragment>
                  <Td isNumeric fontFamily="mono">
                    <Text color={totalVariance > 0 ? 'green.500' : totalVariance < 0 ? 'red.500' : 'gray.500'}>
                      {totalVariance !== 0 ? formatCurrency(totalVariance) : '—'}
                    </Text>
                  </Td>
                  <Td isNumeric fontFamily="mono">
                    <Text color={percentChange > 0 ? 'green.500' : percentChange < 0 ? 'red.500' : 'gray.500'}>
                      {percentChange !== 0 ? `${percentChange.toFixed(1)}%` : '—'}
                    </Text>
                  </Td>
                </Fragment>
              )}
            </Tr>
          );
        })}
      </Fragment>
    ));
  }, [
    accountGroups,
    showComparison,
    comparisonData,
    headerBg,
    evenRowBg,
    formatCurrency,
    onAccountClick,
    handleAccountClick,
  ]);

  // Memoized totals row
  const totalsRow = useMemo(() => (
    <Tr bg={headerBg} fontWeight="bold">
      <Td colSpan={3}>TOTALS</Td>
      <Td isNumeric fontFamily="mono">
        {formatCurrency(data.totals.totalDebits)}
      </Td>
      <Td isNumeric fontFamily="mono">
        {formatCurrency(data.totals.totalCredits)}
      </Td>
      {showComparison && comparisonData && (
        <Fragment>
          <Td isNumeric fontFamily="mono">
            <Text color={data.totals.variance > 0 ? 'green.500' : data.totals.variance < 0 ? 'red.500' : 'gray.500'}>
              {formatCurrency(data.totals.variance)}
            </Text>
          </Td>
          <Td isNumeric>—</Td>
        </Fragment>
      )}
    </Tr>
  ), [
    data.totals,
    formatCurrency,
    showComparison,
    comparisonData,
    headerBg,
  ]);

  if (loading) {
    return (
      <CardContainer className={className}>
        <VStack spacing={4} align="center" py={8}>
          <Text>Loading trial balance...</Text>
        </VStack>
      </CardContainer>
    );
  }

  return (
    <CardContainer className={className}>
      <VStack spacing={6} align="stretch">
        {/* Header Controls */}
        {headerControls}

        <Divider />

        {/* Trial Balance Table */}
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            {tableHeader}
            <Tbody>
              {tableRows}
              {totalsRow}
            </Tbody>
          </Table>
        </Box>

        {/* Summary */}
        <HStack justify="space-between" fontSize="sm" color="gray.500">
          <Text>
            Generated: {data.metadata.generatedAt.toLocaleString()}
          </Text>
          <Text>
            {processedAccounts.length} accounts displayed
          </Text>
        </HStack>
      </VStack>
    </CardContainer>
  );
});

TrialBalance.displayName = 'TrialBalance';

export default TrialBalance;
