/**
 * Transaction List Component
 * Displays and manages financial transactions
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Select,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  CalendarIcon,
  FilterIcon,
} from '@chakra-ui/icons';
import { useTransactions } from '../../hooks/useFinancial';
import type { Transaction } from '../../stores/models/financial';

interface TransactionListProps {
  onTransactionSelect?: (transaction: Transaction) => void;
  onTransactionEdit?: (transaction: Transaction) => void;
  onTransactionCreate?: () => void;
  selectable?: boolean;
  compact?: boolean;
  showFilters?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  onTransactionSelect,
  onTransactionEdit,
  onTransactionCreate,
  selectable = false,
  compact = false,
  showFilters = true,
}) => {
  const { transactions, loading, selectedTransaction, filters, actions } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Transaction['status'] | ''>('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Apply local filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !searchQuery || 
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || transaction.status === statusFilter;
      
      const matchesDateFrom = !dateFromFilter || 
        new Date(transaction.transactionDate) >= new Date(dateFromFilter);
      
      const matchesDateTo = !dateToFilter || 
        new Date(transaction.transactionDate) <= new Date(dateToFilter);
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [transactions, searchQuery, statusFilter, dateFromFilter, dateToFilter]);

  // Group transactions by date for better organization
  const transactionsByDate = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transactionDate).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // Sort transactions within each date by creation time (newest first)
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return grouped;
  }, [filteredTransactions]);

  const handleTransactionClick = (transaction: Transaction) => {
    if (selectable) {
      actions.selectTransaction(transaction);
      onTransactionSelect?.(transaction);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    onTransactionEdit?.(transaction);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm(`Are you sure you want to delete transaction "${transaction.referenceNumber}"?`)) {
      try {
        // This would be implemented in the financial store
        console.log('Delete transaction:', transaction.id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    const colors = {
      draft: 'gray',
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Transaction['status']) => {
    const labels = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    actions.clearFilters();
  };

  const hasActiveFilters = searchQuery || statusFilter || dateFromFilter || dateToFilter;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Header and Controls */}
      <HStack justify="space-between" wrap="wrap" spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Transactions
        </Text>
        {onTransactionCreate && (
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onTransactionCreate}
            size={compact ? 'sm' : 'md'}
          >
            New Transaction
          </Button>
        )}
      </HStack>

      {/* Filters */}
      {showFilters && (
        <VStack spacing={3} align="stretch">
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size={compact ? 'sm' : 'md'}
              />
            </InputGroup>

            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Transaction['status'] | '')}
              maxW="150px"
              size={compact ? 'sm' : 'md'}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              maxW="150px"
              size={compact ? 'sm' : 'md'}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              maxW="150px"
              size={compact ? 'sm' : 'md'}
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size={compact ? 'sm' : 'md'}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </HStack>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Flex wrap="wrap" gap={2}>
              {searchQuery && (
                <Tag size="sm" colorScheme="blue">
                  <TagLabel>Search: {searchQuery}</TagLabel>
                  <TagCloseButton onClick={() => setSearchQuery('')} />
                </Tag>
              )}
              {statusFilter && (
                <Tag size="sm" colorScheme="green">
                  <TagLabel>Status: {getStatusLabel(statusFilter)}</TagLabel>
                  <TagCloseButton onClick={() => setStatusFilter('')} />
                </Tag>
              )}
              {dateFromFilter && (
                <Tag size="sm" colorScheme="purple">
                  <TagLabel>From: {formatDate(dateFromFilter)}</TagLabel>
                  <TagCloseButton onClick={() => setDateFromFilter('')} />
                </Tag>
              )}
              {dateToFilter && (
                <Tag size="sm" colorScheme="purple">
                  <TagLabel>To: {formatDate(dateToFilter)}</TagLabel>
                  <TagCloseButton onClick={() => setDateToFilter('')} />
                </Tag>
              )}
            </Flex>
          )}
        </VStack>
      )}

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No transactions found matching your criteria.
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size={compact ? 'sm' : 'md'}>
            <Thead>
              <Tr>
                <Th>Reference</Th>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th isNumeric>Amount</Th>
                <Th>Status</Th>
                {!compact && <Th>Entries</Th>}
                {!compact && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(transactionsByDate)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateTransactions]) => (
                <React.Fragment key={date}>
                  {/* Date Header */}
                  {!compact && (
                    <Tr bg="gray.50">
                      <Td colSpan={7} fontWeight="bold" color="gray.600">
                        <HStack>
                          <CalendarIcon />
                          <Text>{date}</Text>
                        </HStack>
                      </Td>
                    </Tr>
                  )}
                  
                  {/* Transactions for this date */}
                  {dateTransactions.map((transaction) => (
                    <Tr
                      key={transaction.id}
                      cursor={selectable ? 'pointer' : 'default'}
                      bg={selectedTransaction?.id === transaction.id ? 'blue.50' : 'white'}
                      _hover={selectable ? { bg: 'gray.50' } : {}}
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <Td fontFamily="mono" fontWeight="medium">
                        {transaction.referenceNumber}
                      </Td>
                      <Td>
                        {compact ? formatDate(transaction.transactionDate) : (
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">
                              {formatDate(transaction.transactionDate)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </Text>
                          </VStack>
                        )}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" noOfLines={compact ? 1 : 2}>
                            {transaction.description}
                          </Text>
                          {!compact && transaction.journalEntries.length > 0 && (
                            <Text fontSize="xs" color="gray.500">
                              {transaction.journalEntries.length} journal entries
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td isNumeric fontFamily="mono">
                        <Text
                          color={transaction.totalAmount >= 0 ? 'green.600' : 'red.600'}
                          fontWeight="medium"
                        >
                          {formatCurrency(transaction.totalAmount)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(transaction.status)}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                      </Td>
                      {!compact && (
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {transaction.journalEntries.length} entries
                          </Text>
                        </Td>
                      )}
                      {!compact && (
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreVerticalIcon />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<EditIcon />}
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                Edit Transaction
                              </MenuItem>
                              <MenuItem
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteTransaction(transaction)}
                                color="red.600"
                              >
                                Delete Transaction
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Summary */}
      {!compact && filteredTransactions.length > 0 && (
        <Box p={4} bg="gray.50" borderRadius="md">
          <HStack justify="space-between">
            <Text fontWeight="medium">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </Text>
            <Text fontSize="sm" color="gray.600">
              Total Amount: {formatCurrency(
                filteredTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)
              )}
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );
};

export default TransactionList;
