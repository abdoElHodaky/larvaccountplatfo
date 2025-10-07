/**
 * AlovaJS API Client Configuration
 * Centralized API client with authentication, error handling, and caching
 */

import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import ReactHook from 'alova/react';
import { store } from '../../stores';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Create Alova instance
export const alovaInstance = createAlova({
  baseURL: '/api',
  statesHook: ReactHook,
  requestAdapter: GlobalFetch(),
  
  // Global request interceptor
  beforeRequest(method) {
    const state = store.getState();
    const token = state.auth.token;
    
    // Add authentication header
    if (token) {
      method.config.headers = {
        ...method.config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    
    // Add default headers
    method.config.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...method.config.headers,
    };
    
    // Add tenant context if available
    const currentTenant = state.auth.currentTenant;
    if (currentTenant) {
      method.config.headers['X-Tenant-ID'] = currentTenant.id;
    }
    
    // Record API call start time for performance monitoring
    method.meta = {
      ...method.meta,
      startTime: Date.now(),
    };
  },
  
  // Global response interceptor
  responded: {
    // Success response handler
    onSuccess: async (response, method) => {
      // Record API response time
      const endTime = Date.now();
      const startTime = method.meta?.startTime || endTime;
      const responseTime = endTime - startTime;
      
      store.dispatch.app.recordApiResponseTime({
        endpoint: method.url,
        time: responseTime,
      });
      
      // Parse JSON response
      const data = await response.json();
      
      // Handle Laravel validation errors
      if (response.status === 422) {
        throw new Error(data.message || 'Validation failed');
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    },
    
    // Error response handler
    onError: (error, method) => {
      const endTime = Date.now();
      const startTime = method.meta?.startTime || endTime;
      const responseTime = endTime - startTime;
      
      // Record failed API response time
      store.dispatch.app.recordApiResponseTime({
        endpoint: method.url,
        time: responseTime,
      });
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        // Token expired or invalid
        store.dispatch.auth.logout();
        store.dispatch.app.showError({
          title: 'Authentication Error',
          message: 'Your session has expired. Please log in again.',
        });
        return;
      }
      
      // Handle authorization errors
      if (error.response?.status === 403) {
        store.dispatch.app.showError({
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
        });
        return;
      }
      
      // Handle tenant switching errors
      if (error.response?.status === 422 && error.response?.data?.tenant_required) {
        store.dispatch.app.showError({
          title: 'Tenant Required',
          message: 'Please select a tenant to continue.',
        });
        return;
      }
      
      // Handle server errors
      if (error.response?.status >= 500) {
        store.dispatch.app.showError({
          title: 'Server Error',
          message: 'An unexpected server error occurred. Please try again later.',
          persistent: true,
        });
        return;
      }
      
      // Handle network errors
      if (!error.response) {
        store.dispatch.app.showError({
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          persistent: true,
        });
        return;
      }
      
      // Re-throw the error for component-level handling
      throw error;
    },
  },
  
  // Cache configuration
  cacheFor: {
    // Cache GET requests for 5 minutes by default
    GET: 5 * 60 * 1000,
    // Don't cache POST, PUT, DELETE requests
    POST: 0,
    PUT: 0,
    DELETE: 0,
  },
  
  // Global timeout (30 seconds)
  timeout: 30000,
});

// Helper function to create authenticated requests
export const createAuthenticatedRequest = <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: any
) => {
  return alovaInstance[method.toLowerCase() as keyof typeof alovaInstance](
    url,
    data,
    {
      ...config,
      // Add request-specific metadata
      meta: {
        requiresAuth: true,
        ...config?.meta,
      },
    }
  ) as any;
};

// Utility functions for common request patterns
export const apiClient = {
  // GET request
  get: <T = any>(url: string, config?: any) => 
    createAuthenticatedRequest<ApiResponse<T>>('GET', url, undefined, config),
  
  // POST request
  post: <T = any>(url: string, data?: any, config?: any) => 
    createAuthenticatedRequest<ApiResponse<T>>('POST', url, data, config),
  
  // PUT request
  put: <T = any>(url: string, data?: any, config?: any) => 
    createAuthenticatedRequest<ApiResponse<T>>('PUT', url, data, config),
  
  // DELETE request
  delete: <T = any>(url: string, config?: any) => 
    createAuthenticatedRequest<ApiResponse<T>>('DELETE', url, undefined, config),
  
  // Paginated GET request
  getPaginated: <T = any>(url: string, config?: any) => 
    createAuthenticatedRequest<PaginatedResponse<T>>('GET', url, undefined, config),
};

// Export the main instance
export default alovaInstance;
