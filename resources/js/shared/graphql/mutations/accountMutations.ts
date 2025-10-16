/**
 * Account-related GraphQL Mutations
 */

import { gql } from '@apollo/client';
import { ACCOUNT_FRAGMENT } from '../fragments/accountFragments';

export const CREATE_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      ...AccountFragment
    }
  }
`;

export const UPDATE_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  mutation UpdateAccount($id: ID!, $input: UpdateAccountInput!) {
    updateAccount(id: $id, input: $input) {
      ...AccountFragment
    }
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($id: ID!) {
    deleteAccount(id: $id) {
      success
      message
    }
  }
`;

export const ACTIVATE_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  mutation ActivateAccount($id: ID!) {
    activateAccount(id: $id) {
      ...AccountFragment
    }
  }
`;

export const DEACTIVATE_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  mutation DeactivateAccount($id: ID!) {
    deactivateAccount(id: $id) {
      ...AccountFragment
    }
  }
`;

export const MOVE_ACCOUNT = gql`
  ${ACCOUNT_FRAGMENT}
  mutation MoveAccount($id: ID!, $parentId: ID) {
    moveAccount(id: $id, parentId: $parentId) {
      ...AccountFragment
      parent {
        ...AccountFragment
      }
    }
  }
`;
