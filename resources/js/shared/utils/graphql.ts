import React from 'react';

/**
 * Performance-Optimized GraphQL Client
 * Advanced GraphQL integration with caching, batching, and error recovery
 */

export interface GraphQLQuery {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
}

export interface GraphQLResponse<T = any> {
    data?: T;
    errors?: Array<{
        message: string;
        locations?: Array<{ line: number; column: number }>;
        path?: Array<string | number>;
        extensions?: Record<string, any>;
    }>;
    extensions?: Record<string, any>;
}

export interface GraphQLClientOptions {
    endpoint: string;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    enableBatching?: boolean;
    batchInterval?: number;
    enableCaching?: boolean;
    cacheTimeout?: number;
    enablePersistence?: boolean;
    debug?: boolean;
}

export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}

export interface BatchRequest {
    query: GraphQLQuery;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
}

/**
 * GraphQL Client Class
 * Handles GraphQL operations with advanced caching and batching
 */
export class GraphQLClient {
    private options: Required<GraphQLClientOptions>;
    private cache: Map<string, CacheEntry> = new Map();
    private batchQueue: BatchRequest[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private requestId = 0;

    constructor(options: GraphQLClientOptions) {
        this.options = {
            headers: {},
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            enableBatching: true,
            batchInterval: 10,
            enableCaching: true,
            cacheTimeout: 300000, // 5 minutes
            enablePersistence: false,
            debug: false,
            ...options,
        };

        // Load persisted cache
        if (this.options.enablePersistence) {
            this.loadPersistedCache();
        }

        // Clean up cache periodically
        setInterval(() => this.cleanupCache(), 60000); // Every minute
    }

    /**
     * Execute a GraphQL query
     */
    public async query<T = any>(
        query: string,
        variables?: Record<string, any>,
        options?: {
            skipCache?: boolean;
            timeout?: number;
            retries?: number;
        }
    ): Promise<GraphQLResponse<T>> {
        const graphqlQuery: GraphQLQuery = {
            query,
            variables,
            operationName: this.extractOperationName(query),
        };

        const cacheKey = this.generateCacheKey(graphqlQuery);

        // Check cache first
        if (this.options.enableCaching && !options?.skipCache) {
            const cached = this.getFromCache<T>(cacheKey);
            if (cached) {
                this.log('Cache hit for query:', graphqlQuery.operationName);
                return { data: cached };
            }
        }

        // Use batching if enabled
        if (this.options.enableBatching) {
            return this.addToBatch<T>(graphqlQuery, cacheKey);
        }

        // Execute single query
        return this.executeQuery<T>(graphqlQuery, cacheKey, options);
    }

    /**
     * Execute a GraphQL mutation
     */
    public async mutate<T = any>(
        mutation: string,
        variables?: Record<string, any>,
        options?: {
            timeout?: number;
            retries?: number;
            invalidateCache?: string[];
        }
    ): Promise<GraphQLResponse<T>> {
        const graphqlQuery: GraphQLQuery = {
            query: mutation,
            variables,
            operationName: this.extractOperationName(mutation),
        };

        const result = await this.executeQuery<T>(graphqlQuery, null, options);

        // Invalidate cache entries if specified
        if (options?.invalidateCache) {
            options.invalidateCache.forEach((pattern) => {
                this.invalidateCache(pattern);
            });
        }

        return result;
    }

    /**
     * Execute multiple queries in parallel
     */
    public async batchQuery<T = any>(
        queries: Array<{
            query: string;
            variables?: Record<string, any>;
            key?: string;
        }>
    ): Promise<Array<GraphQLResponse<T>>> {
        const promises = queries.map(({ query, variables }) => this.query<T>(query, variables));

        return Promise.all(promises);
    }

    /**
     * Subscribe to GraphQL subscriptions (WebSocket-based)
     */
    public subscribe<T = any>(
        subscription: string,
        _variables?: Record<string, any>,
        _callbacks?: {
            onData?: (data: T) => void;
            onError?: (error: any) => void;
            onComplete?: () => void;
        }
    ): () => void {
        // This would typically use WebSocket or Server-Sent Events
        // For now, we'll return a mock unsubscribe function
        this.log('Subscription created:', subscription);

        return () => {
            this.log('Subscription cancelled:', subscription);
        };
    }

    /**
     * Clear all cache entries
     */
    public clearCache(): void {
        this.cache.clear();
        if (this.options.enablePersistence) {
            localStorage.removeItem('graphql-cache');
        }
        this.log('Cache cleared');
    }

    /**
     * Invalidate cache entries matching pattern
     */
    public invalidateCache(pattern: string): void {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];

        this.cache.forEach((_, key) => {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => {
            this.cache.delete(key);
        });

        this.log(`Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): {
        size: number;
        hitRate: number;
        entries: Array<{ key: string; age: number; ttl: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            ttl: entry.ttl,
        }));

        return {
            size: this.cache.size,
            hitRate: 0, // Would need to track hits/misses
            entries,
        };
    }

    /**
     * Add query to batch queue
     */
    private addToBatch<T>(
        query: GraphQLQuery,
        _cacheKey: string | null
    ): Promise<GraphQLResponse<T>> {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                query,
                resolve,
                reject,
                timestamp: Date.now(),
            });

            // Start batch timer if not already running
            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    this.executeBatch();
                }, this.options.batchInterval);
            }
        });
    }

    /**
     * Execute batched queries
     */
    private async executeBatch(): Promise<void> {
        if (this.batchQueue.length === 0) return;

        const batch = [...this.batchQueue];
        this.batchQueue = [];
        this.batchTimer = null;

        this.log(`Executing batch of ${batch.length} queries`);

        try {
            // Create batch request
            const batchQuery = batch.map((item) => item.query);
            const response = await this.executeBatchRequest(batchQuery);

            // Resolve individual promises
            batch.forEach((item, index) => {
                const result = response[index];
                if (result.errors) {
                    item.reject(new Error(result.errors[0].message));
                } else {
                    item.resolve(result);
                }
            });
        } catch (error) {
            // Reject all promises in batch
            batch.forEach((item) => {
                item.reject(error);
            });
        }
    }

    /**
     * Execute batch request to server
     */
    private async executeBatchRequest(queries: GraphQLQuery[]): Promise<GraphQLResponse[]> {
        const response = await fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.options.headers,
            },
            body: JSON.stringify(queries),
            signal: AbortSignal.timeout(this.options.timeout),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Execute single GraphQL query
     */
    private async executeQuery<T>(
        query: GraphQLQuery,
        cacheKey: string | null,
        options?: {
            timeout?: number;
            retries?: number;
        }
    ): Promise<GraphQLResponse<T>> {
        const timeout = options?.timeout || this.options.timeout;
        const retries = options?.retries || this.options.retries;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                this.log(`Executing query (attempt ${attempt + 1}):`, query.operationName);

                const response = await fetch(this.options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.options.headers,
                    },
                    body: JSON.stringify(query),
                    signal: AbortSignal.timeout(timeout),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result: GraphQLResponse<T> = await response.json();

                // Cache successful results
                if (cacheKey && result.data && !result.errors) {
                    this.setCache(cacheKey, result.data);
                }

                return result;
            } catch (error) {
                this.log(`Query failed (attempt ${attempt + 1}):`, error);

                if (attempt === retries) {
                    throw error;
                }

                // Wait before retry
                await new Promise((resolve) =>
                    setTimeout(resolve, this.options.retryDelay * Math.pow(2, attempt))
                );
            }
        }

        throw new Error('Max retries exceeded');
    }

    /**
     * Generate cache key for query
     */
    private generateCacheKey(query: GraphQLQuery): string {
        const key = `${query.operationName || 'anonymous'}:${JSON.stringify(query.variables || {})}`;
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Extract operation name from query
     */
    private extractOperationName(query: string): string | undefined {
        const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
        return match ? match[1] : undefined;
    }

    /**
     * Get data from cache
     */
    private getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set data in cache
     */
    private setCache<T>(key: string, data: T, ttl?: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.options.cacheTimeout,
            key,
        };

        this.cache.set(key, entry);

        if (this.options.enablePersistence) {
            this.persistCache();
        }
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => {
            this.cache.delete(key);
        });

        if (keysToDelete.length > 0) {
            this.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * Load persisted cache from localStorage
     */
    private loadPersistedCache(): void {
        try {
            const cached = localStorage.getItem('graphql-cache');
            if (cached) {
                const entries = JSON.parse(cached);
                entries.forEach((entry: CacheEntry) => {
                    this.cache.set(entry.key, entry);
                });
                this.log(`Loaded ${entries.length} cache entries from persistence`);
            }
        } catch (error) {
            this.log('Failed to load persisted cache:', error);
        }
    }

    /**
     * Persist cache to localStorage
     */
    private persistCache(): void {
        try {
            const entries = Array.from(this.cache.values());
            localStorage.setItem('graphql-cache', JSON.stringify(entries));
        } catch (error) {
            this.log('Failed to persist cache:', error);
        }
    }

    /**
     * Debug logging
     */
    private log(message: string, ...args: any[]): void {
        if (this.options.debug) {
            console.log(`[GraphQL] ${message}`, ...args);
        }
    }
}

/**
 * React Hook for GraphQL operations
 */
export function useGraphQL(options?: Partial<GraphQLClientOptions>) {
    const client = React.useMemo(() => {
        const defaultOptions: GraphQLClientOptions = {
            endpoint: '/graphql',
            enableBatching: true,
            enableCaching: true,
            debug: process.env.NODE_ENV === 'development',
            ...options,
        };

        return new GraphQLClient(defaultOptions);
    }, [options?.endpoint]);

    const query = React.useCallback(
        async <T = any>(
            query: string,
            variables?: Record<string, any>,
            options?: { skipCache?: boolean }
        ) => {
            return client.query<T>(query, variables, options);
        },
        [client]
    );

    const mutate = React.useCallback(
        async <T = any>(
            mutation: string,
            variables?: Record<string, any>,
            options?: { invalidateCache?: string[] }
        ) => {
            return client.mutate<T>(mutation, variables, options);
        },
        [client]
    );

    const subscribe = React.useCallback(
        <T = any>(
            subscription: string,
            variables?: Record<string, any>,
            callbacks?: {
                onData?: (data: T) => void;
                onError?: (error: any) => void;
                onComplete?: () => void;
            }
        ) => {
            return client.subscribe<T>(subscription, variables, callbacks);
        },
        [client]
    );

    const clearCache = React.useCallback(() => {
        client.clearCache();
    }, [client]);

    const invalidateCache = React.useCallback(
        (pattern: string) => {
            client.invalidateCache(pattern);
        },
        [client]
    );

    return {
        query,
        mutate,
        subscribe,
        clearCache,
        invalidateCache,
        client,
    };
}

/**
 * Financial GraphQL Hook with predefined queries
 */
export function useFinancialGraphQL(tenantId?: string) {
    const { query, mutate, subscribe, clearCache, invalidateCache } = useGraphQL({
        endpoint: `/graphql${tenantId ? `?tenant=${tenantId}` : ''}`,
        headers: tenantId ? { 'X-Tenant-ID': tenantId } : {},
    });

    // Financial-specific queries
    const getTrialBalance = React.useCallback(
        async (period: { start: string; end: string }) => {
            return query(
                `
      query GetTrialBalance($period: PeriodInput!) {
        trialBalance(period: $period) {
          accounts {
            id
            code
            name
            type
            debitBalance
            creditBalance
            category
          }
          totals {
            totalDebits
            totalCredits
            isBalanced
            variance
          }
        }
      }
    `,
                { period }
            );
        },
        [query]
    );

    const getIncomeStatement = React.useCallback(
        async (period: { start: string; end: string }) => {
            return query(
                `
      query GetIncomeStatement($period: PeriodInput!) {
        incomeStatement(period: $period) {
          items {
            id
            name
            type
            amount
            percentage
          }
          totals {
            totalRevenue
            grossProfit
            operatingIncome
            netIncome
          }
        }
      }
    `,
                { period }
            );
        },
        [query]
    );

    const getBalanceSheet = React.useCallback(
        async (asOfDate: string) => {
            return query(
                `
      query GetBalanceSheet($asOfDate: Date!) {
        balanceSheet(asOfDate: $asOfDate) {
          items {
            id
            name
            type
            amount
            percentage
          }
          totals {
            totalAssets
            totalLiabilities
            totalEquity
          }
          ratios {
            currentRatio
            quickRatio
            debtToEquityRatio
          }
        }
      }
    `,
                { asOfDate }
            );
        },
        [query]
    );

    return {
        query,
        mutate,
        subscribe,
        clearCache,
        invalidateCache,
        getTrialBalance,
        getIncomeStatement,
        getBalanceSheet,
    };
}

export default GraphQLClient;
