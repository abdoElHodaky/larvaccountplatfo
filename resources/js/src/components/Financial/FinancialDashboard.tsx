/**
 * Financial Dashboard Component
 * Main dashboard for financial overview and quick actions
 */

import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  HStack,
  VStack,
  Badge,
  Divider,
  SimpleGrid,
  Progress,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  AddIcon,
  ViewIcon,
  DownloadIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { useFinancialMetrics, useTransactions, useAccounts } from '../../hooks/useFinancial';
import { useAuth } from '../../hooks/useAuth';
import AccountList from './AccountList';
import TransactionList from './TransactionList';

interface FinancialDashboardProps {
  onCreateTransaction?: () => void;
  onCreateAccount?: () => void;
  onViewReports?: () => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  onCreateTransaction,
  onCreateAccount,
  onViewReports,
}) => {
  const { currentTenant } = useAuth();
  const { metrics, summary, loading: metricsLoading, actions: metricsActions } = useFinancialMetrics();
  const { recent: recentTransactions, pending: pendingTransactions, drafts: draftTransactions } = useTransactions();
  const { accounts } = useAccounts();

  const cardBg = useColorModeValue('white', 'gray.800');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Refresh metrics on mount
  useEffect(() => {
    metricsActions.refreshMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentTenant?.settings?.currency || 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getHealthScore = () => {
    if (!summary.totalAssets) return 0;
    const debtToAssetRatio = summary.totalLiabilities / summary.totalAssets;
    return Math.max(0, Math.min(100, (1 - debtToAssetRatio) * 100));
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  if (metricsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" wrap="wrap">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Financial Dashboard</Heading>
          <Text color="gray.600">
            {currentTenant?.name} • {new Date().toLocaleDateString()}
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          {onCreateTransaction && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onCreateTransaction}
            >
              New Transaction
            </Button>
          )}
          {onCreateAccount && (
            <Button
              leftIcon={<AddIcon />}
              variant="outline"
              onClick={onCreateAccount}
            >
              New Account
            </Button>
          )}
          {onViewReports && (
            <Button
              leftIcon={<ViewIcon />}
              variant="outline"
              onClick={onViewReports}
            >
              Reports
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total Assets</StatLabel>
              <StatNumber color="green.500">
                {formatCurrency(summary.totalAssets)}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {accounts.filter(a => a.type === 'asset').length} accounts
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total Liabilities</StatLabel>
              <StatNumber color="red.500">
                {formatCurrency(summary.totalLiabilities)}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                {accounts.filter(a => a.type === 'liability').length} accounts
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Net Worth</StatLabel>
              <StatNumber color={summary.netWorth >= 0 ? 'green.500' : 'red.500'}>
                {formatCurrency(summary.netWorth)}
              </StatNumber>
              <StatHelpText>
                Assets - Liabilities
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Financial Health</StatLabel>
              <StatNumber>{getHealthScore().toFixed(0)}%</StatNumber>
              <Progress
                value={getHealthScore()}
                colorScheme={getHealthColor(getHealthScore())}
                size="sm"
                mt={2}
              />
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Alerts and Notifications */}
      {(pendingTransactions.length > 0 || draftTransactions.length > 0) && (
        <VStack spacing={3} align="stretch">
          {pendingTransactions.length > 0 && (
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  {pendingTransactions.length} transactions pending approval
                </Text>
                <Text fontSize="sm">
                  Review and approve pending transactions to keep your books up to date.
                </Text>
              </Box>
            </Alert>
          )}
          
          {draftTransactions.length > 0 && (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  {draftTransactions.length} draft transactions
                </Text>
                <Text fontSize="sm">
                  Complete your draft transactions to record them in your books.
                </Text>
              </Box>
            </Alert>
          )}
        </VStack>
      )}

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Recent Transactions */}
        <GridItem>
          <Card bg={cardBg}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Transactions</Heading>
                <Badge colorScheme="blue">{recentTransactions.length}</Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {recentTransactions.length === 0 ? (
                <VStack spacing={4} py={8}>
                  <Text color="gray.500">No recent transactions</Text>
                  {onCreateTransaction && (
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={onCreateTransaction}
                    >
                      Create First Transaction
                    </Button>
                  )}
                </VStack>
              ) : (
                <TransactionList
                  compact
                  showFilters={false}
                  onTransactionCreate={onCreateTransaction}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Account Summary */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Account Types Summary */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Account Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {[
                    { type: 'asset', label: 'Assets', color: 'green' },
                    { type: 'liability', label: 'Liabilities', color: 'red' },
                    { type: 'equity', label: 'Equity', color: 'blue' },
                    { type: 'revenue', label: 'Revenue', color: 'purple' },
                    { type: 'expense', label: 'Expenses', color: 'orange' },
                  ].map(({ type, label, color }) => {
                    const typeAccounts = accounts.filter(a => a.type === type);
                    const totalBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
                    
                    return (
                      <HStack key={type} justify="space-between">
                        <HStack>
                          <Badge colorScheme={color}>{typeAccounts.length}</Badge>
                          <Text>{label}</Text>
                        </HStack>
                        <Text fontFamily="mono" fontWeight="medium">
                          {formatCurrency(totalBalance)}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Quick Actions</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {onCreateTransaction && (
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={onCreateTransaction}
                      size="sm"
                    >
                      Record Transaction
                    </Button>
                  )}
                  {onCreateAccount && (
                    <Button
                      leftIcon={<AddIcon />}
                      variant="outline"
                      onClick={onCreateAccount}
                      size="sm"
                    >
                      Add Account
                    </Button>
                  )}
                  {onViewReports && (
                    <Button
                      leftIcon={<ViewIcon />}
                      variant="outline"
                      onClick={onViewReports}
                      size="sm"
                    >
                      View Reports
                    </Button>
                  )}
                  <Button
                    leftIcon={<DownloadIcon />}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would trigger a report export
                      console.log('Export financial data');
                    }}
                  >
                    Export Data
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Financial Health Details */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Financial Health</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm">Overall Score</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {getHealthScore().toFixed(0)}%
                      </Text>
                    </HStack>
                    <Progress
                      value={getHealthScore()}
                      colorScheme={getHealthColor(getHealthScore())}
                      size="sm"
                    />
                  </Box>
                  
                  <Divider />
                  
                  <VStack spacing={2} align="stretch" fontSize="sm">
                    <HStack justify="space-between">
                      <Text>Debt-to-Asset Ratio</Text>
                      <Text fontWeight="medium">
                        {summary.totalAssets > 0 
                          ? formatPercentage(summary.totalLiabilities / summary.totalAssets)
                          : '0%'
                        }
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text>Equity Ratio</Text>
                      <Text fontWeight="medium">
                        {summary.totalAssets > 0 
                          ? formatPercentage(summary.totalEquity / summary.totalAssets)
                          : '0%'
                        }
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default FinancialDashboard;
