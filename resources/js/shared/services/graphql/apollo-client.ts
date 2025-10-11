/**
 * Apollo Client Configuration with AlovaJS Integration
 * Modern GraphQL client setup for Laravel Accounting Platform
 */

import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

// Types
export interface GraphQLConfig {
    httpUri: string;
    wsUri: string;
    headers?: Record<string, string>;
    enableSubscriptions?: boolean;
    enableCache?: boolean;
    cacheSize?: number;
}

export interface TenantContext {
    tenantId: string;
    subdomain: string;
    permissions: string[];
}

// Default configuration
const defaultConfig: GraphQLConfig = {
    httpUri: '/graphql',
    wsUri: `ws://${window.location.host}/graphql`,
    enableSubscriptions: true,
    enableCache: true,
    cacheSize: 100,
};

/**
 * Create HTTP Link with authentication and tenant context
 */
const createHttpLinkWithAuth = (config: GraphQLConfig) => {
    const httpLink = createHttpLink({
        uri: config.httpUri,
        credentials: 'same-origin',
    });

    const authLink = setContext((_, { headers }) => {
        const token = localStorage.getItem('auth_token');
        const tenant = JSON.parse(localStorage.getItem('current_tenant') || '{}');

        return {
            headers: {
                ...headers,
                ...(token && { authorization: `Bearer ${token}` }),
                ...(tenant.id && { 'X-Tenant-ID': tenant.id }),
                ...(tenant.subdomain && { 'X-Tenant-Subdomain': tenant.subdomain }),
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...config.headers,
            },
        };
    });

    return authLink.concat(httpLink);
};

/**
 * Create WebSocket Link for real-time subscriptions
 */
const createWebSocketLink = (config: GraphQLConfig) => {
    if (!config.enableSubscriptions) return null;

    const wsClient = createClient({
        url: config.wsUri,
        connectionParams: () => {
            const token = localStorage.getItem('auth_token');
            const tenant = JSON.parse(localStorage.getItem('current_tenant') || '{}');

            return {
                authorization: token ? `Bearer ${token}` : '',
                tenantId: tenant.id || '',
                subdomain: tenant.subdomain || '',
            };
        },
        retryAttempts: 5,
        shouldRetry: () => true,
    });

    return new GraphQLWsLink(wsClient);
};

/**
 * Error handling link
 */
const createErrorLink = () => {
    return onError(({ graphQLErrors, networkError, operation: _operation, forward: _forward }) => {
        if (graphQLErrors) {
            graphQLErrors.forEach(({ message, locations, path, extensions }) => {
                console.error(
                    `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`,
                    extensions
                );

                // Handle authentication errors
                if (extensions?.code === 'UNAUTHENTICATED') {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }

                // Handle tenant access errors
                if (extensions?.code === 'TENANT_ACCESS_DENIED') {
                    console.error('Tenant access denied:', message);
                    // Handle tenant switching or access denial
                }
            });
        }

        if (networkError) {
            console.error(`Network error: ${networkError}`);

            // Handle network errors
            if (networkError.statusCode === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
        }
    });
};

/**
 * Create Apollo Client with AlovaJS integration
 */
export const createApolloClient = (config: Partial<GraphQLConfig> = {}) => {
    const finalConfig = { ...defaultConfig, ...config };

    const httpLink = createHttpLinkWithAuth(finalConfig);
    const wsLink = createWebSocketLink(finalConfig);
    const errorLink = createErrorLink();

    // Split link for HTTP and WebSocket
    const splitLink = wsLink
        ? split(
              ({ query }) => {
                  const definition = getMainDefinition(query);
                  return (
                      definition.kind === 'OperationDefinition' &&
                      definition.operation === 'subscription'
                  );
              },
              wsLink,
              httpLink
          )
        : httpLink;

    // Create Apollo Client
    const client = new ApolloClient({
        link: from([errorLink, splitLink]),
        cache: new InMemoryCache({
            typePolicies: {
                // Tenant-specific caching
                Tenant: {
                    keyFields: ['id'],
                },
                User: {
                    keyFields: ['id'],
                },
                Account: {
                    keyFields: ['id', 'tenantId'],
                },
                Transaction: {
                    keyFields: ['id', 'tenantId'],
                },
                Report: {
                    keyFields: ['id', 'tenantId'],
                },
                // Financial statement caching
                TrialBalance: {
                    keyFields: ['tenantId', 'periodStart', 'periodEnd'],
                },
                IncomeStatement: {
                    keyFields: ['tenantId', 'periodStart', 'periodEnd'],
                },
                BalanceSheet: {
                    keyFields: ['tenantId', 'asOfDate'],
                },
            },
            possibleTypes: {
                // Add possible types for union/interface types
            },
        }),
        defaultOptions: {
            watchQuery: {
                errorPolicy: 'all',
                fetchPolicy: 'cache-and-network',
            },
            query: {
                errorPolicy: 'all',
                fetchPolicy: 'cache-first',
            },
            mutate: {
                errorPolicy: 'all',
            },
        },
        connectToDevTools: process.env.NODE_ENV === 'development',
    });

    return client;
};

/**
 * Create AlovaJS instance for REST API integration with advanced features
 */
export const createAlovaInstance = () => {
    return createAlova({
        baseURL: '/api',
        statesHook: ReactHook,
        requestAdapter: adapterFetch(),

        // Request timeout configuration
        timeout: 30000,

        // Local cache configuration
        localCache: {
            expire: 5 * 60 * 1000, // 5 minutes default cache
            mode: 'memory',
        },

        // Request throttling and debouncing
        throttle: {
            delay: 1000, // 1 second throttle for rapid requests
        },

        // Request retry configuration
        retry: {
            delay: [1000, 2000, 4000], // Exponential backoff
            condition: (error) => {
                // Retry on network errors and 5xx server errors
                return (
                    !error.response || (error.response.status >= 500 && error.response.status < 600)
                );
            },
        },

        beforeRequest(method) {
            const token = localStorage.getItem('auth_token');
            const tenant = JSON.parse(localStorage.getItem('current_tenant') || '{}');

            // Add authentication and tenant headers
            method.config.headers = {
                ...method.config.headers,
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(tenant.id && { 'X-Tenant-ID': tenant.id }),
                ...(tenant.subdomain && { 'X-Tenant-Subdomain': tenant.subdomain }),
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };

            // Add request timestamp for debugging
            method.config.headers['X-Request-Time'] = new Date().toISOString();

            // Log request in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Alova] ${method.type} ${method.url}`, {
                    headers: method.config.headers,
                    data: method.data,
                });
            }
        },

        responded: {
            onSuccess(response, method) {
                // Log successful responses in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[Alova] Success ${method.type} ${method.url}`, response);
                }

                // Handle different content types
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    return response.json();
                } else if (contentType?.includes('text/')) {
                    return response.text();
                } else {
                    return response.blob();
                }
            },

            onError(error, method) {
                console.error(`[Alova] Error ${method.type} ${method.url}:`, error);

                // Handle authentication errors
                if (error.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('current_tenant');
                    window.location.href = '/login';
                    return;
                }

                // Handle tenant access errors
                if (error.status === 403) {
                    console.error('Access denied for current tenant');
                    // Could redirect to tenant selection or show error
                }

                // Handle rate limiting
                if (error.status === 429) {
                    const retryAfter = error.response?.headers?.get('Retry-After');
                    console.warn(`Rate limited. Retry after: ${retryAfter} seconds`);
                }

                // Handle server errors
                if (error.status >= 500) {
                    console.error('Server error occurred:', error.message);
                }

                throw error;
            },
        },

        // Global error handler
        errorLogger: (error, method) => {
            // Send errors to monitoring service in production
            if (process.env.NODE_ENV === 'production') {
                // Example: Send to Sentry, LogRocket, etc.
                console.error('API Error:', {
                    url: method.url,
                    method: method.type,
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                });
            }
        },
    });
};

// Export default instances
export const apolloClient = createApolloClient();
export const alovaInstance = createAlovaInstance();

// Export types
export type { GraphQLConfig, TenantContext };
