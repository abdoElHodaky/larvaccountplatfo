// GraphQL Client and Queries
// This is a simplified client for the structure simplification
import { gql } from '@apollo/client';

export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics($organizationId: String!) {
    dashboardMetrics(organizationId: $organizationId) {
      totalRevenue
      totalExpenses
      inventoryValue
      activeTransactions
      lowStockItems
      recentTransactions {
        id
        amount
        description
        date
      }
    }
  }
`;

export const GET_REALTIME_UPDATES = gql`
  subscription GetRealtimeUpdates($organizationId: String!) {
    realtimeUpdates(organizationId: $organizationId) {
      type
      data
      timestamp
    }
  }
`;

// Simple GraphQL client
export class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = headers;
  }

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL Error');
    }

    return result.data;
  }
}

// Default client instance
export const graphqlClient = new GraphQLClient('/graphql', {
  'X-Requested-With': 'XMLHttpRequest',
});

// Helper functions for creating queries and mutations
export function createGraphQLQuery(query: string, variables?: Record<string, any>) {
  return {
    query,
    variables,
    type: 'query' as const,
  };
}

export function createGraphQLMutation(mutation: string, variables?: Record<string, any>) {
  return {
    query: mutation,
    variables,
    type: 'mutation' as const,
  };
}
export const GET_DASHBOARD_METRICS_ACTION = 'GET_DASHBOARD_METRICS';
export const GET_REALTIME_UPDATES_ACTION = 'GET_REALTIME_UPDATES';
