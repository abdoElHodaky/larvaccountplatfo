/**
 * Financial Model for Rematch
 * Handles accounting data, transactions, accounts, and financial operations
 */

import { createModel } from '@rematch/core';
import type { RootModel } from '../index';

// Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  balance: number;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  description: string;
  totalAmount: number;
  transactionDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  journalEntries: JournalEntry[];
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  accountId: string;
  account?: Account;
  debitAmount: number;
  creditAmount: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'custom';
  parameters: Record<string, any>;
  data: any;
  generatedAt: string;
  expiresAt?: string;
  filePath?: string;
}

export interface FinancialMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  lastUpdated: string;
}

export interface FinancialState {
  // Accounts
  accounts: Account[];
  accountsLoading: boolean;
  selectedAccount: Account | null;
  
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  selectedTransaction: Transaction | null;
  transactionFilters: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    status?: Transaction['status'];
    search?: string;
  };
  
  // Journal Entries
  journalEntries: JournalEntry[];
  journalEntriesLoading: boolean;
  
  // Reports
  reports: FinancialReport[];
  reportsLoading: boolean;
  selectedReport: FinancialReport | null;
  
  // Financial Metrics
  metrics: FinancialMetrics | null;
  metricsLoading: boolean;
  
  // UI State
  activeTab: 'accounts' | 'transactions' | 'reports' | 'dashboard';
  
  // Error handling
  error: string | null;
  
  // Pagination
  pagination: {
    accounts: { page: number; total: number; perPage: number };
    transactions: { page: number; total: number; perPage: number };
    journalEntries: { page: number; total: number; perPage: number };
  };
}

const initialState: FinancialState = {
  // Accounts
  accounts: [],
  accountsLoading: false,
  selectedAccount: null,
  
  // Transactions
  transactions: [],
  transactionsLoading: false,
  selectedTransaction: null,
  transactionFilters: {},
  
  // Journal Entries
  journalEntries: [],
  journalEntriesLoading: false,
  
  // Reports
  reports: [],
  reportsLoading: false,
  selectedReport: null,
  
  // Financial Metrics
  metrics: null,
  metricsLoading: false,
  
  // UI State
  activeTab: 'dashboard',
  
  // Error handling
  error: null,
  
  // Pagination
  pagination: {
    accounts: { page: 1, total: 0, perPage: 20 },
    transactions: { page: 1, total: 0, perPage: 20 },
    journalEntries: { page: 1, total: 0, perPage: 20 },
  },
};

export const financial = createModel<RootModel>()({
  state: initialState,
  
  reducers: {
    // General
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
    }),
    
    setActiveTab: (state, payload: FinancialState['activeTab']) => ({
      ...state,
      activeTab: payload,
    }),
    
    // Accounts
    setAccountsLoading: (state, payload: boolean) => ({
      ...state,
      accountsLoading: payload,
    }),
    
    setAccounts: (state, payload: { accounts: Account[]; pagination?: Partial<FinancialState['pagination']['accounts']> }) => ({
      ...state,
      accounts: payload.accounts,
      accountsLoading: false,
      pagination: {
        ...state.pagination,
        accounts: { ...state.pagination.accounts, ...payload.pagination },
      },
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
    setTransactionsLoading: (state, payload: boolean) => ({
      ...state,
      transactionsLoading: payload,
    }),
    
    setTransactions: (state, payload: { transactions: Transaction[]; pagination?: Partial<FinancialState['pagination']['transactions']> }) => ({
      ...state,
      transactions: payload.transactions,
      transactionsLoading: false,
      pagination: {
        ...state.pagination,
        transactions: { ...state.pagination.transactions, ...payload.pagination },
      },
    }),
    
    addTransaction: (state, payload: Transaction) => ({
      ...state,
      transactions: [payload, ...state.transactions],
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
    
    setTransactionFilters: (state, payload: Partial<FinancialState['transactionFilters']>) => ({
      ...state,
      transactionFilters: { ...state.transactionFilters, ...payload },
    }),
    
    clearTransactionFilters: (state) => ({
      ...state,
      transactionFilters: {},
    }),
    
    // Journal Entries
    setJournalEntriesLoading: (state, payload: boolean) => ({
      ...state,
      journalEntriesLoading: payload,
    }),
    
    setJournalEntries: (state, payload: { journalEntries: JournalEntry[]; pagination?: Partial<FinancialState['pagination']['journalEntries']> }) => ({
      ...state,
      journalEntries: payload.journalEntries,
      journalEntriesLoading: false,
      pagination: {
        ...state.pagination,
        journalEntries: { ...state.pagination.journalEntries, ...payload.pagination },
      },
    }),
    
    // Reports
    setReportsLoading: (state, payload: boolean) => ({
      ...state,
      reportsLoading: payload,
    }),
    
    setReports: (state, payload: FinancialReport[]) => ({
      ...state,
      reports: payload,
      reportsLoading: false,
    }),
    
    addReport: (state, payload: FinancialReport) => ({
      ...state,
      reports: [payload, ...state.reports],
    }),
    
    setSelectedReport: (state, payload: FinancialReport | null) => ({
      ...state,
      selectedReport: payload,
    }),
    
    // Financial Metrics
    setMetricsLoading: (state, payload: boolean) => ({
      ...state,
      metricsLoading: payload,
    }),
    
    setMetrics: (state, payload: FinancialMetrics) => ({
      ...state,
      metrics: payload,
      metricsLoading: false,
    }),
    
    // Pagination
    updatePagination: (state, payload: { type: keyof FinancialState['pagination']; data: Partial<FinancialState['pagination']['accounts']> }) => ({
      ...state,
      pagination: {
        ...state.pagination,
        [payload.type]: { ...state.pagination[payload.type], ...payload.data },
      },
    }),
  },
  
  effects: (dispatch) => ({
    // Accounts
    async fetchAccounts(payload?: { page?: number; search?: string; type?: Account['type'] }) {
      dispatch.financial.setAccountsLoading(true);
      
      try {
        const params = new URLSearchParams();
        if (payload?.page) params.append('page', payload.page.toString());
        if (payload?.search) params.append('search', payload.search);
        if (payload?.type) params.append('type', payload.type);
        
        const response = await fetch(`/api/accounts?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const data = await response.json();
        
        dispatch.financial.setAccounts({
          accounts: data.data,
          pagination: {
            page: data.current_page,
            total: data.total,
            perPage: data.per_page,
          },
        });
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch accounts';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    async createAccount(payload: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
      try {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create account');
        }
        
        const account = await response.json();
        dispatch.financial.addAccount(account.data);
        
        return account.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create account';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    async updateAccount(payload: { id: string; data: Partial<Account> }) {
      try {
        const response = await fetch(`/api/accounts/${payload.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload.data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update account');
        }
        
        const account = await response.json();
        dispatch.financial.updateAccount(account.data);
        
        return account.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update account';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    async deleteAccount(accountId: string) {
      try {
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete account');
        }
        
        dispatch.financial.removeAccount(accountId);
        
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete account';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    // Transactions
    async fetchTransactions(payload?: { page?: number; filters?: FinancialState['transactionFilters'] }) {
      dispatch.financial.setTransactionsLoading(true);
      
      try {
        const params = new URLSearchParams();
        if (payload?.page) params.append('page', payload.page.toString());
        if (payload?.filters?.dateFrom) params.append('date_from', payload.filters.dateFrom);
        if (payload?.filters?.dateTo) params.append('date_to', payload.filters.dateTo);
        if (payload?.filters?.accountId) params.append('account_id', payload.filters.accountId);
        if (payload?.filters?.status) params.append('status', payload.filters.status);
        if (payload?.filters?.search) params.append('search', payload.filters.search);
        
        const response = await fetch(`/api/transactions?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        dispatch.financial.setTransactions({
          transactions: data.data,
          pagination: {
            page: data.current_page,
            total: data.total,
            perPage: data.per_page,
          },
        });
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    async createTransaction(payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create transaction');
        }
        
        const transaction = await response.json();
        dispatch.financial.addTransaction(transaction.data);
        
        return transaction.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create transaction';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    // Financial Metrics
    async fetchMetrics() {
      dispatch.financial.setMetricsLoading(true);
      
      try {
        const response = await fetch('/api/financial/metrics', {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch financial metrics');
        }
        
        const metrics = await response.json();
        dispatch.financial.setMetrics(metrics.data);
        
        return metrics.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch financial metrics';
        dispatch.financial.setError(message);
        throw error;
      }
    },
    
    // Reports
    async generateReport(payload: { type: FinancialReport['type']; parameters: Record<string, any> }) {
      dispatch.financial.setReportsLoading(true);
      
      try {
        const response = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate report');
        }
        
        const report = await response.json();
        dispatch.financial.addReport(report.data);
        
        return report.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate report';
        dispatch.financial.setError(message);
        throw error;
      } finally {
        dispatch.financial.setReportsLoading(false);
      }
    },
    
    // Initialize financial data
    async initializeFinancialData() {
      try {
        // Fetch initial data in parallel
        await Promise.all([
          dispatch.financial.fetchAccounts({ page: 1 }),
          dispatch.financial.fetchTransactions({ page: 1 }),
          dispatch.financial.fetchMetrics(),
        ]);
      } catch (error) {
        console.error('Failed to initialize financial data:', error);
      }
    },
  }),
});
