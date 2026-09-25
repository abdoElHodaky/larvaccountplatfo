import { useRequest } from 'alova/client';
import { 
  createGraphQLQuery, 
  createGraphQLMutation,
  GET_TRANSACTIONS,
  GET_PRODUCTS,
  GET_DASHBOARD_METRICS
} from '../graphql/GETDASHBOARDMETRICS';

// Simplified GraphQL hooks using Alova.js
export function useGraphQLQuery(query: string, variables?: any) {
  const method = createGraphQLQuery(query, variables);
  const { data, loading, error, send } = useRequest(method);

  return {
    data: data?.data,
    loading,
    error,
    refetch: send
  };
}

export function useGraphQLMutation(mutation: string) {
  const method = createGraphQLMutation(mutation);
  const { data, loading, error, send } = useRequest(method, { immediate: false });

  const mutate = (variables?: any) => {
    return send({
      query: mutation,
      variables
    });
  };

  return [mutate, { data: data?.data, loading, error }];
}

// Specific hooks for common queries
export function useTransactions(organizationId: string, options?: { first?: number; page?: number }) {
  return useGraphQLQuery(GET_TRANSACTIONS, {
    organizationId,
    first: options?.first || 20,
    page: options?.page || 1
  });
}

export function useProducts(organizationId: string, options?: { first?: number; page?: number }) {
  return useGraphQLQuery(GET_PRODUCTS, {
    organizationId,
    first: options?.first || 20,
    page: options?.page || 1
  });
}

export function useDashboardMetrics(organizationId: string) {
  return useGraphQLQuery(GET_DASHBOARD_METRICS, { organizationId });
}

// Mutation hooks
export function useCreateTransaction() {
  const CREATE_TRANSACTION = `
    mutation CreateTransaction($input: CreateTransactionInput!) {
      createTransaction(input: $input) {
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

  return useGraphQLMutation(CREATE_TRANSACTION);
}

export function useUpdateStock() {
  const UPDATE_STOCK = `
    mutation UpdateStock($input: UpdateStockInput!) {
      updateStock(input: $input) {
        id
        name
        stock_quantity
        min_stock_level
      }
    }
  `;

  return useGraphQLMutation(UPDATE_STOCK);
}
