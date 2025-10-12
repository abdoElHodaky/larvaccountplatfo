import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

// Simplified GraphQL client with Alova.js
export const graphqlClient = createAlova({
  baseURL: '/graphql',
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  timeout: 15000,
  
  beforeRequest(method) {
    // Add authentication
    const token = localStorage.getItem('auth_token');
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      method.config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    // Add organization context
    const organizationId = localStorage.getItem('current_organization_id');
    if (organizationId) {
      method.config.headers['X-Organization-ID'] = organizationId;
    }

    // GraphQL content type
    method.config.headers['Content-Type'] = 'application/json';
  },

  responded: {
    onSuccess: (response) => {
      return response.json();
    },
    onError: (error) => {
      console.error('GraphQL Error:', error);
      throw error;
    }
  }
});

// GraphQL query helper
export function createGraphQLQuery(query: string, variables?: any) {
  return graphqlClient.Post('/', {
    query,
    variables
  });
}

// GraphQL mutation helper
export function createGraphQLMutation(mutation: string, variables?: any) {
  return graphqlClient.Post('/', {
    query: mutation,
    variables
  });
}

// Common GraphQL queries
export const GET_TRANSACTIONS = `
  query GetTransactions($organizationId: ID!, $first: Int, $page: Int) {
    transactions(organizationId: $organizationId, first: $first, page: $page) {
      data {
        id
        amount
        type
        description
        date
        account {
          id
          name
        }
      }
      paginatorInfo {
        currentPage
        hasMorePages
        total
      }
    }
  }
`;

export const GET_PRODUCTS = `
  query GetProducts($organizationId: ID!, $first: Int, $page: Int) {
    products(organizationId: $organizationId, first: $first, page: $page) {
      data {
        id
        name
        sku
        stock_quantity
        min_stock_level
        cost_price
      }
      paginatorInfo {
        currentPage
        hasMorePages
        total
      }
    }
  }
`;

export const GET_DASHBOARD_METRICS = `
  query GetDashboardMetrics($organizationId: ID!) {
    accountingDashboard(organizationId: $organizationId) {
      total_revenue
      total_expenses
      net_income
      cash_flow
    }
    inventoryDashboard(organizationId: $organizationId) {
      total_products
      low_stock_items
      out_of_stock_items
      total_value
    }
  }
`;

// GraphQL subscriptions
export const TRANSACTION_UPDATES_SUBSCRIPTION = `
  subscription TransactionUpdates($organizationId: ID!) {
    transactionUpdates(organizationId: $organizationId) {
      id
      amount
      type
      description
      date
      account {
        id
        name
      }
    }
  }
`;

export const STOCK_UPDATES_SUBSCRIPTION = `
  subscription StockUpdates($organizationId: ID!) {
    stockUpdates(organizationId: $organizationId) {
      id
      name
      sku
      stock_quantity
      min_stock_level
    }
  }
`;

export const DASHBOARD_UPDATES_SUBSCRIPTION = `
  subscription DashboardUpdates($organizationId: ID!) {
    dashboardUpdates(organizationId: $organizationId) {
      organization_id
      metric_type
      total_revenue
      total_expenses
      net_income
      total_products
      low_stock_items
      updated_at
    }
  }
`;
