import { useState, useCallback } from 'react';
<<<<<<< HEAD
import { useQuery, useMutation, useSubscription } from '@apollo/GETDASHBOARDMETRICS';
=======
import { useQuery, useMutation, useSubscription } from '@apollo/client';
>>>>>>> codegen-bot/structure-simplification-split-1760284918
import { DocumentNode } from 'graphql';

/**
 * Unified data fetching hook
 * Consolidates all data fetching patterns into a single, consistent interface
 */
interface UseDataOptions {
  variables?: Record<string, any>;
  skip?: boolean;
  pollInterval?: number;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache';
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
  refetch: () => void;
  fetchMore: (options: any) => void;
}

export function useData<T = any>(
  query: DocumentNode,
  options: UseDataOptions = {}
): UseDataResult<T> {
  const {
    data,
    loading,
    error,
    refetch,
    fetchMore
  } = useQuery(query, {
    variables: options.variables,
    skip: options.skip,
    pollInterval: options.pollInterval,
    fetchPolicy: options.fetchPolicy || 'cache-first',
    errorPolicy: options.errorPolicy || 'all',
    onCompleted: options.onCompleted,
    onError: options.onError
  });

  return {
    data: data || null,
    loading,
    error,
    refetch,
    fetchMore
  };
}

/**
 * Unified mutation hook
 * Provides consistent interface for all mutations
 */
interface UseMutationOptions {
  onCompleted?: (data: any) => void;
  onError?: (error: any) => void;
  refetchQueries?: DocumentNode[];
  awaitRefetchQueries?: boolean;
  optimisticResponse?: any;
  update?: (cache: any, result: any) => void;
}

interface UseMutationResult<T> {
  mutate: (variables?: Record<string, any>) => Promise<T>;
  loading: boolean;
  error: any;
  data: T | null;
  reset: () => void;
}

export function useMutationData<T = any>(
  mutation: DocumentNode,
  options: UseMutationOptions = {}
): UseMutationResult<T> {
  const [mutateFunction, { data, loading, error, reset }] = useMutation(mutation, {
    onCompleted: options.onCompleted,
    onError: options.onError,
    refetchQueries: options.refetchQueries,
    awaitRefetchQueries: options.awaitRefetchQueries,
    optimisticResponse: options.optimisticResponse,
    update: options.update
  });

  const mutate = useCallback(async (variables?: Record<string, any>) => {
    const result = await mutateFunction({ variables });
    return result.data;
  }, [mutateFunction]);

  return {
    mutate,
    loading,
    error,
    data: data || null,
    reset
  };
}

/**
 * Unified subscription hook
 * Provides consistent interface for real-time subscriptions
 */
interface UseSubscriptionOptions {
  variables?: Record<string, any>;
  skip?: boolean;
  onSubscriptionData?: (data: any) => void;
  onSubscriptionComplete?: () => void;
  shouldResubscribe?: boolean;
}

interface UseSubscriptionResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
}

export function useSubscriptionData<T = any>(
  subscription: DocumentNode,
  options: UseSubscriptionOptions = {}
): UseSubscriptionResult<T> {
  const { data, loading, error } = useSubscription(subscription, {
    variables: options.variables,
    skip: options.skip,
    onSubscriptionData: options.onSubscriptionData,
    onSubscriptionComplete: options.onSubscriptionComplete,
    shouldResubscribe: options.shouldResubscribe
  });

  return {
    data: data || null,
    loading,
    error
  };
}

/**
 * Combined data hook for complex scenarios
 * Handles query + subscription + mutations in one hook
 */
interface UseCombinedDataOptions extends UseDataOptions {
  subscription?: DocumentNode;
  subscriptionVariables?: Record<string, any>;
  mutations?: Record<string, DocumentNode>;
}

interface UseCombinedDataResult<T> extends UseDataResult<T> {
  subscriptionData: any;
  subscriptionLoading: boolean;
  subscriptionError: any;
  mutations: Record<string, (variables?: any) => Promise<any>>;
}

export function useCombinedData<T = any>(
  query: DocumentNode,
  options: UseCombinedDataOptions = {}
): UseCombinedDataResult<T> {
  // Main query
  const queryResult = useData<T>(query, options);

  // Subscription (optional)
  const subscriptionResult = useSubscriptionData(
    options.subscription!,
    {
      variables: options.subscriptionVariables,
      skip: !options.subscription
    }
  );

  // Mutations (optional)
  const mutations: Record<string, (variables?: any) => Promise<any>> = {};
  
  if (options.mutations) {
    Object.entries(options.mutations).forEach(([key, mutation]) => {
      const { mutate } = useMutationData(mutation, {
        refetchQueries: [query]
      });
      mutations[key] = mutate;
    });
  }

  return {
    ...queryResult,
    subscriptionData: subscriptionResult.data,
    subscriptionLoading: subscriptionResult.loading,
    subscriptionError: subscriptionResult.error,
    mutations
  };
}

/**
 * Paginated data hook
 * Handles pagination with infinite scroll support
 */
interface UsePaginatedDataOptions extends UseDataOptions {
  pageSize?: number;
  infinite?: boolean;
}

interface UsePaginatedDataResult<T> extends UseDataResult<T> {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadMore: () => void;
  loadPrevious: () => void;
  currentPage: number;
  totalPages: number;
}

export function usePaginatedData<T = any>(
  query: DocumentNode,
  options: UsePaginatedDataOptions = {}
): UsePaginatedDataResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = options.pageSize || 20;

  const queryResult = useData<T>(query, {
    ...options,
    variables: {
      ...options.variables,
      page: currentPage,
      pageSize
    }
  });

  const loadMore = useCallback(() => {
    if (options.infinite) {
      queryResult.fetchMore({
        variables: {
          page: currentPage + 1,
          pageSize
        }
      });
    } else {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pageSize, options.infinite, queryResult]);

  const loadPrevious = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Extract pagination info from data
  const paginationInfo = queryResult.data?.pagination || {};
  const hasNextPage = paginationInfo.hasNextPage || false;
  const hasPreviousPage = currentPage > 1;
  const totalPages = paginationInfo.totalPages || 1;

  return {
    ...queryResult,
    hasNextPage,
    hasPreviousPage,
    loadMore,
    loadPrevious,
    currentPage,
    totalPages
  };
}

/**
 * Real-time data hook
 * Combines query with real-time updates
 */
export function useRealtimeData<T = any>(
  query: DocumentNode,
  subscription: DocumentNode,
  options: UseDataOptions = {}
): UseDataResult<T> {
  const queryResult = useData<T>(query, options);
  
  // Subscribe to real-time updates
  useSubscriptionData(subscription, {
    variables: options.variables,
    onSubscriptionData: ({ subscriptionData }) => {
      // Refetch query when subscription data changes
      if (subscriptionData.data) {
        queryResult.refetch();
      }
    }
  });

  return queryResult;
}
