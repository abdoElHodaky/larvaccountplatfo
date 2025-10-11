import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import adapterFetch from 'alova/fetch';

/**
 * Main Alova instance for REST API calls
 */
export const alovaInstance = createAlova({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    statesHook: ReactHook,
    requestAdapter: adapterFetch(),
    timeout: 10000,

    // Global request interceptor
    beforeRequest(method) {
        // Add authentication token
        const token = localStorage.getItem('auth_token');
        if (token) {
            method.config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for Laravel
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        if (csrfToken) {
            method.config.headers['X-CSRF-TOKEN'] = csrfToken;
        }

        // Add common headers
        method.config.headers['Accept'] = 'application/json';
        method.config.headers['Content-Type'] = 'application/json';

        // Add organization context if available
        const organizationId = localStorage.getItem('current_organization_id');
        if (organizationId) {
            method.config.headers['X-Organization-ID'] = organizationId;
        }

        console.log(`🚀 API Request: ${method.type} ${method.url}`, {
            headers: method.config.headers,
            data: method.data,
        });
    },

    // Global response interceptor
    responded: {
        onSuccess: async (response, method) => {
            console.log(`✅ API Success: ${method.type} ${method.url}`, {
                status: response.status,
                statusText: response.statusText,
            });

            if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }

            return response.text();
        },

        onError: (error, method) => {
            console.error(`❌ API Error: ${method.type} ${method.url}`, error);

            // Handle specific error cases
            if (error.message.includes('401')) {
                // Unauthorized - redirect to login
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else if (error.message.includes('403')) {
                // Forbidden - show permission error
                console.error('Permission denied');
            } else if (error.message.includes('422')) {
                // Validation error - will be handled by components
                console.warn('Validation error');
            } else if (error.message.includes('500')) {
                // Server error
                console.error('Server error occurred');
            }

            throw error;
        },
    },

    // Cache configuration
    cacheFor: {
        GET: {
            expire: 300000, // 5 minutes default cache
            mode: 'memory',
        },
        POST: false, // Don't cache POST requests
        PUT: false,
        DELETE: false,
    },
});

/**
 * GraphQL-specific Alova instance
 */
export const graphqlClient = createAlova({
    baseURL: `${import.meta.env.VITE_API_URL || '/api'}/graphql`,
    statesHook: ReactHook,
    requestAdapter: adapterFetch(),
    timeout: 15000, // Longer timeout for complex GraphQL queries

    // GraphQL-specific request interceptor
    beforeRequest(method) {
        // Always POST for GraphQL
        method.config.method = 'POST';
        method.config.headers['Content-Type'] = 'application/json';
        method.config.headers['Accept'] = 'application/json';

        // Add authentication token
        const token = localStorage.getItem('auth_token');
        if (token) {
            method.config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        if (csrfToken) {
            method.config.headers['X-CSRF-TOKEN'] = csrfToken;
        }

        // Add organization context
        const organizationId = localStorage.getItem('current_organization_id');
        if (organizationId) {
            method.config.headers['X-Organization-ID'] = organizationId;
        }

        console.log(`🔍 GraphQL Request:`, {
            query: method.data?.query?.substring(0, 100) + '...',
            variables: method.data?.variables,
        });
    },

    // GraphQL response interceptor
    responded: {
        onSuccess: async (response, _method) => {
            const result = await response.json();

            console.log(`✅ GraphQL Success:`, {
                data: result.data ? 'Present' : 'None',
                errors: result.errors?.length || 0,
            });

            // Handle GraphQL errors
            if (result.errors && result.errors.length > 0) {
                console.error('GraphQL Errors:', result.errors);

                // Check for authentication errors
                const authError = result.errors.find(
                    (error: any) =>
                        error.message.includes('Unauthenticated') ||
                        error.extensions?.category === 'authentication'
                );

                if (authError) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }

                // For other errors, still return the result so components can handle them
            }

            return result;
        },

        onError: (error, _method) => {
            console.error(`❌ GraphQL Error:`, error);
            throw error;
        },
    },

    // GraphQL-specific caching
    cacheFor: {
        POST: {
            expire: 300000, // 5 minutes for queries
            mode: 'memory',
            // Custom cache key for GraphQL queries
            key: (method) => {
                const { query, variables } = method.data || {};
                return `gql:${btoa(query || '')}:${btoa(JSON.stringify(variables || {}))}`;
            },
        },
    },
});

/**
 * GraphQL query helper function
 */
export const gql = (query: string, variables?: Record<string, any>) => {
    return graphqlClient.Post('/', {
        query: query.trim(),
        variables: variables || {},
    });
};

/**
 * GraphQL mutation helper function
 */
export const mutation = (query: string, variables?: Record<string, any>) => {
    // Mutations should not be cached
    const method = graphqlClient.Post('/', {
        query: query.trim(),
        variables: variables || {},
    });

    // Disable caching for mutations
    method.config.cacheFor = false;

    return method;
};

/**
 * Utility function to get auth token
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

/**
 * Utility function to get current organization ID
 */
export const getCurrentOrganizationId = (): number | null => {
    const orgId = localStorage.getItem('current_organization_id');
    return orgId ? parseInt(orgId, 10) : null;
};

/**
 * Clear all Alova caches
 */
export const clearAllCaches = (): void => {
    alovaInstance.storage.clear();
    graphqlClient.storage.clear();
    console.log('🧹 All Alova caches cleared');
};

/**
 * Clear cache by pattern
 */
export const clearCacheByPattern = (pattern: string): void => {
    // This would need to be implemented based on Alova's cache API
    console.log(`🧹 Clearing cache by pattern: ${pattern}`);
};
