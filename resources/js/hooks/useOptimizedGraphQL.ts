import { useRequest } from 'alova/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gql as createAlovaQuery, mutation as createAlovaMutation } from '@/shared/services/alova/alova.config';

/**
 * A GraphQL query, either as a raw query string or an Apollo DocumentNode
 * (e.g. produced by the `gql` template tag).
 */
type GraphQLQueryLike = string | { loc?: { source?: { body?: string } } | null };

function toQueryString(query: GraphQLQueryLike): string {
    if (typeof query === 'string') {
        return query;
    }

    return query.loc?.source?.body ?? '';
}

// Performance-optimized GraphQL hooks
export function useOptimizedGraphQLQuery(
    query: GraphQLQueryLike,
    variables?: Record<string, unknown>,
    options: {
        cacheTime?: number;
        staleTime?: number;
        enabled?: boolean;
        force?: boolean;
    } = {}
) {
    const {
        cacheTime = 300000, // 5 minutes
        enabled = true,
        force = false
    } = options;

    // Memoize the method to prevent unnecessary re-renders
    const method = useMemo(
        () => {
            const graphqlMethod = createAlovaQuery(toQueryString(query), variables);

            // Configure caching (alova accepts a millisecond expiry)
            graphqlMethod.config.cacheFor = cacheTime;

            return graphqlMethod;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [toQueryString(query), JSON.stringify(variables), cacheTime]
    );

    const { data, loading, error, send } = useRequest(method, {
        immediate: enabled,
        force
    });

    const refetch = useCallback(() => {
        return send();
    }, [send]);

    return {
        data: (data as { data?: unknown } | undefined)?.data,
        loading,
        error,
        refetch
    };
}

// Optimized mutation hook with loading states
export function useOptimizedGraphQLMutation(mutation: string) {
    const method = useMemo(() => createAlovaMutation(mutation), [mutation]);
    const { data, loading, error, send } = useRequest(method, { immediate: false });

    const mutate = useCallback(async (variables?: Record<string, unknown>) => {
        const result = await send({
            query: mutation,
            variables: variables ?? {}
        });
        return (result as { data?: unknown } | undefined)?.data;
    }, [send, mutation]);

    return [mutate, { data: (data as { data?: unknown } | undefined)?.data, loading, error }] as const;
}

// Paginated query with infinite scroll support
export function usePaginatedGraphQLQuery(
    query: GraphQLQueryLike,
    variables: Record<string, unknown> = {},
    options: {
        pageSize?: number;
        cacheTime?: number;
    } = {}
) {
    const { pageSize = 20, cacheTime = 300000 } = options;

    const [currentPage, setCurrentPage] = useState(1);
    const [allData, setAllData] = useState<unknown[]>([]);
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
        if (data) {
            const pageData = Array.isArray(data) ? data : [];

            if (currentPage === 1) {
                setAllData(pageData);
            } else {
                setAllData(prev => [...prev, ...pageData]);
            }

            const paginatorInfo = (data as { paginatorInfo?: { hasMorePages?: boolean; total?: number } }).paginatorInfo;
            setHasMore(paginatorInfo?.hasMorePages || false);
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

    const paginatorInfo = (data as { paginatorInfo?: { total?: number } } | undefined)?.paginatorInfo;

    return {
        data: allData,
        loading,
        error,
        hasMore,
        loadMore,
        reset,
        totalCount: paginatorInfo?.total || 0
    };
}

// Debounced search query
export function useDebounceGraphQLQuery(
    query: GraphQLQueryLike,
    searchTerm: string,
    variables: Record<string, unknown> = {},
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
        variables: Record<string, unknown>;
        status: 'pending' | 'loading' | 'success' | 'error';
        result?: unknown;
        error?: unknown;
    }>>([]);

    const addMutation = useCallback((id: string, mutation: string, variables: Record<string, unknown>) => {
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
                const method = createAlovaMutation(mut.mutation, mut.variables);
                return method.send();
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
