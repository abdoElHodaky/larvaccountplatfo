/**
 * Accounting Feature Hooks
 * Custom hooks for accounting functionality with Rematch integration
 */

import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../shared/hooks/useRematchStore';
import type { RootState } from '../../../shared/stores';
import type { Account, Transaction, JournalEntry, Filters } from '../stores/accountingModel';

// Main accounting hook
export const useAccounting = () => {
  const accounting = useSelector((state: RootState) => state.accounting);
  const dispatch = useAppDispatch();
  
  return {
    // State
    ...accounting,
    
    // Actions
    fetchAccounts: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchAccounts(filters),
    createAccount: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => 
      dispatch.accounting.createAccount(accountData),
    updateAccount: (payload: { id: string; data: Partial<Account> }) => 
      dispatch.accounting.updateAccountData(payload),
    deleteAccount: (accountId: string) => 
      dispatch.accounting.deleteAccount(accountId),
    setSelectedAccount: (account: Account | null) => 
      dispatch.accounting.setSelectedAccount(account),
    
    fetchTransactions: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchTransactions(filters),
    setSelectedTransaction: (transaction: Transaction | null) => 
      dispatch.accounting.setSelectedTransaction(transaction),
    
    fetchJournalEntries: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchJournalEntries(filters),
    setSelectedJournalEntry: (entry: JournalEntry | null) => 
      dispatch.accounting.setSelectedJournalEntry(entry),
    
    updateFilters: (filters: Partial<Filters>) => 
      dispatch.accounting.updateFilters(filters),
    resetFilters: () => 
      dispatch.accounting.resetFilters(),
    setCurrentView: (view: 'accounts' | 'transactions' | 'journal-entries' | 'reports') => 
      dispatch.accounting.setCurrentView(view),
    
    clearError: () => 
      dispatch.accounting.clearError(),
    initializeAccounting: () => 
      dispatch.accounting.initializeAccounting(),
  };
};

// Specific hooks for different parts of accounting
export const useAccounts = () => {
  const { accounts, accountsLoading, selectedAccount, error } = useSelector(
    (state: RootState) => state.accounting
  );
  const dispatch = useAppDispatch();
  
  return {
    accounts,
    loading: accountsLoading,
    selectedAccount,
    error,
    
    fetch: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchAccounts(filters),
    create: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => 
      dispatch.accounting.createAccount(accountData),
    update: (payload: { id: string; data: Partial<Account> }) => 
      dispatch.accounting.updateAccountData(payload),
    delete: (accountId: string) => 
      dispatch.accounting.deleteAccount(accountId),
    select: (account: Account | null) => 
      dispatch.accounting.setSelectedAccount(account),
  };
};

export const useTransactions = () => {
  const { transactions, transactionsLoading, selectedTransaction, error } = useSelector(
    (state: RootState) => state.accounting
  );
  const dispatch = useAppDispatch();
  
  return {
    transactions,
    loading: transactionsLoading,
    selectedTransaction,
    error,
    
    fetch: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchTransactions(filters),
    select: (transaction: Transaction | null) => 
      dispatch.accounting.setSelectedTransaction(transaction),
  };
};

export const useJournalEntries = () => {
  const { journalEntries, journalEntriesLoading, selectedJournalEntry, error } = useSelector(
    (state: RootState) => state.accounting
  );
  const dispatch = useAppDispatch();
  
  return {
    journalEntries,
    loading: journalEntriesLoading,
    selectedJournalEntry,
    error,
    
    fetch: (filters?: Partial<Filters>) => 
      dispatch.accounting.fetchJournalEntries(filters),
    select: (entry: JournalEntry | null) => 
      dispatch.accounting.setSelectedJournalEntry(entry),
  };
};

export const useFilters = () => {
  const { filters } = useSelector((state: RootState) => state.accounting);
  const dispatch = useAppDispatch();
  
  return {
    filters,
    
    update: (newFilters: Partial<Filters>) => 
      dispatch.accounting.updateFilters(newFilters),
    reset: () => 
      dispatch.accounting.resetFilters(),
    
    // Convenience methods for common filter operations
    setDateRange: (start: string, end: string) => 
      dispatch.accounting.updateFilters({ 
        dateRange: { start, end } 
      }),
    setAccountTypes: (types: string[]) => 
      dispatch.accounting.updateFilters({ accountTypes: types }),
    setSearchTerm: (term: string) => 
      dispatch.accounting.updateFilters({ searchTerm: term }),
  };
};

// Computed values hooks
export const useAccountingStats = () => {
  const { accounts, transactions } = useSelector((state: RootState) => state.accounting);
  
  // Compute statistics from current data
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.isActive).length,
    totalTransactions: transactions.length,
    reconciledTransactions: transactions.filter(t => t.reconciled).length,
    
    // Account type breakdown
    accountsByType: accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Balance totals by account type
    balancesByType: accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>),
  };
  
  return stats;
};

// Loading states hook
export const useAccountingLoading = () => {
  const { accountsLoading, transactionsLoading, journalEntriesLoading } = useSelector(
    (state: RootState) => state.accounting
  );
  
  return {
    accountsLoading,
    transactionsLoading,
    journalEntriesLoading,
    anyLoading: accountsLoading || transactionsLoading || journalEntriesLoading,
  };
};

// Error handling hook
export const useAccountingError = () => {
  const { error } = useSelector((state: RootState) => state.accounting);
  const dispatch = useAppDispatch();
  
  return {
    error,
    hasError: !!error,
    clearError: () => dispatch.accounting.clearError(),
  };
};
