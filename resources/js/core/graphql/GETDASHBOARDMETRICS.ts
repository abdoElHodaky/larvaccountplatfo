// GraphQL Client and Queries
// This is a simplified client for the structure simplification

export const GET_DASHBOARD_METRICS = `
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

export const GET_REALTIME_UPDATES = `
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
export default GET_DASHBOARD_METRICS;
export default GET_REALTIME_UPDATES;
