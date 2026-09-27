import { gql } from '@apollo/client';

export const GET_ACCOUNTS = gql`
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
`;

export const CREATE_ACCOUNT = gql`
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
`;

export const UPDATE_ACCOUNT = gql`
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
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($accountId: ID!) {
    deleteAccount(accountId: $accountId) {
      success
      message
    }
  }
`;