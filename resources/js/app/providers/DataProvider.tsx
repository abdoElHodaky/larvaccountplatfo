/**
 * Unified Data Provider - AlovaJS + GraphQL Integration
 * Phase 9: Modern Data Management Layer
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import adapterFetch from 'alova/fetch';

// Types
interface DataContextType {
  alovaInstance: ReturnType<typeof createAlova>;
  graphqlClient: ReturnType<typeof createAlova>;
}

interface DataProviderProps {
  children: ReactNode;
}

// Context
const DataContext = createContext<DataContextType | null>(null);

// AlovaJS REST API Instance
const createRestClient = () => {
  return createAlova({
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
    },
    
    // Global response interceptor
    responded: {
      onSuccess: async (response, method) => {
        console.log(`✅ API Success: ${method.type} ${method.url}`, {
          status: response.status,
          statusText: response.statusText
        });
        return response.json();
      },
      onError: async (error, method) => {
        console.error(`❌ API Error: ${method.type} ${method.url}`, error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
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
  });
};

// AlovaJS GraphQL Instance
const createGraphQLClient = () => {
  return createAlova({
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
        if (data.errors) {
          console.error('❌ GraphQL Errors:', data.errors);
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
          window.location.href = '/login';
        }
        
        throw error;
      }
    },
    
    // GraphQL caching strategy
    cacheFor: {
      POST: 300000, // 5 minutes for queries (GraphQL uses POST)
    },
  });
};

// Data Provider Component
const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Create client instances
  const alovaInstance = createRestClient();
  const graphqlClient = createGraphQLClient();
  
  const value: DataContextType = {
    alovaInstance,
    graphqlClient,
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Hook to use data context
export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

// Convenience hooks
export const useAlovaInstance = () => {
  const { alovaInstance } = useDataContext();
  return alovaInstance;
};

export const useGraphQLClient = () => {
  const { graphqlClient } = useDataContext();
  return graphqlClient;
};

export default DataProvider;
