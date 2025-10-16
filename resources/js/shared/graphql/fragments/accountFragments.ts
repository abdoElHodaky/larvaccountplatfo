/**
 * Account-related GraphQL Fragments
 * Reusable fragments for account data
 */

import { gql } from '@apollo/client';

export const ACCOUNT_FRAGMENT = gql`
  fragment AccountFragment on Account {
    id
    code
    name
    type
    description
    isActive
    parentId
    balance
    debitBalance
    creditBalance
    createdAt
    updatedAt
  }
`;

export const ACCOUNT_WITH_PARENT_FRAGMENT = gql`
  ${ACCOUNT_FRAGMENT}
  fragment AccountWithParentFragment on Account {
    ...AccountFragment
    parent {
      ...AccountFragment
    }
  }
`;

export const ACCOUNT_WITH_CHILDREN_FRAGMENT = gql`
  ${ACCOUNT_FRAGMENT}
  fragment AccountWithChildrenFragment on Account {
    ...AccountFragment
    children {
      ...AccountFragment
    }
  }
`;

export const ACCOUNT_HIERARCHY_FRAGMENT = gql`
  ${ACCOUNT_FRAGMENT}
  fragment AccountHierarchyFragment on Account {
    ...AccountFragment
    parent {
      ...AccountFragment
      parent {
        ...AccountFragment
      }
    }
    children {
      ...AccountFragment
      children {
        ...AccountFragment
      }
    }
  }
`;

export const ACCOUNT_BALANCE_FRAGMENT = gql`
  fragment AccountBalanceFragment on AccountBalance {
    balance
    debitTotal
    creditTotal
    transactionCount
    lastUpdated
    periodStart
    periodEnd
  }
`;
