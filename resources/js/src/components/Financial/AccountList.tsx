/**
 * Account List Component
 * Displays and manages chart of accounts
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
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
} from '@chakra-ui/icons';
import { useAccounts } from '../../hooks/useFinancial';
import type { Account } from '../../stores/models/financial';

interface AccountListProps {
  onAccountSelect?: (account: Account) => void;
  onAccountEdit?: (account: Account) => void;
  onAccountCreate?: () => void;
  selectable?: boolean;
  compact?: boolean;
}

const AccountList: React.FC<AccountListProps> = ({
  onAccountSelect,
  onAccountEdit,
  onAccountCreate,
  selectable = false,
  compact = false,
}) => {
  const { accounts, loading, selectedAccount, actions } = useAccounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Account['type'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter accounts based on search and filters
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = !searchQuery || 
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !typeFilter || account.type === typeFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && account.isActive) ||
        (statusFilter === 'inactive' && !account.isActive);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, searchQuery, typeFilter, statusFilter]);

  // Group accounts by type for better organization
  const accountsByType = useMemo(() => {
    const grouped = filteredAccounts.reduce((acc, account) => {
      if (!acc[account.type]) acc[account.type] = [];
      acc[account.type].push(account);
      return acc;
    }, {} as Record<Account['type'], Account[]>);

    // Sort accounts within each type by code
    Object.keys(grouped).forEach(type => {
      grouped[type as Account['type']].sort((a, b) => a.code.localeCompare(b.code));
    });

    return grouped;
  }, [filteredAccounts]);

  const handleAccountClick = (account: Account) => {
    if (selectable) {
      actions.selectAccount(account);
      onAccountSelect?.(account);
    }
  };

  const handleEditAccount = (account: Account) => {
    onAccountEdit?.(account);
  };

  const handleDeleteAccount = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete account "${account.name}"?`)) {
      try {
        await actions.deleteAccount(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const getAccountTypeLabel = (type: Account['type']) => {
    const labels = {
      asset: 'Asset',
      liability: 'Liability',
      equity: 'Equity',
      revenue: 'Revenue',
      expense: 'Expense',
    };
    return labels[type];
  };

  const getAccountTypeColor = (type: Account['type']) => {
    const colors = {
      asset: 'green',
      liability: 'red',
      equity: 'blue',
      revenue: 'purple',
      expense: 'orange',
    };
    return colors[type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
          Chart of Accounts
        </Text>
        {onAccountCreate && (
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onAccountCreate}
            size={compact ? 'sm' : 'md'}
          >
            Add Account
          </Button>
        )}
      </HStack>

      {/* Filters */}
      <HStack spacing={4} wrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size={compact ? 'sm' : 'md'}
          />
        </InputGroup>

        <Select
          placeholder="All Types"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as Account['type'] | '')}
          maxW="150px"
          size={compact ? 'sm' : 'md'}
        >
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          maxW="120px"
          size={compact ? 'sm' : 'md'}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </HStack>

      {/* Accounts Table */}
      {filteredAccounts.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No accounts found matching your criteria.
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size={compact ? 'sm' : 'md'}>
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th isNumeric>Balance</Th>
                <Th>Status</Th>
                {!compact && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(accountsByType).map(([type, typeAccounts]) => (
                <React.Fragment key={type}>
                  {/* Type Header */}
                  <Tr bg="gray.50">
                    <Td colSpan={compact ? 5 : 6} fontWeight="bold" color="gray.600">
                      {getAccountTypeLabel(type as Account['type'])} Accounts
                    </Td>
                  </Tr>
                  
                  {/* Accounts in this type */}
                  {typeAccounts.map((account) => (
                    <Tr
                      key={account.id}
                      cursor={selectable ? 'pointer' : 'default'}
                      bg={selectedAccount?.id === account.id ? 'blue.50' : 'white'}
                      _hover={selectable ? { bg: 'gray.50' } : {}}
                      onClick={() => handleAccountClick(account)}
                    >
                      <Td fontFamily="mono" fontWeight="medium">
                        {account.code}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{account.name}</Text>
                          {account.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              {account.description}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getAccountTypeColor(account.type)}>
                          {getAccountTypeLabel(account.type)}
                        </Badge>
                      </Td>
                      <Td isNumeric fontFamily="mono">
                        <Text
                          color={account.balance >= 0 ? 'green.600' : 'red.600'}
                          fontWeight="medium"
                        >
                          {formatCurrency(account.balance)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={account.isActive ? 'green' : 'gray'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
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
                                onClick={() => handleEditAccount(account)}
                              >
                                Edit Account
                              </MenuItem>
                              <MenuItem
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteAccount(account)}
                                color="red.600"
                              >
                                Delete Account
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
      {!compact && filteredAccounts.length > 0 && (
        <Box p={4} bg="gray.50" borderRadius="md">
          <HStack justify="space-between">
            <Text fontWeight="medium">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </Text>
            <Text fontSize="sm" color="gray.600">
              Total Balance: {formatCurrency(
                filteredAccounts.reduce((sum, account) => sum + account.balance, 0)
              )}
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );
};

export default AccountList;
