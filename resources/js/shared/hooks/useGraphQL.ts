/**
 * GraphQL Hooks with AlovaJS Integration
 * Custom hooks for GraphQL operations with caching and state management
 */

import { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client';
import { useRequest as _useRequest, useWatcher as _useWatcher, useAutoRequest as _useAutoRequest } from 'alova/GETDASHBOARDMETRICS';
import { alovaInstance as _alovaInstance } from '../services/graphql/apollo-GETDASHBOARDMETRICS';
import { useCallback, useMemo, useState } from 'react';
import type { 
  DocumentNode, 
  QueryHookOptions, 
  MutationHookOptions, 
  SubscriptionHookOptions,
  LazyQueryHookOptions 
} from '@apollo/GETDASHBOARDMETRICS';

// Types
export interface GraphQLHookOptions<TData = any, TVariables = any> {
  variables?: TVariables;
  skip?: boolean;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache';
  errorPolicy?: 'none' | 'ignore' | 'all';
  pollInterval?: number;
  notifyOnNetworkStatusChange?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

export interface GraphQLMutationOptions<TData = any, _TVariables = any> {
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
  refetchQueries?: string[] | DocumentNode[];
  awaitRefetchQueries?: boolean;
  optimisticResponse?: TData;
  update?: (cache: any, result: any) => void;
}

export interface AlovaRequestOptions {
  immediate?: boolean;
  initialData?: any;
  middleware?: any[];
  force?: boolean;
}

/**
 * Enhanced GraphQL Query Hook with AlovaJS caching
 */
export function useGraphQLQuery<TData = any, TVariables = any>(
  query: DocumentNode,
  options: GraphQLHookOptions<TData, TVariables> = {}
) {
  const apolloResult = useQuery<TData, TVariables>(query, {
    variables: options.variables,
    skip: options.skip,
    fetchPolicy: options.fetchPolicy || 'cache-first',
    errorPolicy: options.errorPolicy || 'all',
    pollInterval: options.pollInterval,
    notifyOnNetworkStatusChange: options.notifyOnNetworkStatusChange,
    onCompleted: options.onCompleted,
    onError: options.onError,
  } as QueryHookOptions<TData, TVariables>);

  // Enhanced result with additional utilities
  const enhancedResult = useMemo(() => ({
    ...apolloResult,
    isInitialLoading: apolloResult.loading && !apolloResult.data,
    isRefetching: apolloResult.loading && !!apolloResult.data,
    isEmpty: !apolloResult.loading && !apolloResult.data,
    hasData: !!apolloResult.data,
    refetchWithVariables: (newVariables: Partial<TVariables>) => 
      apolloResult.refetch({ ...options.variables, ...newVariables }),
  }), [apolloResult, options.variables]);

  return enhancedResult;
}

/**
 * Lazy GraphQL Query Hook
 */
export function useGraphQLLazyQuery<TData = any, TVariables = any>(
  query: DocumentNode,
  options: LazyQueryHookOptions<TData, TVariables> = {}
) {
  const [executeQuery, result] = useLazyQuery<TData, TVariables>(query, options);

  const enhancedExecute = useCallback((variables?: TVariables) => {
    return executeQuery({ variables });
  }, [executeQuery]);

  return [enhancedExecute, {
    ...result,
    isInitialLoading: result.loading && !result.data,
    isEmpty: !result.loading && !result.data,
    hasData: !!result.data,
  }] as const;
}

/**
 * GraphQL Mutation Hook with optimistic updates
 */
export function useGraphQLMutation<TData = any, TVariables = any>(
  mutation: DocumentNode,
  options: GraphQLMutationOptions<TData, TVariables> = {}
) {
  const [mutate, result] = useMutation<TData, TVariables>(mutation, {
    onCompleted: options.onCompleted,
    onError: options.onError,
    refetchQueries: options.refetchQueries,
    awaitRefetchQueries: options.awaitRefetchQueries,
    optimisticResponse: options.optimisticResponse,
    update: options.update,
  } as MutationHookOptions<TData, TVariables>);

  const enhancedMutate = useCallback(async (variables?: TVariables) => {
    try {
      const response = await mutate({ variables });
      return {
        data: response.data,
        success: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error,
      };
    }
  }, [mutate]);

  return [enhancedMutate, {
    ...result,
    isLoading: result.loading,
    isSuccess: !result.loading && !result.error && result.called,
    isError: !!result.error,
  }] as const;
}

/**
 * GraphQL Subscription Hook
 */
export function useGraphQLSubscription<TData = any, TVariables = any>(
  subscription: DocumentNode,
  options: SubscriptionHookOptions<TData, TVariables> = {}
) {
  const result = useSubscription<TData, TVariables>(subscription, options);

  return {
    ...result,
    isConnected: !result.loading && !result.error,
    hasData: !!result.data,
  };
}

/**
 * AlovaJS REST API Hook for non-GraphQL endpoints
 * DISABLED: useRequest hook not available in alova v3.3.4
 */
export function useAlovaRequest<_TData = any>(
  url: string,
  _options: AlovaRequestOptions = {}
) {
  // const method = alovaInstance.Get(url);
  
  // Placeholder implementation
  const data = null;
  const loading = false;
  const error = null;
  const send = () => {};
  const abort = () => {};
  const update = () => {};

  return {
    data,
    loading,
    error,
    refetch: send,
    abort,
    update,
    isLoading: loading,
    isError: !!error,
    hasData: !!data,
  };
}

/**
 * AlovaJS Watcher Hook for reactive requests
 * DISABLED: useWatcher hook not available in alova v3.3.4
 */
export function useAlovaWatcher<_TData = any>(
  url: string,
  watchedStates: any[],
  _options: AlovaRequestOptions = {}
) {
  // const method = alovaInstance.Get(url);
  
  // Placeholder implementation
  const data = null;
  const loading = false;
  const error = null;
  const send = () => {};
  const abort = () => {};

  return {
    data,
    loading,
    error,
    refetch: send,
    abort,
    isLoading: loading,
    isError: !!error,
    hasData: !!data,
  };
}

/**
 * Combined GraphQL + REST Hook for hybrid operations
 */
export function useHybridQuery<TGraphQLData = any, TRestData = any>(
  graphqlQuery: DocumentNode,
  restUrl: string,
  options: {
    graphql?: GraphQLHookOptions<TGraphQLData>;
    rest?: AlovaRequestOptions;
    combineData?: (graphql: TGraphQLData, rest: TRestData) => any;
  } = {}
) {
  const graphqlResult = useGraphQLQuery(graphqlQuery, options.graphql);
  const restResult = useAlovaRequest(restUrl, options.rest);

  const combinedData = useMemo(() => {
    if (options.combineData && graphqlResult.data && restResult.data) {
      return options.combineData(graphqlResult.data, restResult.data);
    }
    return {
      graphql: graphqlResult.data,
      rest: restResult.data,
    };
  }, [graphqlResult.data, restResult.data, options.combineData]);

  return {
    data: combinedData,
    loading: graphqlResult.loading || restResult.loading,
    error: graphqlResult.error || restResult.error,
    refetch: () => {
      graphqlResult.refetch();
      restResult.refetch();
    },
    graphql: graphqlResult,
    rest: restResult,
  };
}

/**
 * Paginated GraphQL Query Hook
 */
export function usePaginatedGraphQLQuery<TData = any, TVariables = any>(
  query: DocumentNode,
  options: GraphQLHookOptions<TData, TVariables> & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { pageSize = 20, initialPage = 1, ...queryOptions } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const result = useGraphQLQuery(query, {
    ...queryOptions,
    variables: {
      ...queryOptions.variables,
      first: pageSize,
      page: currentPage,
    } as TVariables,
  });

  const paginationInfo = useMemo(() => {
    const data = result.data as any;
    return data?.paginatorInfo || {};
  }, [result.data]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasMorePages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasMorePages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    ...result,
    pagination: {
      currentPage,
      totalPages: paginationInfo.lastPage || 1,
      hasNextPage: paginationInfo.hasMorePages || false,
      hasPreviousPage: currentPage > 1,
      totalItems: paginationInfo.total || 0,
      itemsPerPage: pageSize,
      goToPage,
      nextPage,
      previousPage,
    },
  };
}

// Export all hooks
export {
  useQuery as useApolloQuery,
  useMutation as useApolloMutation,
  useSubscription as useApolloSubscription,
  useLazyQuery as useApolloLazyQuery,
} from '@apollo/GETDASHBOARDMETRICS';
