/**
 * Accounting Rematch Model
 * Domain-specific state management for accounting features
 */

import { createModel } from '@rematch/PATTERNS';
import { accountingApi } from '../services/accountingApi';

// Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parentId?: string;
  balance: number;
  isActive: boolean;
  description?: string;
  taxCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  account?: Account;
  journalEntryId: string;
  reconciled: boolean;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  totalAmount: number;
  status: 'draft' | 'posted' | 'reversed';
  transactions: Transaction[];
  attachments: string[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingFilters {
  dateRange: {
    start: string;
    end: string;
  };
  accountTypes: string[];
  status: string[];
  searchTerm: string;
}

export interface AccountingState {
  // Accounts
  accounts: Account[];
  accountsLoading: boolean;
  selectedAccount: Account | null;
  
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  selectedTransaction: Transaction | null;
  
  // Journal Entries
  journalEntries: JournalEntry[];
  journalEntriesLoading: boolean;
  selectedJournalEntry: JournalEntry | null;
  
  // Filters and UI
  filters: AccountingFilters;
  currentView: 'accounts' | 'transactions' | 'journal-entries' | 'reports';
  
  // Error handling
  error: string | null;
}

// Initial state
const initialFilters: AccountingFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  accountTypes: [],
  status: [],
  searchTerm: '',
};

const initialState: AccountingState = {
  accounts: [],
  accountsLoading: false,
  selectedAccount: null,
  
  transactions: [],
  transactionsLoading: false,
  selectedTransaction: null,
  
  journalEntries: [],
  journalEntriesLoading: false,
  selectedJournalEntry: null,
  
  filters: initialFilters,
  currentView: 'accounts',
  
  error: null,
};

export const accountingModel = createModel()({
  state: initialState,
  
  reducers: {
    // Loading states
    setAccountsLoading: (state, payload: boolean) => ({
      ...state,
      accountsLoading: payload,
    }),
    
    setTransactionsLoading: (state, payload: boolean) => ({
      ...state,
      transactionsLoading: payload,
    }),
    
    setJournalEntriesLoading: (state, payload: boolean) => ({
      ...state,
      journalEntriesLoading: payload,
    }),
    
    // Error handling
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
    }),
    
    clearError: (state) => ({
      ...state,
      error: null,
    }),
    
    // Accounts
    setAccounts: (state, payload: Account[]) => ({
      ...state,
      accounts: payload,
      accountsLoading: false,
    }),
    
    addAccount: (state, payload: Account) => ({
      ...state,
      accounts: [...state.accounts, payload],
    }),
    
    updateAccount: (state, payload: Account) => ({
      ...state,
      accounts: state.accounts.map(account =>
        account.id === payload.id ? payload : account
      ),
      selectedAccount: state.selectedAccount?.id === payload.id ? payload : state.selectedAccount,
    }),
    
    removeAccount: (state, payload: string) => ({
      ...state,
      accounts: state.accounts.filter(account => account.id !== payload),
      selectedAccount: state.selectedAccount?.id === payload ? null : state.selectedAccount,
    }),
    
    setSelectedAccount: (state, payload: Account | null) => ({
      ...state,
      selectedAccount: payload,
    }),
    
    // Transactions
    setTransactions: (state, payload: Transaction[]) => ({
      ...state,
      transactions: payload,
      transactionsLoading: false,
    }),
    
    addTransaction: (state, payload: Transaction) => ({
      ...state,
      transactions: [...state.transactions, payload],
    }),
    
    updateTransaction: (state, payload: Transaction) => ({
      ...state,
      transactions: state.transactions.map(transaction =>
        transaction.id === payload.id ? payload : transaction
      ),
      selectedTransaction: state.selectedTransaction?.id === payload.id ? payload : state.selectedTransaction,
    }),
    
    removeTransaction: (state, payload: string) => ({
      ...state,
      transactions: state.transactions.filter(transaction => transaction.id !== payload),
      selectedTransaction: state.selectedTransaction?.id === payload ? null : state.selectedTransaction,
    }),
    
    setSelectedTransaction: (state, payload: Transaction | null) => ({
      ...state,
      selectedTransaction: payload,
    }),
    
    // Journal Entries
    setJournalEntries: (state, payload: JournalEntry[]) => ({
      ...state,
      journalEntries: payload,
      journalEntriesLoading: false,
    }),
    
    addJournalEntry: (state, payload: JournalEntry) => ({
      ...state,
      journalEntries: [...state.journalEntries, payload],
    }),
    
    updateJournalEntry: (state, payload: JournalEntry) => ({
      ...state,
      journalEntries: state.journalEntries.map(entry =>
        entry.id === payload.id ? payload : entry
      ),
      selectedJournalEntry: state.selectedJournalEntry?.id === payload.id ? payload : state.selectedJournalEntry,
    }),
    
    removeJournalEntry: (state, payload: string) => ({
      ...state,
      journalEntries: state.journalEntries.filter(entry => entry.id !== payload),
      selectedJournalEntry: state.selectedJournalEntry?.id === payload ? null : state.selectedJournalEntry,
    }),
    
    setSelectedJournalEntry: (state, payload: JournalEntry | null) => ({
      ...state,
      selectedJournalEntry: payload,
    }),
    
    // Filters and UI
    updateFilters: (state, payload: Partial<AccountingFilters>) => ({
      ...state,
      filters: { ...state.filters, ...payload },
    }),
    
    resetFilters: (state) => ({
      ...state,
      filters: initialFilters,
    }),
    
    setCurrentView: (state, payload: AccountingState['currentView']) => ({
      ...state,
      currentView: payload,
    }),
    
    // Bulk operations
    bulkUpdateAccounts: (state, payload: Account[]) => ({
      ...state,
      accounts: payload,
    }),
    
    bulkUpdateTransactions: (state, payload: Transaction[]) => ({
      ...state,
      transactions: payload,
    }),
  },
  
  effects: (dispatch) => ({
    // Account effects
    async fetchAccounts(filters?: Partial<AccountingFilters>) {
      dispatch.accounting.setAccountsLoading(true);
      dispatch.accounting.clearError();
      
      try {
        const response = await accountingApi.getAccounts(filters);
        dispatch.accounting.setAccounts(response.data);
      } catch (error: any) {
        dispatch.accounting.setError(error.message || 'Failed to fetch accounts');
        dispatch.accounting.setAccountsLoading(false);
      }
    },
    
    async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
      dispatch.accounting.clearError();
      
      try {
        const response = await accountingApi.createAccount(accountData);
        dispatch.accounting.addAccount(response.data);
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create account';
        dispatch.accounting.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async updateAccountData(payload: { id: string; data: Partial<Account> }) {
      dispatch.accounting.clearError();
      
      try {
        // TODO: Replace with actual API call
        // const response = await accountingApi.updateAccount(payload.id, payload.data);
        // dispatch.accounting.updateAccount(response.data);
        
        // Mock implementation
        const state = this.getState() as any;
        const existingAccount = state.accounting.accounts.find((a: any) => a.id === payload.id);
        if (existingAccount) {
          const updatedAccount = {
            ...existingAccount,
            ...payload.data,
            updatedAt: new Date().toISOString(),
          };
          dispatch.accounting.updateAccount(updatedAccount);
          return { success: true, data: updatedAccount };
        }
        
        throw new Error('Account not found');
        
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update account';
        dispatch.accounting.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async deleteAccount(accountId: string) {
      dispatch.accounting.clearError();
      
      try {
        // TODO: Replace with actual API call
        // await accountingApi.deleteAccount(accountId);
        
        dispatch.accounting.removeAccount(accountId);
        return { success: true };
        
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to delete account';
        dispatch.accounting.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    // Transaction effects
    async fetchTransactions(_filters?: Partial<AccountingFilters>) {
      dispatch.accounting.setTransactionsLoading(true);
      dispatch.accounting.clearError();
      
      try {
        // TODO: Replace with actual API call
        // const response = await accountingApi.getTransactions(filters);
        // dispatch.accounting.setTransactions(response.data);
        
        // Mock implementation
        setTimeout(() => {
          dispatch.accounting.setTransactions([]);
        }, 1000);
        
      } catch (error: any) {
        dispatch.accounting.setError(error.message || 'Failed to fetch transactions');
        dispatch.accounting.setTransactionsLoading(false);
      }
    },
    
    // Journal Entry effects
    async fetchJournalEntries(_filters?: Partial<AccountingFilters>) {
      dispatch.accounting.setJournalEntriesLoading(true);
      dispatch.accounting.clearError();
      
      try {
        // TODO: Replace with actual API call
        // const response = await accountingApi.getJournalEntries(filters);
        // dispatch.accounting.setJournalEntries(response.data);
        
        // Mock implementation
        setTimeout(() => {
          dispatch.accounting.setJournalEntries([]);
        }, 1000);
        
      } catch (error: any) {
        dispatch.accounting.setError(error.message || 'Failed to fetch journal entries');
        dispatch.accounting.setJournalEntriesLoading(false);
      }
    },
    
    // Initialize accounting module
    async initializeAccounting() {
      await Promise.all([
        dispatch.accounting.fetchAccounts(),
        dispatch.accounting.fetchTransactions(),
        dispatch.accounting.fetchJournalEntries(),
      ]);
    },
  }),
});

export type AccountingModel = typeof accountingModel;
