/**
 * Accounting Data Hooks - AlovaJS Integration
 * Phase 5+9: Feature-Specific Migration with Modern Data Management
 */

import { useRequest, usePagination } from 'alova/client';
import { restClient, createGraphQLQuery } from '@/api/client';

// Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parent_id?: string;
  description?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFilters {
  type?: string;
  subtype?: string;
  is_active?: boolean;
  search?: string;
}

export interface CreateAccountData {
  code: string;
  name: string;
  type: string;
  subtype: string;
  parent_id?: string;
  description?: string;
  is_active: boolean;
}

// =============================================================================
// REST API HOOKS
// =============================================================================

/**
 * Get all accounts with optional filtering
 */
export const useAccounts = (filters?: AccountFilters) => {
  return useRequest(
    restClient.Get('/accounts', {
      params: filters,
    }),
    {
      initialData: [],
      cacheFor: 300000, // 5 minutes
      transform: (response) => response.data,
    }
  );
};

/**
 * Get paginated accounts
 */
export const useAccountsPaginated = (filters?: AccountFilters) => {
  return usePagination(
    (page: number, pageSize: number) =>
      restClient.Get('/accounts', {
        params: {
          ...filters,
          page,
          per_page: pageSize,
        },
      }),
    {
      initialPage: 1,
      initialPageSize: 20,
      preloadPreviousPage: false,
      preloadNextPage: true,
      transform: (response) => ({
        data: response.data,
        total: response.meta.total,
      }),
    }
  );
};

/**
 * Get single account by ID
 */
export const useAccount = (accountId: string) => {
  return useRequest(
    restClient.Get(`/accounts/${accountId}`),
    {
      initialData: null,
      cacheFor: 300000, // 5 minutes
      transform: (response) => response.data,
    }
  );
};

/**
 * Create new account
 */
export const useCreateAccount = () => {
  return useRequest(
    (data: CreateAccountData) =>
      restClient.Post('/accounts', data),
    {
      immediate: false,
      transform: (response) => response.data,
    }
  );
};

/**
 * Update account
 */
export const useUpdateAccount = () => {
  return useRequest(
    ({ id, data }: { id: string; data: Partial<CreateAccountData> }) =>
      restClient.Put(`/accounts/${id}`, data),
    {
      immediate: false,
      transform: (response) => response.data,
    }
  );
};

/**
 * Delete account
 */
export const useDeleteAccount = () => {
  return useRequest(
    (accountId: string) =>
      restClient.Delete(`/accounts/${accountId}`),
    {
      immediate: false,
    }
  );
};

// =============================================================================
// GRAPHQL HOOKS
// =============================================================================

/**
 * GraphQL query for accounts with advanced filtering
 */
const GET_ACCOUNTS_QUERY = `
  query GetAccounts($filters: AccountFilters, $pagination: PaginationInput) {
    accounts(filters: $filters, pagination: $pagination) {
      edges {
        node {
          id
          code
          name
          type
          subtype
          parent_id
          description
          balance
          currency
          is_active
          created_at
          updated_at
          parent {
            id
            name
            code
          }
          children {
            id
            name
            code
            balance
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalCount
      }
    }
  }
`;

/**
 * Use GraphQL accounts query with enhanced data
 */
export const useAccountsGraphQL = (filters?: AccountFilters) => {
  return useRequest(
    createGraphQLQuery(GET_ACCOUNTS_QUERY, { filters }, {
      cacheFor: 300000,
      transform: (data) => data.accounts.edges.map((edge: any) => edge.node),
    }),
    {
      initialData: [],
    }
  );
};

/**
 * Account balance summary GraphQL query
 */
const GET_ACCOUNT_BALANCES_QUERY = `
  query GetAccountBalances($accountIds: [ID!]) {
    accountBalances(accountIds: $accountIds) {
      accountId
      balance
      currency
      lastUpdated
      transactions {
        id
        amount
        date
        description
      }
    }
  }
`;

/**
 * Get account balances with transaction details
 */
export const useAccountBalances = (accountIds: string[]) => {
  return useRequest(
    createGraphQLQuery(GET_ACCOUNT_BALANCES_QUERY, { accountIds }, {
      cacheFor: 60000, // 1 minute for balance data
      transform: (data) => data.accountBalances,
    }),
    {
      initialData: [],
    }
  );
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Account types and subtypes configuration
 */
export const useAccountTypes = () => {
  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
  ];

  const accountSubtypes = {
    asset: [
      { value: 'current_asset', label: 'Current Asset' },
      { value: 'fixed_asset', label: 'Fixed Asset' },
      { value: 'other_asset', label: 'Other Asset' },
    ],
    liability: [
      { value: 'current_liability', label: 'Current Liability' },
      { value: 'long_term_liability', label: 'Long-term Liability' },
      { value: 'other_liability', label: 'Other Liability' },
    ],
    equity: [
      { value: 'owner_equity', label: 'Owner\'s Equity' },
      { value: 'retained_earnings', label: 'Retained Earnings' },
    ],
    revenue: [
      { value: 'operating_revenue', label: 'Operating Revenue' },
      { value: 'other_revenue', label: 'Other Revenue' },
    ],
    expense: [
      { value: 'operating_expense', label: 'Operating Expense' },
      { value: 'other_expense', label: 'Other Expense' },
    ],
  };

  return { accountTypes, accountSubtypes };
};

/**
 * Account validation hook
 */
export const useAccountValidation = () => {
  const validateAccountCode = (code: string, existingAccounts: Account[]) => {
    if (!code) return 'Account code is required';
    if (code.length < 3) return 'Account code must be at least 3 characters';
    if (existingAccounts.some(account => account.code === code)) {
      return 'Account code already exists';
    }
    return null;
  };

  const validateAccountName = (name: string) => {
    if (!name) return 'Account name is required';
    if (name.length < 2) return 'Account name must be at least 2 characters';
    return null;
  };

  return {
    validateAccountCode,
    validateAccountName,
  };
};
