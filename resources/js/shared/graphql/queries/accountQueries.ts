/**
 * Account-related GraphQL Queries
 */

import { gql } from '@apollo/client';
import { ACCOUNT_FRAGMENT } from '../fragments/accountFragments';

export const GET_ACCOUNTS = gql`
  ${ACCOUNT_FRAGMENT}
  query GetAccounts($organizationId: ID!, $type: String, $parentId: ID) {
    accounts(organizationId: $organizationId, type: $type, parentId: $parentId) {
      ...AccountFragment
      children {
        ...AccountFragment
      }
    }
  }
`;

export const GET_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  query GetAccount($id: ID!) {
    account(id: $id) {
      ...AccountFragment
      parent {
        ...AccountFragment
      }
      children {
        ...AccountFragment
      }
      transactions(first: 10) {
        data {
          id
          date
          description
          amount
          type
        }
        paginatorInfo {
          hasMorePages
          currentPage
          total
        }
      }
    }
  }
`;

export const GET_CHART_OF_ACCOUNTS = gql`
  ${ACCOUNT_FRAGMENT}
  query GetChartOfAccounts($organizationId: ID!) {
    chartOfAccounts(organizationId: $organizationId) {
      ...AccountFragment
      children {
        ...AccountFragment
        children {
          ...AccountFragment
        }
      }
    }
  }
`;

export const GET_ACCOUNT_BALANCE = gql`
  query GetAccountBalance($accountId: ID!, $startDate: String, $endDate: String) {
    accountBalance(accountId: $accountId, startDate: $startDate, endDate: $endDate) {
      balance
      debitTotal
      creditTotal
      transactionCount
      lastUpdated
    }
  }
`;

export const SEARCH_ACCOUNTS = gql`
  ${ACCOUNT_FRAGMENT}
  query SearchAccounts($organizationId: ID!, $query: String!, $limit: Int = 10) {
    searchAccounts(organizationId: $organizationId, query: $query, first: $limit) {
      data {
        ...AccountFragment
      }
      paginatorInfo {
        hasMorePages
        total
      }
    }
  }
`;
