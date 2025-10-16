/**
 * Account Service
 * Handles chart of accounts operations
 */

import { gql, mutation } from '../../../../shared/services/alova/alova.config';
import { useRequest } from 'alova';

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

export interface CreateAccountRequest {
  code: string;
  name: string;
  type: Account['type'];
  subtype?: string;
  parentId?: string;
  description?: string;
  taxCode?: string;
}

export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
  isActive?: boolean;
}

// GraphQL Queries
const GET_ACCOUNTS = gql`
  query GetAccounts($organizationId: ID!, $filters: AccountFilters) {
    accounts(organizationId: $organizationId, filters: $filters) {
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
`;

const GET_ACCOUNT = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
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
`;

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

// Service Functions
export const accountService = {
  /**
   * Get all accounts for an organization
   */
  getAccounts: (organizationId: string, filters?: any) => {
    return useRequest(GET_ACCOUNTS, {
      variables: { organizationId, filters }
    });
  },

  /**
   * Get a specific account by ID
   */
  getAccount: (id: string) => {
    return useRequest(GET_ACCOUNT, {
      variables: { id }
    });
  },

  /**
   * Create a new account
   */
  createAccount: (input: CreateAccountRequest) => {
    return mutation(CREATE_ACCOUNT, {
      variables: { input }
    });
  },

  /**
   * Update an existing account
   */
  updateAccount: (id: string, input: UpdateAccountRequest) => {
    return mutation(UPDATE_ACCOUNT, {
      variables: { id, input }
    });
  },

  /**
   * Delete an account
   */
  deleteAccount: (id: string) => {
    return mutation(DELETE_ACCOUNT, {
      variables: { id }
    });
  },

  /**
   * Get account hierarchy
   */
  getAccountHierarchy: (organizationId: string) => {
    return useRequest(GET_ACCOUNTS, {
      variables: { 
        organizationId, 
        filters: { includeHierarchy: true } 
      }
    });
  },

  /**
   * Get accounts by type
   */
  getAccountsByType: (organizationId: string, type: Account['type']) => {
    return useRequest(GET_ACCOUNTS, {
      variables: { 
        organizationId, 
        filters: { type } 
      }
    });
  }
};

export default accountService;

