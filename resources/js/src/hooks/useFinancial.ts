/**
 * Financial Data Hook
 * Provides easy access to financial state and actions
 */

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useMemo } from 'react';
import type { RootState, Dispatch } from '../stores';
import type { Account, Transaction, FinancialState } from '../stores/models/financial';

export const useFinancial = () => {
  const dispatch = useDispatch<Dispatch>();
  const financialState = useSelector((state: RootState) => state.financial);
  const authState = useSelector((state: RootState) => state.auth);

  // Initialize financial data when authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.currentTenant) {
      dispatch.financial.initializeFinancialData();
    }
  }, [authState.isAuthenticated, authState.currentTenant?.id]);

  // Computed values
  const computedValues = useMemo(() => {
    const { accounts, transactions, metrics } = financialState;
    
    // Account summaries by type
    const accountsByType = accounts.reduce((acc, account) => {
      if (!acc[account.type]) acc[account.type] = [];
      acc[account.type].push(account);
      return acc;
    }, {} as Record<Account['type'], Account[]>);

    // Recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Pending transactions
    const pendingTransactions = transactions.filter(t => t.status === 'pending');

    // Draft transactions
    const draftTransactions = transactions.filter(t => t.status === 'draft');

    // Account balances summary
    const totalAssets = accounts
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalLiabilities = accounts
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalEquity = accounts
      .filter(a => a.type === 'equity')
      .reduce((sum, a) => sum + a.balance, 0);

    return {
      accountsByType,
      recentTransactions,
      pendingTransactions,
      draftTransactions,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netWorth: totalAssets - totalLiabilities,
    };
  }, [financialState.accounts, financialState.transactions]);

  // Account actions
  const accountActions = {
    fetchAccounts: (params?: { page?: number; search?: string; type?: Account['type'] }) =>
      dispatch.financial.fetchAccounts(params),
    
    createAccount: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
      dispatch.financial.createAccount(accountData),
    
    updateAccount: (id: string, data: Partial<Account>) =>
      dispatch.financial.updateAccount({ id, data }),
    
    deleteAccount: (id: string) =>
      dispatch.financial.deleteAccount(id),
    
    selectAccount: (account: Account | null) =>
      dispatch.financial.setSelectedAccount(account),
  };

  // Transaction actions
  const transactionActions = {
    fetchTransactions: (params?: { page?: number; filters?: FinancialState['transactionFilters'] }) =>
      dispatch.financial.fetchTransactions(params),
    
    createTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) =>
      dispatch.financial.createTransaction(transactionData),
    
    selectTransaction: (transaction: Transaction | null) =>
      dispatch.financial.setSelectedTransaction(transaction),
    
    setFilters: (filters: Partial<FinancialState['transactionFilters']>) =>
      dispatch.financial.setTransactionFilters(filters),
    
    clearFilters: () =>
      dispatch.financial.clearTransactionFilters(),
  };

  // Report actions
  const reportActions = {
    generateReport: (type: string, parameters: Record<string, any>) =>
      dispatch.financial.generateReport({ type: type as any, parameters }),
    
    selectReport: (report: any) =>
      dispatch.financial.setSelectedReport(report),
  };

  // Metrics actions
  const metricsActions = {
    fetchMetrics: () =>
      dispatch.financial.fetchMetrics(),
    
    refreshMetrics: () =>
      dispatch.financial.fetchMetrics(),
  };

  // UI actions
  const uiActions = {
    setActiveTab: (tab: FinancialState['activeTab']) =>
      dispatch.financial.setActiveTab(tab),
    
    clearError: () =>
      dispatch.financial.setError(null),
  };

  return {
    // State
    ...financialState,
    
    // Computed values
    ...computedValues,
    
    // Loading states
    isLoading: financialState.accountsLoading || 
               financialState.transactionsLoading || 
               financialState.metricsLoading,
    
    // Actions
    accounts: accountActions,
    transactions: transactionActions,
    reports: reportActions,
    metrics: metricsActions,
    ui: uiActions,
  };
};

// Specialized hooks for specific financial data
export const useAccounts = () => {
  const { accounts, accountsLoading, selectedAccount, accounts: accountActions } = useFinancial();
  
  return {
    accounts,
    loading: accountsLoading,
    selectedAccount,
    actions: accountActions,
  };
};

export const useTransactions = () => {
  const { 
    transactions, 
    transactionsLoading, 
    selectedTransaction, 
    transactionFilters,
    recentTransactions,
    pendingTransactions,
    draftTransactions,
    transactions: transactionActions 
  } = useFinancial();
  
  return {
    transactions,
    loading: transactionsLoading,
    selectedTransaction,
    filters: transactionFilters,
    recent: recentTransactions,
    pending: pendingTransactions,
    drafts: draftTransactions,
    actions: transactionActions,
  };
};

export const useFinancialMetrics = () => {
  const { 
    metrics, 
    metricsLoading, 
    totalAssets, 
    totalLiabilities, 
    totalEquity, 
    netWorth,
    metrics: metricsActions 
  } = useFinancial();
  
  return {
    metrics,
    loading: metricsLoading,
    summary: {
      totalAssets,
      totalLiabilities,
      totalEquity,
      netWorth,
    },
    actions: metricsActions,
  };
};
