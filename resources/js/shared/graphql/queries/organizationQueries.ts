/**
 * Organization-related GraphQL Queries
 */

import { gql } from '@apollo/client';

export const GET_ORGANIZATIONS = gql`
  query GetOrganizations {
    organizations {
      id
      name
      slug
      description
      logo
      settings {
        currency
        timezone
        dateFormat
        fiscalYearStart
      }
      subscription {
        plan
        status
        expiresAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      name
      slug
      description
      logo
      address {
        street
        city
        state
        country
        postalCode
      }
      settings {
        currency
        timezone
        dateFormat
        fiscalYearStart
        taxSettings {
          defaultTaxRate
          taxNumber
        }
      }
      subscription {
        plan
        status
        expiresAt
        features
      }
      users {
        id
        name
        email
        role
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ORGANIZATION_SETTINGS = gql`
  query GetOrganizationSettings($organizationId: ID!) {
    organizationSettings(organizationId: $organizationId) {
      currency
      timezone
      dateFormat
      fiscalYearStart
      taxSettings {
        defaultTaxRate
        taxNumber
        taxRegions
      }
      integrations {
        banking
        payroll
        inventory
      }
      notifications {
        email
        slack
        webhook
      }
    }
  }
`;

export const GET_ORGANIZATION_STATS = gql`
  query GetOrganizationStats($organizationId: ID!, $period: String = "month") {
    organizationStats(organizationId: $organizationId, period: $period) {
      totalRevenue
      totalExpenses
      netIncome
      accountsCount
      transactionsCount
      usersCount
      growth {
        revenue
        expenses
        transactions
      }
      topAccounts {
        id
        name
        balance
        transactionCount
      }
    }
  }
`;
