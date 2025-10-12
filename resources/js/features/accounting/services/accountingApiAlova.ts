/**
 * Accounting API Service using Alova.js
 * Modern GraphQL client for accounting operations
 */

import { gql, mutation } from '../../../shared/services/alova/alova.config';
import { useRequest } from 'alova/client';

// TypeScript interfaces
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  parentId?: string;
  balance: number;
  isActive: boolean;
  description?: string;
  taxCode?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  children?: Account[];
  parent?: Account;
}

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  account: Account;
  journalEntryId?: string;
  reconciled: boolean;
  tags?: string[];
  attachments?: string[];
  organizationId: number;
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
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingFilters {
  organizationId?: number;
  accountType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  isActive?: boolean;
  searchTerm?: string;
  parentId?: string;
}

export interface TransactionFilters {
  organizationId?: number;
  accountId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  type?: 'debit' | 'credit';
  reconciled?: boolean;
  searchTerm?: string;
  tags?: string[];
}

export interface CreateAccountInput {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  parentId?: string;
  description?: string;
  taxCode?: string;
  organizationId: number;
}

export interface UpdateAccountInput {
  id: string;
  code?: string;
  name?: string;
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  parentId?: string;
  description?: string;
  taxCode?: string;
  isActive?: boolean;
}

export interface CreateTransactionInput {
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  journalEntryId?: string;
  tags?: string[];
  organizationId: number;
}

export interface CreateJournalEntryInput {
  date: string;
  reference: string;
  description: string;
  transactions: Array<{
    accountId: string;
    amount: number;
    type: 'debit' | 'credit';
    description?: string;
  }>;
  organizationId: number;
}

/**
 * Accounting API methods using Alova.js GraphQL client
 */
export const accountingApi = {
  // Get accounts with hierarchy
  getAccounts: (filters?: AccountingFilters) => gql(`
    query GetAccounts($filters: AccountFiltersInput) {
      accounts(filters: $filters) {
        id
        code
        name
        type
        subtype
        parentId
        balance
        isActive
        description
        taxCode
        organizationId
        createdAt
        updatedAt
        children {
          id
          code
          name
          type
          balance
          isActive
        }
        parent {
          id
          code
          name
          type
        }
      }
    }
  `, { filters }),

  // Get account by ID
  getAccount: (accountId: string) => gql(`
    query GetAccount($accountId: ID!) {
      account(id: $accountId) {
        id
        code
        name
        type
        subtype
        parentId
        balance
        isActive
        description
        taxCode
        organizationId
        createdAt
        updatedAt
        children {
          id
          code
          name
          type
          balance
          isActive
        }
        parent {
          id
          code
          name
          type
        }
      }
    }
  `, { accountId }),

  // Get chart of accounts
  getChartOfAccounts: (organizationId: number) => gql(`
    query GetChartOfAccounts($organizationId: Int!) {
      chartOfAccounts(organizationId: $organizationId) {
        id
        code
        name
        type
        subtype
        balance
        isActive
        children {
          id
          code
          name
          type
          subtype
          balance
          isActive
          children {
            id
            code
            name
            type
            balance
            isActive
          }
        }
      }
    }
  `, { organizationId }),

  // Create account
  createAccount: (input: CreateAccountInput) => mutation(`
    mutation CreateAccount($input: CreateAccountInput!) {
      createAccount(input: $input) {
        id
        code
        name
        type
        subtype
        parentId
        balance
        isActive
        description
        taxCode
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { input }),

  // Update account
  updateAccount: (input: UpdateAccountInput) => mutation(`
    mutation UpdateAccount($input: UpdateAccountInput!) {
      updateAccount(input: $input) {
        id
        code
        name
        type
        subtype
        parentId
        balance
        isActive
        description
        taxCode
        updatedAt
      }
    }
  `, { input }),

  // Delete account
  deleteAccount: (accountId: string) => mutation(`
    mutation DeleteAccount($accountId: ID!) {
      deleteAccount(accountId: $accountId) {
        success
        message
      }
    }
  `, { accountId }),

  // Get transactions
  getTransactions: (filters?: TransactionFilters) => gql(`
    query GetTransactions($filters: TransactionFiltersInput) {
      transactions(filters: $filters) {
        id
        date
        reference
        description
        amount
        type
        accountId
        account {
          id
          code
          name
          type
        }
        journalEntryId
        reconciled
        tags
        attachments
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { filters }),

  // Get transaction by ID
  getTransaction: (transactionId: string) => gql(`
    query GetTransaction($transactionId: ID!) {
      transaction(id: $transactionId) {
        id
        date
        reference
        description
        amount
        type
        accountId
        account {
          id
          code
          name
          type
        }
        journalEntryId
        reconciled
        tags
        attachments
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { transactionId }),

  // Create transaction
  createTransaction: (input: CreateTransactionInput) => mutation(`
    mutation CreateTransaction($input: CreateTransactionInput!) {
      createTransaction(input: $input) {
        id
        date
        reference
        description
        amount
        type
        accountId
        account {
          id
          code
          name
          type
        }
        journalEntryId
        reconciled
        tags
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { input }),

  // Update transaction
  updateTransaction: (transactionId: string, input: Partial<CreateTransactionInput>) => mutation(`
    mutation UpdateTransaction($transactionId: ID!, $input: UpdateTransactionInput!) {
      updateTransaction(transactionId: $transactionId, input: $input) {
        id
        date
        reference
        description
        amount
        type
        accountId
        reconciled
        tags
        updatedAt
      }
    }
  `, { transactionId, input }),

  // Delete transaction
  deleteTransaction: (transactionId: string) => mutation(`
    mutation DeleteTransaction($transactionId: ID!) {
      deleteTransaction(transactionId: $transactionId) {
        success
        message
      }
    }
  `, { transactionId }),

  // Get journal entries
  getJournalEntries: (organizationId: number, filters?: any) => gql(`
    query GetJournalEntries($organizationId: Int!, $filters: JournalEntryFiltersInput) {
      journalEntries(organizationId: $organizationId, filters: $filters) {
        id
        date
        reference
        description
        totalAmount
        status
        organizationId
        createdAt
        updatedAt
        transactions {
          id
          amount
          type
          account {
            id
            code
            name
            type
          }
        }
      }
    }
  `, { organizationId, filters }),

  // Create journal entry
  createJournalEntry: (input: CreateJournalEntryInput) => mutation(`
    mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
      createJournalEntry(input: $input) {
        id
        date
        reference
        description
        totalAmount
        status
        organizationId
        createdAt
        updatedAt
        transactions {
          id
          amount
          type
          account {
            id
            code
            name
            type
          }
        }
      }
    }
  `, { input }),

  // Post journal entry
  postJournalEntry: (journalEntryId: string) => mutation(`
    mutation PostJournalEntry($journalEntryId: ID!) {
      postJournalEntry(journalEntryId: $journalEntryId) {
        id
        status
        updatedAt
      }
    }
  `, { journalEntryId }),

  // Get account balances
  getAccountBalances: (organizationId: number, asOfDate?: string) => gql(`
    query GetAccountBalances($organizationId: Int!, $asOfDate: String) {
      accountBalances(organizationId: $organizationId, asOfDate: $asOfDate) {
        accountId
        account {
          id
          code
          name
          type
        }
        balance
        debitTotal
        creditTotal
        asOfDate
      }
    }
  `, { organizationId, asOfDate }),

  // Get trial balance
  getTrialBalance: (organizationId: number, asOfDate?: string) => gql(`
    query GetTrialBalance($organizationId: Int!, $asOfDate: String) {
      trialBalance(organizationId: $organizationId, asOfDate: $asOfDate) {
        accountId
        account {
          id
          code
          name
          type
        }
        debitBalance
        creditBalance
        asOfDate
      }
    }
  `, { organizationId, asOfDate }),

  // Get account activity
  getAccountActivity: (accountId: string, dateRange?: { start: string; end: string }) => gql(`
    query GetAccountActivity($accountId: ID!, $dateRange: DateRangeInput) {
      accountActivity(accountId: $accountId, dateRange: $dateRange) {
        openingBalance
        closingBalance
        totalDebits
        totalCredits
        transactions {
          id
          date
          reference
          description
          amount
          type
          reconciled
        }
      }
    }
  `, { accountId, dateRange }),

  // Reconcile transactions
  reconcileTransactions: (transactionIds: string[]) => mutation(`
    mutation ReconcileTransactions($transactionIds: [ID!]!) {
      reconcileTransactions(transactionIds: $transactionIds) {
        success
        reconciledCount
        message
      }
    }
  `, { transactionIds })
};

/**
 * React hooks for accounting data using Alova.js
 */

// Hook for accounts with real-time updates
export function useAccounts(filters?: AccountingFilters, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getAccounts(filters),
    {
      immediate: options?.enabled !== false,
      initialData: [],
    }
  );

  return {
    accounts: (data as any)?.accounts || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for chart of accounts
export function useChartOfAccounts(organizationId: number, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getChartOfAccounts(organizationId),
    {
      immediate: options?.enabled !== false && !!organizationId,
      initialData: [],
    }
  );

  return {
    chartOfAccounts: (data as any)?.chartOfAccounts || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for transactions
export function useTransactions(filters?: TransactionFilters, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getTransactions(filters),
    {
      immediate: options?.enabled !== false,
      initialData: [],
    }
  );

  return {
    transactions: (data as any)?.transactions || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for journal entries
export function useJournalEntries(organizationId: number, filters?: any, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getJournalEntries(organizationId, filters),
    {
      immediate: options?.enabled !== false && !!organizationId,
      initialData: [],
    }
  );

  return {
    journalEntries: (data as any)?.journalEntries || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for account balances
export function useAccountBalances(organizationId: number, asOfDate?: string, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getAccountBalances(organizationId, asOfDate),
    {
      immediate: options?.enabled !== false && !!organizationId,
      initialData: [],
    }
  );

  return {
    balances: (data as any)?.accountBalances || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for trial balance
export function useTrialBalance(organizationId: number, asOfDate?: string, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => accountingApi.getTrialBalance(organizationId, asOfDate),
    {
      immediate: options?.enabled !== false && !!organizationId,
      initialData: [],
    }
  );

  return {
    trialBalance: (data as any)?.trialBalance || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for creating accounts
export function useCreateAccount() {
  const { loading, error, send } = useRequest(
    (input: CreateAccountInput) => accountingApi.createAccount(input),
    {
      immediate: false,
    }
  );

  return {
    createAccount: send,
    loading,
    error,
  };
}

// Hook for updating accounts
export function useUpdateAccount() {
  const { loading, error, send } = useRequest(
    (input: UpdateAccountInput) => accountingApi.updateAccount(input),
    {
      immediate: false,
    }
  );

  return {
    updateAccount: send,
    loading,
    error,
  };
}

// Hook for creating transactions
export function useCreateTransaction() {
  const { loading, error, send } = useRequest(
    (input: CreateTransactionInput) => accountingApi.createTransaction(input),
    {
      immediate: false,
    }
  );

  return {
    createTransaction: send,
    loading,
    error,
  };
}

// Hook for creating journal entries
export function useCreateJournalEntry() {
  const { loading, error, send } = useRequest(
    (input: CreateJournalEntryInput) => accountingApi.createJournalEntry(input),
    {
      immediate: false,
    }
  );

  return {
    createJournalEntry: send,
    loading,
    error,
  };
}
