/**
 * User-related GraphQL Queries
 */

import { gql } from '@apollo/client';

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      name
      email
      avatar
      role
      permissions
      organizations {
        id
        name
        slug
        role
      }
      preferences {
        theme
        language
        timezone
        currency
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      avatar
      role
      isActive
      lastLoginAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_ORGANIZATION_USERS = gql`
  query GetOrganizationUsers($organizationId: ID!, $first: Int = 10, $page: Int = 1) {
    organizationUsers(organizationId: $organizationId, first: $first, page: $page) {
      data {
        id
        name
        email
        avatar
        role
        isActive
        lastLoginAt
        joinedAt
      }
      paginatorInfo {
        currentPage
        hasMorePages
        total
        count
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($organizationId: ID!, $query: String!, $limit: Int = 10) {
    searchUsers(organizationId: $organizationId, query: $query, first: $limit) {
      data {
        id
        name
        email
        avatar
        role
      }
      paginatorInfo {
        hasMorePages
        total
      }
    }
  }
`;
