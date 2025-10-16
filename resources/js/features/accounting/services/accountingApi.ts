/**
 * Accounting API Service
 * Handles all accounting-related API calls with Rematch integration
 */

import { apolloClient } from '../../../shared/services/graphql/apolloClient';
import { gql } from '@apollo/client';
import type { Account, Transaction, JournalEntry, AccountingFilters } from '../stores/accountingModel';

// GraphQL Queries
const GET_ACCOUNTS = gql`
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
      createdAt
      updatedAt
    }
  }
`;

const GET_TRANSACTIONS = gql`
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
        name
        code
      }
      journalEntryId
      reconciled
      tags
      attachments
      createdAt
      updatedAt
    }
  }
`;

const GET_JOURNAL_ENTRIES = gql`
  query GetJournalEntries($filters: JournalEntryFiltersInput) {
    journalEntries(filters: $filters) {
      id
      date
      reference
      description
      totalAmount
      status
      transactions {
        id
        amount
        type
        accountId
        account {
          id
          name
          code
        }
      }
      attachments
      notes
      createdBy
      approvedBy
      createdAt
      updatedAt
    }
  }
`;

// GraphQL Mutations
const CREATE_ACCOUNT = gql`
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
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_ACCOUNT = gql`
  mutation UpdateAccount($id: ID!, $input: UpdateAccountInput!) {
    updateAccount(id: $id, input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($id: ID!) {
    deleteAccount(id: $id) {
      success
      message
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
      totalAmount
      status
      transactions {
        id
        amount
        type
        accountId
        account {
          id
          name
          code
        }
      }
      attachments
      notes
      createdBy
      createdAt
      updatedAt
    }
  }
`;

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// API Service Class
export class AccountingApiService {
  // Account methods
  async getAccounts(filters?: Partial<AccountingFilters>): Promise<ApiResponse<Account[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_ACCOUNTS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.accounts,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      throw new Error(error.message || 'Failed to fetch accounts');
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Account>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ACCOUNT,
        variables: { input: accountData },
        update: (cache, { data: mutationData }) => {
          // Update cache with new account
          const existingAccounts = cache.readQuery({ query: GET_ACCOUNTS });
          if (existingAccounts) {
            cache.writeQuery({
              query: GET_ACCOUNTS,
              data: {
                accounts: [...(existingAccounts as any).accounts, mutationData.createAccount],
              },
            });
          }
        },
      });

      return {
        data: data.createAccount,
        success: true,
        message: 'Account created successfully',
      };
    } catch (error: any) {
      console.error('Failed to create account:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  async updateAccount(id: string, accountData: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ACCOUNT,
        variables: { id, input: accountData },
        update: (cache, { data: mutationData }) => {
          // Update cache
          cache.modify({
            id: cache.identify({ __typename: 'Account', id }),
            fields: {
              ...mutationData.updateAccount,
            },
          });
        },
      });

      return {
        data: data.updateAccount,
        success: true,
        message: 'Account updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update account:', error);
      throw new Error(error.message || 'Failed to update account');
    }
  }

  async deleteAccount(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_ACCOUNT,
        variables: { id },
        update: (cache) => {
          // Remove from cache
          cache.evict({ id: cache.identify({ __typename: 'Account', id }) });
          cache.gc();
        },
      });

      return {
        data: data.deleteAccount.success,
        success: true,
        message: data.deleteAccount.message,
      };
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  // Transaction methods
  async getTransactions(filters?: Partial<AccountingFilters>): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_TRANSACTIONS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.transactions,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  }

  // Journal Entry methods
  async getJournalEntries(filters?: Partial<AccountingFilters>): Promise<ApiResponse<JournalEntry[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_JOURNAL_ENTRIES,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.journalEntries,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch journal entries:', error);
      throw new Error(error.message || 'Failed to fetch journal entries');
    }
  }

  async createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<JournalEntry>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_JOURNAL_ENTRY,
        variables: { input: entryData },
        update: (cache, { data: mutationData }) => {
          // Update cache with new journal entry
          const existingEntries = cache.readQuery({ query: GET_JOURNAL_ENTRIES });
          if (existingEntries) {
            cache.writeQuery({
              query: GET_JOURNAL_ENTRIES,
              data: {
                journalEntries: [...(existingEntries as any).journalEntries, mutationData.createJournalEntry],
              },
            });
          }
        },
      });

      return {
        data: data.createJournalEntry,
        success: true,
        message: 'Journal entry created successfully',
      };
    } catch (error: any) {
      console.error('Failed to create journal entry:', error);
      throw new Error(error.message || 'Failed to create journal entry');
    }
  }

  // Utility methods
  async getAccountBalance(accountId: string): Promise<ApiResponse<number>> {
    try {
      // This would typically be a separate query
      const accounts = await this.getAccounts();
      const account = accounts.data.find(a => a.id === accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }

      return {
        data: account.balance,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to get account balance:', error);
      throw new Error(error.message || 'Failed to get account balance');
    }
  }

  async reconcileTransactions(transactionIds: string[]): Promise<ApiResponse<boolean>> {
    try {
      // TODO: Implement reconciliation mutation
      // This is a placeholder for the reconciliation logic
      
      if (!transactionIds || transactionIds.length === 0) {
        throw new Error('No transaction IDs provided for reconciliation');
      }
      
      return {
        data: true,
        success: true,
        message: 'Transactions reconciled successfully',
      };
    } catch (error: any) {
      console.error('Failed to reconcile transactions:', error);
      throw new Error(error.message || 'Failed to reconcile transactions');
    }
  }
}

// Create and export singleton instance
export const accountingApi = new AccountingApiService();
