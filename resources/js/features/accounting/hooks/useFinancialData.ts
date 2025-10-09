/**
 * Financial Data Hooks
 * Custom hooks for financial operations and data management
 */

import { useMemo } from 'react';
import { useGraphQLQuery, useGraphQLMutation, usePaginatedGraphQLQuery } from '../../../shared/hooks/useGraphQL';
import { useCurrentTenant } from '../../../shared/hooks/useRematchStore';
import {
  GET_CHART_OF_ACCOUNTS,
  GET_TRANSACTIONS,
  GET_TRIAL_BALANCE,
  GET_INCOME_STATEMENT,
  GET_BALANCE_SHEET,
  GET_DASHBOARD_DATA,
} from '../../../shared/services/graphql/queries';
import {
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
  CREATE_ACCOUNT,
  UPDATE_ACCOUNT,
} from '../../../shared/services/graphql/mutations';

// Types
export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  type?: 'income' | 'expense' | 'transfer';
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  search?: string;
}

export interface ReportPeriod {
  periodStart: string;
  periodEnd: string;
}

/**
 * Hook for managing chart of accounts
 */
export function useChartOfAccounts(accountType?: string) {
  const currentTenant = useCurrentTenant();

  const { data, loading, error, refetch } = useGraphQLQuery(
    GET_CHART_OF_ACCOUNTS,
    {
      variables: {
        tenantId: currentTenant?.id,
        type: accountType,
        active: true,
      },
      skip: !currentTenant?.id,
    }
  );

  const accounts = useMemo(() => data?.accounts || [], [data]);

  // Organize accounts by type
  const accountsByType = useMemo(() => {
    const organized = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: [],
    };

    accounts.forEach((account: any) => {
      const type = account.type.toLowerCase();
      if (organized[type as keyof typeof organized]) {
        organized[type as keyof typeof organized].push(account);
      }
    });

    return organized;
  }, [accounts]);

  return {
    accounts,
    accountsByType,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for managing transactions
 */
export function useTransactions(filters: TransactionFilters = {}, pageSize = 20) {
  const currentTenant = useCurrentTenant();

  const result = usePaginatedGraphQLQuery(
    GET_TRANSACTIONS,
    {
      variables: {
        tenantId: currentTenant?.id,
        ...filters,
      },
      skip: !currentTenant?.id,
      pageSize,
    }
  );

  const transactions = useMemo(() => result.data?.transactions?.data || [], [result.data]);

  return {
    ...result,
    transactions,
  };
}

/**
 * Hook for creating transactions
 */
export function useCreateTransaction() {
  const currentTenant = useCurrentTenant();

  const [createTransaction, { loading, error }] = useGraphQLMutation(
    CREATE_TRANSACTION,
    {
      refetchQueries: ['GetTransactions', 'GetDashboardData'],
    }
  );

  const create = async (transactionData: any) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    return createTransaction({
      tenantId: currentTenant.id,
      input: transactionData,
    });
  };

  return {
    createTransaction: create,
    loading,
    error,
  };
}

/**
 * Hook for updating transactions
 */
export function useUpdateTransaction() {
  const currentTenant = useCurrentTenant();

  const [updateTransaction, { loading, error }] = useGraphQLMutation(
    UPDATE_TRANSACTION,
    {
      refetchQueries: ['GetTransactions', 'GetDashboardData'],
    }
  );

  const update = async (transactionId: string, transactionData: any) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    return updateTransaction({
      id: transactionId,
      tenantId: currentTenant.id,
      input: transactionData,
    });
  };

  return {
    updateTransaction: update,
    loading,
    error,
  };
}

/**
 * Hook for deleting transactions
 */
export function useDeleteTransaction() {
  const currentTenant = useCurrentTenant();

  const [deleteTransaction, { loading, error }] = useGraphQLMutation(
    DELETE_TRANSACTION,
    {
      refetchQueries: ['GetTransactions', 'GetDashboardData'],
    }
  );

  const remove = async (transactionId: string) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    return deleteTransaction({
      id: transactionId,
      tenantId: currentTenant.id,
    });
  };

  return {
    deleteTransaction: remove,
    loading,
    error,
  };
}

/**
 * Hook for trial balance report
 */
export function useTrialBalance(period: ReportPeriod, includeZeroBalances = false) {
  const currentTenant = useCurrentTenant();

  const { data, loading, error, refetch } = useGraphQLQuery(
    GET_TRIAL_BALANCE,
    {
      variables: {
        tenantId: currentTenant?.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        includeZeroBalances,
      },
      skip: !currentTenant?.id || !period.periodStart || !period.periodEnd,
    }
  );

  const trialBalance = useMemo(() => data?.trialBalance, [data]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!trialBalance?.accounts) return null;

    const totalDebits = trialBalance.accounts.reduce(
      (sum: number, account: any) => sum + (account.debitBalance || 0),
      0
    );

    const totalCredits = trialBalance.accounts.reduce(
      (sum: number, account: any) => sum + (account.creditBalance || 0),
      0
    );

    return {
      totalDebits,
      totalCredits,
      difference: totalDebits - totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      accountCount: trialBalance.accounts.length,
    };
  }, [trialBalance]);

  return {
    trialBalance,
    summary,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for income statement report
 */
export function useIncomeStatement(period: ReportPeriod, compareWithPrevious = false) {
  const currentTenant = useCurrentTenant();

  const { data, loading, error, refetch } = useGraphQLQuery(
    GET_INCOME_STATEMENT,
    {
      variables: {
        tenantId: currentTenant?.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        compareWithPrevious,
      },
      skip: !currentTenant?.id || !period.periodStart || !period.periodEnd,
    }
  );

  const incomeStatement = useMemo(() => data?.incomeStatement, [data]);

  return {
    incomeStatement,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for balance sheet report
 */
export function useBalanceSheet(asOfDate: string, compareWithPrevious = false) {
  const currentTenant = useCurrentTenant();

  const { data, loading, error, refetch } = useGraphQLQuery(
    GET_BALANCE_SHEET,
    {
      variables: {
        tenantId: currentTenant?.id,
        asOfDate,
        compareWithPrevious,
      },
      skip: !currentTenant?.id || !asOfDate,
    }
  );

  const balanceSheet = useMemo(() => data?.balanceSheet, [data]);

  return {
    balanceSheet,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for dashboard data
 */
export function useDashboardData(period: 'CURRENT_MONTH' | 'CURRENT_QUARTER' | 'CURRENT_YEAR' = 'CURRENT_MONTH') {
  const currentTenant = useCurrentTenant();

  const { data, loading, error, refetch } = useGraphQLQuery(
    GET_DASHBOARD_DATA,
    {
      variables: {
        tenantId: currentTenant?.id,
        period,
      },
      skip: !currentTenant?.id,
      pollInterval: 30000, // Refresh every 30 seconds
    }
  );

  const dashboard = useMemo(() => data?.dashboard, [data]);

  return {
    dashboard,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for account management
 */
export function useAccountManagement() {
  const currentTenant = useCurrentTenant();

  const [createAccount, { loading: createLoading }] = useGraphQLMutation(
    CREATE_ACCOUNT,
    {
      refetchQueries: ['GetChartOfAccounts'],
    }
  );

  const [updateAccount, { loading: updateLoading }] = useGraphQLMutation(
    UPDATE_ACCOUNT,
    {
      refetchQueries: ['GetChartOfAccounts'],
    }
  );

  const create = async (accountData: any) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    return createAccount({
      tenantId: currentTenant.id,
      input: accountData,
    });
  };

  const update = async (accountId: string, accountData: any) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    return updateAccount({
      id: accountId,
      tenantId: currentTenant.id,
      input: accountData,
    });
  };

  return {
    createAccount: create,
    updateAccount: update,
    loading: createLoading || updateLoading,
  };
}

/**
 * Hook for financial calculations
 */
export function useFinancialCalculations() {
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const calculateVariance = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 1 : 0;
    return (current - previous) / Math.abs(previous);
  };

  const calculateRatio = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  return {
    formatCurrency,
    formatPercentage,
    calculateVariance,
    calculateRatio,
  };
}
