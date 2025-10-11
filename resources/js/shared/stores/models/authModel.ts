/**
 * Auth Rematch Model
 * Authentication and user management with Rematch
 */

import { createModel } from '@rematch/core';
import type { RootModel } from '../index';
import { apolloClient } from '../../services/graphql/apollo-client';
import { LOGIN, LOGOUT, REGISTER, SWITCH_TENANT } from '../../services/graphql/mutations';
import { GET_CURRENT_USER } from '../../services/graphql/queries';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    currency: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
  };
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: 'active' | 'suspended' | 'trial';
  settings: {
    currency: string;
    dateFormat: string;
    timezone: string;
    fiscalYearStart: string;
  };
  enabledModules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserTenant {
  tenant: Tenant;
  role: string;
  permissions: string[];
  joinedAt: string;
  lastAccessedAt?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  tenantName?: string;
  tenantSubdomain?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  currentTenant: Tenant | null;
  userTenants: UserTenant[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  currentTenant: null,
  userTenants: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authModel = createModel<RootModel>()({
  state: initialState,
  
  reducers: {
    // Loading state
    setLoading: (state, payload: boolean) => ({
      ...state,
      isLoading: payload,
    }),
    
    // Error handling
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
    }),
    
    clearError: (state) => ({
      ...state,
      error: null,
    }),
    
    // Authentication state
    setAuthenticated: (state, payload: { user: User; token: string; tenants: UserTenant[] }) => ({
      ...state,
      user: payload.user,
      token: payload.token,
      userTenants: payload.tenants,
      currentTenant: payload.tenants[0]?.tenant || null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
    
    // Logout
    clearAuth: () => ({
      ...initialState,
    }),
    
    // Tenant switching
    setCurrentTenant: (state, payload: Tenant) => ({
      ...state,
      currentTenant: payload,
    }),
    
    // User updates
    updateUser: (state, payload: Partial<User>) => ({
      ...state,
      user: state.user ? { ...state.user, ...payload } : null,
    }),
    
    updateUserPreferences: (state, payload: Partial<User['preferences']>) => ({
      ...state,
      user: state.user ? {
        ...state.user,
        preferences: { ...state.user.preferences, ...payload }
      } : null,
    }),
    
    // Tenant updates
    updateTenants: (state, payload: UserTenant[]) => ({
      ...state,
      userTenants: payload,
    }),
  },
  
  effects: (dispatch) => ({
    // Login effect
    async login(payload: { email: string; password: string; remember?: boolean }) {
      dispatch.auth.setLoading(true);
      dispatch.auth.clearError();
      
      try {
        const { data } = await apolloClient.mutate({
          mutation: LOGIN,
          variables: {
            email: payload.email,
            password: payload.password,
            remember: payload.remember || false,
          },
        });
        
        if (data?.login) {
          const { user, token, tenants } = data.login;
          
          // Update state
          dispatch.auth.setAuthenticated({ user, token, tenants });
          
          // Store token in localStorage for Apollo Client
          localStorage.setItem('auth_token', token);
          if (tenants[0]?.tenant) {
            localStorage.setItem('current_tenant', JSON.stringify(tenants[0].tenant));
          }
          
          return { success: true };
        }
        
        throw new Error('Login failed');
      } catch (error: any) {
        const errorMessage = error.message || 'Login failed';
        dispatch.auth.setError(errorMessage);
        dispatch.auth.setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    
    // Logout effect
    async logout() {
      dispatch.auth.setLoading(true);
      
      try {
        // Call logout mutation
        await apolloClient.mutate({
          mutation: LOGOUT,
        });
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
      }
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_tenant');
      
      // Clear Apollo Client cache
      await apolloClient.clearStore();
      
      // Clear auth state
      dispatch.auth.clearAuth();
    },
    
    // Register effect
    async register(payload: RegisterData) {
      dispatch.auth.setLoading(true);
      dispatch.auth.clearError();
      
      try {
        const { data } = await apolloClient.mutate({
          mutation: REGISTER,
          variables: payload,
        });
        
        if (data?.register) {
          const { user, token, tenants } = data.register;
          
          // Update state
          dispatch.auth.setAuthenticated({ user, token, tenants });
          
          // Store token in localStorage
          localStorage.setItem('auth_token', token);
          if (tenants[0]?.tenant) {
            localStorage.setItem('current_tenant', JSON.stringify(tenants[0].tenant));
          }
          
          return { success: true };
        }
        
        throw new Error('Registration failed');
      } catch (error: any) {
        const errorMessage = error.message || 'Registration failed';
        dispatch.auth.setError(errorMessage);
        dispatch.auth.setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    
    // Switch tenant effect
    async switchTenant(tenantId: string) {
      dispatch.auth.setLoading(true);
      dispatch.auth.clearError();
      
      try {
        const { data } = await apolloClient.mutate({
          mutation: SWITCH_TENANT,
          variables: { tenantId },
        });
        
        if (data?.switchTenant) {
          const { tenant, permissions } = data.switchTenant;
          
          // Update current tenant
          dispatch.auth.setCurrentTenant(tenant);
          
          // Update user permissions for current tenant
          const state = this.getState();
          if (state.auth.user) {
            dispatch.auth.updateUser({ permissions });
          }
          
          // Store current tenant
          localStorage.setItem('current_tenant', JSON.stringify(tenant));
          
          dispatch.auth.setLoading(false);
          return { success: true };
        }
        
        throw new Error('Failed to switch tenant');
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to switch tenant';
        dispatch.auth.setError(errorMessage);
        dispatch.auth.setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    
    // Refresh user data
    async refreshUser() {
      dispatch.auth.setLoading(true);
      
      try {
        const { data } = await apolloClient.query({
          query: GET_CURRENT_USER,
          fetchPolicy: 'network-only',
        });
        
        if (data?.currentUser) {
          const { user, tenants } = data.currentUser;
          
          dispatch.auth.updateUser(user);
          dispatch.auth.updateTenants(tenants);
        }
        
        dispatch.auth.setLoading(false);
      } catch (error: any) {
        console.error('Failed to refresh user:', error);
        dispatch.auth.setLoading(false);
        
        // If token is invalid, logout
        if (error.message?.includes('Unauthenticated')) {
          dispatch.auth.logout();
        }
      }
    },
    
    // Update user preferences
    async updatePreferences(preferences: Partial<User['preferences']>) {
      const state = this.getState();
      if (!state.auth.user) return;
      
      try {
        // Optimistically update UI
        dispatch.auth.updateUserPreferences(preferences);
        
        // API call to update preferences on server
        const mutation = `
          mutation UpdateUserPreferences($preferences: UserPreferencesInput!) {
            updateUserPreferences(preferences: $preferences) {
              id
              preferences {
                theme
                language
                notifications
                dashboard
              }
            }
          }
        `;
        
        const { data: _data } = await apolloClient.mutate({
          mutation,
          variables: { preferences },
        });
        
        return { success: true };
      } catch (error: any) {
        // Revert optimistic update on error
        console.error('Failed to update preferences:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Initialize auth from stored data
    async initializeAuth() {
      const token = localStorage.getItem('auth_token');
      const tenantData = localStorage.getItem('current_tenant');
      
      if (token) {
        try {
          // Verify token and get user data
          const { data } = await apolloClient.query({
            query: GET_CURRENT_USER,
            fetchPolicy: 'network-only',
          });
          
          if (data?.currentUser) {
            const { user, tenants } = data.currentUser;
            
            // Restore current tenant from localStorage if available
            let currentTenant = tenants[0]?.tenant || null;
            if (tenantData) {
              try {
                const storedTenant = JSON.parse(tenantData);
                const matchingTenant = tenants.find(t => t.tenant.id === storedTenant.id);
                if (matchingTenant) {
                  currentTenant = matchingTenant.tenant;
                }
              } catch (e) {
                console.warn('Failed to parse stored tenant data');
              }
            }
            
            dispatch.auth.setAuthenticated({ user, token, tenants });
            if (currentTenant) {
              dispatch.auth.setCurrentTenant(currentTenant);
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_tenant');
        }
      }
    },
  }),
});

export type AuthModel = typeof authModel;
