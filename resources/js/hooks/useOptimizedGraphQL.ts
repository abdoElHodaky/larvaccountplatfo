import { useRequest } from 'alova/react';
import { useMemo, useCallback } from 'react';
import { 
  graphqlClient, 
  createGraphQLQuery, 
  createGraphQLMutation 
} from '../graphql/client';

// Performance-optimized GraphQL hooks
export function useOptimizedGraphQLQuery(
  query: string, 
  variables?: any, 
  options: {
    cacheTime?: number;
    staleTime?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    enabled = true,
    refetchOnWindowFocus = false
  } = options;

  // Memoize the method to prevent unnecessary re-renders
  const method = useMemo(() => {
    const graphqlMethod = createGraphQLQuery(query, variables);
    
    // Configure caching
    graphqlMethod.config.cacheFor = cacheTime;
    graphqlMethod.config.staleTime = staleTime;
    
    return graphqlMethod;
  }, [query, JSON.stringify(variables), cacheTime, staleTime]);

  const { data, loading, error, send } = useRequest(method, {
    immediate: enabled,
    force: !refetchOnWindowFocus
  });

  const refetch = useCallback(() => {
    return send();
  }, [send]);

  return {
    data: data?.data,
    loading,
    error,
    refetch
  };
}

// Optimized mutation hook with loading states
export function useOptimizedGraphQLMutation(mutation: string) {
  const method = useMemo(() => createGraphQLMutation(mutation), [mutation]);
  const { data, loading, error, send } = useRequest(method, { immediate: false });

  const mutate = useCallback(async (variables?: any) => {
    try {
      const result = await send({
        query: mutation,
        variables
      });
      return result?.data;
    } catch (err) {
      throw err;
    }
  }, [send, mutation]);

  return [mutate, { data: data?.data, loading, error }] as const;
}

// Paginated query with infinite scroll support
export function usePaginatedGraphQLQuery(
  query: string,
  variables: any = {},
  options: {
    pageSize?: number;
    cacheTime?: number;
  } = {}
) {
  const { pageSize = 20, cacheTime = 300000 } = options;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const queryVariables = useMemo(() => ({
    ...variables,
    first: pageSize,
    page: currentPage
  }), [variables, pageSize, currentPage]);

  const { data, loading, error } = useOptimizedGraphQLQuery(
    query, 
    queryVariables,
    { cacheTime }
  );

  // Update accumulated data when new page loads
  useEffect(() => {
    if (data?.data) {
      if (currentPage === 1) {
        setAllData(data.data);
      } else {
        setAllData(prev => [...prev, ...data.data]);
      }
      
      setHasMore(data.paginatorInfo?.hasMorePages || false);
    }
  }, [data, currentPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    totalCount: data?.paginatorInfo?.total || 0
  };
}

// Debounced search query
export function useDebounceGraphQLQuery(
  query: string,
  searchTerm: string,
  variables: any = {},
  delay: number = 300
) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  const queryVariables = useMemo(() => ({
    ...variables,
    search: debouncedTerm
  }), [variables, debouncedTerm]);

  return useOptimizedGraphQLQuery(
    query, 
    queryVariables,
    { enabled: debouncedTerm.length > 0 }
  );
}

// Batch mutations for bulk operations
export function useBatchGraphQLMutations() {
  const [mutations, setMutations] = useState<Array<{
    id: string;
    mutation: string;
    variables: any;
    status: 'pending' | 'loading' | 'success' | 'error';
    result?: any;
    error?: any;
  }>>([]);

  const addMutation = useCallback((id: string, mutation: string, variables: any) => {
    setMutations(prev => [...prev, {
      id,
      mutation,
      variables,
      status: 'pending'
    }]);
  }, []);

  const executeBatch = useCallback(async () => {
    const pendingMutations = mutations.filter(m => m.status === 'pending');
    
    // Update status to loading
    setMutations(prev => prev.map(m => 
      m.status === 'pending' ? { ...m, status: 'loading' } : m
    ));

    // Execute all mutations concurrently
    const results = await Promise.allSettled(
      pendingMutations.map(async (mut) => {
        const method = createGraphQLMutation(mut.mutation);
        return method.send({
          query: mut.mutation,
          variables: mut.variables
        });
      })
    );

    // Update results
    setMutations(prev => prev.map((mut, index) => {
      if (mut.status === 'loading') {
        const result = results[index];
        return {
          ...mut,
          status: result.status === 'fulfilled' ? 'success' : 'error',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason : undefined
        };
      }
      return mut;
    }));
  }, [mutations]);

  const clearCompleted = useCallback(() => {
    setMutations(prev => prev.filter(m => m.status === 'pending' || m.status === 'loading'));
  }, []);

  return {
    mutations,
    addMutation,
    executeBatch,
    clearCompleted,
    pendingCount: mutations.filter(m => m.status === 'pending').length,
    isExecuting: mutations.some(m => m.status === 'loading')
  };
}
