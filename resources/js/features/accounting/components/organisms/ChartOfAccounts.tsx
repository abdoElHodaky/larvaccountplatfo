import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Input,
    Select,
    Flex,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    balance: number;
    parentId?: string;
    isActive: boolean;
    level: number;
}

interface ChartOfAccountsProps {
    accounts?: Account[];
    loading?: boolean;
    error?: string;
    onAccountSelect?: (account: Account) => void;
    onAccountCreate?: () => void;
    onAccountEdit?: (account: Account) => void;
    onAccountDelete?: (accountId: string) => void;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    accountTypeFilter?: string;
    onAccountTypeFilterChange?: (type: string) => void;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
    accounts = [],
    loading = false,
    error,
    onAccountSelect,
    onAccountCreate,
    onAccountEdit,
    onAccountDelete,
    searchTerm = '',
    onSearchChange,
    accountTypeFilter = '',
    onAccountTypeFilterChange,
}) => {
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    useEffect(() => {
        let filtered = accounts;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (account) =>
                    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    account.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by account type
        if (accountTypeFilter) {
            filtered = filtered.filter((account) => account.type === accountTypeFilter);
        }

        setFilteredAccounts(filtered);
    }, [accounts, searchTerm, accountTypeFilter]);

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
            <Box p={6} textAlign='center'>
                <Spinner size='lg' />
                <Text mt={4}>Loading chart of accounts...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status='error'>
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    return (
        <Box bg={bgColor} borderRadius='lg' border='1px' borderColor={borderColor} p={6}>
            <VStack spacing={6} align='stretch'>
                {/* Header */}
                <Flex justify='space-between' align='center'>
                    <Text fontSize='2xl' fontWeight='bold'>
                        Chart of Accounts
                    </Text>
                    {onAccountCreate && (
                        <Button leftIcon={<AddIcon />} colorScheme='blue' onClick={onAccountCreate}>
                            Add Account
                        </Button>
                    )}
                </Flex>

                {/* Filters */}
                <HStack spacing={4}>
                    {onSearchChange && (
                        <Input
                            placeholder='Search accounts...'
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            maxW='300px'
                        />
                    )}
                    {onAccountTypeFilterChange && (
                        <Select
                            placeholder='All Types'
                            value={accountTypeFilter}
                            onChange={(e) => onAccountTypeFilterChange(e.target.value)}
                            maxW='200px'
                        >
                            <option value='asset'>Assets</option>
                            <option value='liability'>Liabilities</option>
                            <option value='equity'>Equity</option>
                            <option value='revenue'>Revenue</option>
                            <option value='expense'>Expenses</option>
                        </Select>
                    )}
                </HStack>

                {/* Accounts Table */}
                <Box overflowX='auto'>
                    <Table variant='simple'>
                        <Thead>
                            <Tr>
                                <Th>Code</Th>
                                <Th>Account Name</Th>
                                <Th>Type</Th>
                                <Th isNumeric>Balance</Th>
                                <Th>Status</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredAccounts.map((account) => (
                                <Tr
                                    key={account.id}
                                    _hover={{ bg: hoverBg }}
                                    cursor={onAccountSelect ? 'pointer' : 'default'}
                                    onClick={() => onAccountSelect?.(account)}
                                >
                                    <Td fontFamily='mono' fontWeight='medium'>
                                        {account.code}
                                    </Td>
                                    <Td>
                                        <Text
                                            pl={account.level * 4}
                                            fontWeight={account.level === 0 ? 'bold' : 'normal'}
                                        >
                                            {account.name}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getAccountTypeColor(account.type)}>
                                            {account.type.toUpperCase()}
                                        </Badge>
                                    </Td>
                                    <Td isNumeric fontFamily='mono'>
                                        {formatCurrency(account.balance)}
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={account.isActive ? 'green' : 'gray'}>
                                            {account.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <IconButton
                                                aria-label='View account'
                                                icon={<ViewIcon />}
                                                size='sm'
                                                variant='ghost'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAccountSelect?.(account);
                                                }}
                                            />
                                            {onAccountEdit && (
                                                <IconButton
                                                    aria-label='Edit account'
                                                    icon={<EditIcon />}
                                                    size='sm'
                                                    variant='ghost'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAccountEdit(account);
                                                    }}
                                                />
                                            )}
                                            {onAccountDelete && (
                                                <IconButton
                                                    aria-label='Delete account'
                                                    icon={<DeleteIcon />}
                                                    size='sm'
                                                    variant='ghost'
                                                    colorScheme='red'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAccountDelete(account.id);
                                                    }}
                                                />
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>

                {filteredAccounts.length === 0 && (
                    <Box textAlign='center' py={8}>
                        <Text color='gray.500'>
                            {searchTerm || accountTypeFilter
                                ? 'No accounts match your filters'
                                : 'No accounts found'}
                        </Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default ChartOfAccounts;
