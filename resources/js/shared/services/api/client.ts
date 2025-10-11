/**
 * Unified API Client - AlovaJS + GraphQL Integration
 * Phase 9: Modern Data Management Layer
 */

import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import adapterFetch from 'alova/fetch';

// Types
export interface APIResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface GraphQLResponse<T = any> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// =============================================================================
// REST API CLIENT
// =============================================================================

export const restClient = createAlova({
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
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      method.config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    // Add common headers
    method.config.headers['Accept'] = 'application/json';
    method.config.headers['Content-Type'] = 'application/json';
    
    // Add organization context
    const organizationId = localStorage.getItem('current_organization_id');
    if (organizationId) {
      method.config.headers['X-Organization-ID'] = organizationId;
    }
    
    // Add request timestamp for debugging
    method.config.headers['X-Request-Time'] = new Date().toISOString();
    
    console.log(`🚀 REST Request: ${method.type} ${method.url}`, {
      headers: method.config.headers,
      data: method.data
    });
  },
  
  // Global response interceptor
  responded: {
    onSuccess: async (response, method) => {
      console.log(`✅ REST Success: ${method.type} ${method.url}`, {
        status: response.status,
        statusText: response.statusText
      });
      
      const data = await response.json();
      return data;
    },
    onError: async (error, method) => {
      console.error(`❌ REST Error: ${method.type} ${method.url}`, error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_organization_id');
        window.location.href = '/login';
      }
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const errorData = await error.response.json();
        throw new Error(errorData.message || 'Validation failed');
      }
      
      throw error;
    }
  },
  
  // Caching configuration
  cacheFor: {
    GET: 300000, // 5 minutes for GET requests
    POST: 0,     // No cache for mutations
    PUT: 0,
    DELETE: 0,
  },
  
  // Request sharing configuration
  shareRequest: true, // Enable request deduplication
});

// =============================================================================
// GRAPHQL CLIENT
// =============================================================================

export const graphqlClient = createAlova({
  baseURL: '/graphql',
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  timeout: 15000,
  
  // GraphQL-specific request handling
  beforeRequest(method) {
    // Add authentication token
    const token = localStorage.getItem('auth_token');
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }
    
    // GraphQL-specific headers
    method.config.headers['Content-Type'] = 'application/json';
    method.config.headers['Accept'] = 'application/json';
    
    // Add organization context
    const organizationId = localStorage.getItem('current_organization_id');
    if (organizationId) {
      method.config.headers['X-Organization-ID'] = organizationId;
    }
    
    // Add request timestamp
    method.config.headers['X-Request-Time'] = new Date().toISOString();
    
    console.log(`🔄 GraphQL Request:`, {
      query: method.data?.query?.substring(0, 100) + '...',
      variables: method.data?.variables
    });
  },
  
  // GraphQL response handling
  responded: {
    onSuccess: async (response, _method) => {
      const data = await response.json();
      
      // Handle GraphQL errors
      if (data.errors && data.errors.length > 0) {
        console.error('❌ GraphQL Errors:', data.errors);
        
        // Check for authentication errors in GraphQL
        const authError = data.errors.find((error: any) => 
          error.message.includes('Unauthenticated') || 
          error.message.includes('Unauthorized')
        );
        
        if (authError) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_organization_id');
          window.location.href = '/login';
        }
        
        throw new Error(data.errors[0]?.message || 'GraphQL Error');
      }
      
      console.log('✅ GraphQL Success:', {
        data: data.data ? Object.keys(data.data) : 'No data'
      });
      
      return data;
    },
    onError: async (error, _method) => {
      console.error('❌ GraphQL Request Error:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_organization_id');
        window.location.href = '/login';
      }
      
      throw error;
    }
  },
  
  // GraphQL caching strategy
  cacheFor: {
    POST: 300000, // 5 minutes for queries (GraphQL uses POST)
  },
  
  // Enable request sharing for GraphQL
  shareRequest: true,
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a GraphQL query method
 */
export const createGraphQLQuery = <TData = any, TVariables = any>(
  query: string,
  variables?: TVariables,
  options?: {
    cacheFor?: number;
    transform?: (data: any) => TData;
  }
) => {
  return graphqlClient.Post('/graphql', {
    query,
    variables,
  }, {
    cacheFor: options?.cacheFor,
    transform: options?.transform ? (response: GraphQLResponse) => {
      return options.transform!(response.data);
    } : undefined,
  });
};

/**
 * Create a GraphQL mutation method
 */
export const createGraphQLMutation = <TData = any, TVariables = any>(
  mutation: string,
  variables?: TVariables,
  options?: {
    transform?: (data: any) => TData;
  }
) => {
  return graphqlClient.Post('/graphql', {
    query: mutation,
    variables,
  }, {
    cacheFor: 0, // No cache for mutations
    transform: options?.transform ? (response: GraphQLResponse) => {
      return options.transform!(response.data);
    } : undefined,
  });
};

/**
 * Create a REST API method with type safety
 */
export const createRESTMethod = <TData = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  options?: {
    cacheFor?: number;
    transform?: (data: any) => TData;
  }
) => {
  const alovaMethod = restClient[method](url, data, {
    cacheFor: options?.cacheFor,
    transform: options?.transform,
  });
  
  return alovaMethod;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default restClient;
