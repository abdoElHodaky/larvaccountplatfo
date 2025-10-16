/**
 * Transaction Service
 * Handles financial transactions and journal entries
 */

import { gql, mutation } from '../../../../shared/services/alova/alova.config';
import { useRequest } from 'alova';

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  account?: {
    id: string;
    name: string;
    code: string;
  };
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
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'draft' | 'posted' | 'reversed';
  organizationId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  date: string;
  reference?: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  tags?: string[];
}

export interface CreateJournalEntryRequest {
  date: string;
  reference?: string;
  description: string;
  transactions: CreateTransactionRequest[];
}

// GraphQL Queries
const GET_TRANSACTIONS = gql`
  query GetTransactions($organizationId: ID!, $filters: TransactionFilters, $pagination: PaginationInput) {
    transactions(organizationId: $organizationId, filters: $filters, pagination: $pagination) {
      data {
        id
        date
        reference
        description
        amount
        type
        accountId
        account {
          id
          name
          code
        }
        journalEntryId
        reconciled
        tags
        createdAt
        updatedAt
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

const GET_JOURNAL_ENTRIES = gql`
  query GetJournalEntries($organizationId: ID!, $filters: JournalEntryFilters, $pagination: PaginationInput) {
    journalEntries(organizationId: $organizationId, filters: $filters, pagination: $pagination) {
      data {
        id
        date
        reference
        description
        transactions {
          id
          amount
          type
          account {
            id
            name
            code
          }
        }
        totalDebit
        totalCredit
        isBalanced
        status
        createdBy
        createdAt
        updatedAt
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

const CREATE_JOURNAL_ENTRY = gql`
  mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
    createJournalEntry(input: $input) {
      id
      date
      reference
      description
      transactions {
        id
        amount
        type
        accountId
      }
      totalDebit
      totalCredit
      isBalanced
      status
      createdAt
    }
  }
`;

const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
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
`;

const RECONCILE_TRANSACTIONS = gql`
  mutation ReconcileTransactions($transactionIds: [ID!]!) {
    reconcileTransactions(transactionIds: $transactionIds) {
      success
      reconciledCount
      message
    }
  }
`;

// Service Functions
export const transactionService = {
  /**
   * Get transactions with filtering and pagination
   */
  getTransactions: (organizationId: string, filters?: any, pagination?: any) => {
    return useRequest(GET_TRANSACTIONS, {
      variables: { organizationId, filters, pagination }
    });
  },

  /**
   * Get journal entries
   */
  getJournalEntries: (organizationId: string, filters?: any, pagination?: any) => {
    return useRequest(GET_JOURNAL_ENTRIES, {
      variables: { organizationId, filters, pagination }
    });
  },

  /**
   * Create a new journal entry with transactions
   */
  createJournalEntry: (input: CreateJournalEntryRequest) => {
    return mutation(CREATE_JOURNAL_ENTRY, {
      variables: { input }
    });
  },

  /**
   * Update a transaction
   */
  updateTransaction: (id: string, input: Partial<CreateTransactionRequest>) => {
    return mutation(UPDATE_TRANSACTION, {
      variables: { id, input }
    });
  },

  /**
   * Reconcile multiple transactions
   */
  reconcileTransactions: (transactionIds: string[]) => {
    return mutation(RECONCILE_TRANSACTIONS, {
      variables: { transactionIds }
    });
  },

  /**
   * Get transactions by account
   */
  getTransactionsByAccount: (organizationId: string, accountId: string, pagination?: any) => {
    return useRequest(GET_TRANSACTIONS, {
      variables: { 
        organizationId, 
        filters: { accountId },
        pagination 
      }
    });
  },

  /**
   * Get unreconciled transactions
   */
  getUnreconciledTransactions: (organizationId: string) => {
    return useRequest(GET_TRANSACTIONS, {
      variables: { 
        organizationId, 
        filters: { reconciled: false }
      }
    });
  },

  /**
   * Search transactions
   */
  searchTransactions: (organizationId: string, query: string, pagination?: any) => {
    return useRequest(GET_TRANSACTIONS, {
      variables: { 
        organizationId, 
        filters: { search: query },
        pagination 
      }
    });
  }
};

export default transactionService;

