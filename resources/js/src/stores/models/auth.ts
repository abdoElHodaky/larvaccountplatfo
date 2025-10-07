/**
 * Authentication Model for Rematch
 * Handles user authentication, tenant context, and session management
 */

import { createModel } from '@rematch/core';
import type { RootModel } from '../index';

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

export interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  
  // User data
  user: User | null;
  
  // Tenant context
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  
  // Session management
  sessionExpiry: number | null;
  lastActivity: number;
  
  // Error handling
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  token: null,
  refreshToken: null,
  user: null,
  currentTenant: null,
  availableTenants: [],
  sessionExpiry: null,
  lastActivity: Date.now(),
  error: null,
};

export const auth = createModel<RootModel>()({
  state: initialState,
  
  reducers: {
    // Authentication actions
    setLoading: (state, payload: boolean) => ({
      ...state,
      isLoading: payload,
      error: null,
    }),
    
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
      isLoading: false,
    }),
    
    loginSuccess: (state, payload: { user: User; token: string; refreshToken: string; tenant: Tenant }) => ({
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user: payload.user,
      token: payload.token,
      refreshToken: payload.refreshToken,
      currentTenant: payload.tenant,
      sessionExpiry: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      lastActivity: Date.now(),
      error: null,
    }),
    
    logout: () => initialState,
    
    // Token management
    updateTokens: (state, payload: { token: string; refreshToken: string }) => ({
      ...state,
      token: payload.token,
      refreshToken: payload.refreshToken,
      sessionExpiry: Date.now() + (24 * 60 * 60 * 1000),
      lastActivity: Date.now(),
    }),
    
    // User management
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
    
    // Tenant management
    setCurrentTenant: (state, payload: Tenant) => ({
      ...state,
      currentTenant: payload,
    }),
    
    setAvailableTenants: (state, payload: Tenant[]) => ({
      ...state,
      availableTenants: payload,
    }),
    
    updateTenant: (state, payload: Partial<Tenant>) => ({
      ...state,
      currentTenant: state.currentTenant ? { ...state.currentTenant, ...payload } : null,
    }),
    
    // Session management
    updateLastActivity: (state) => ({
      ...state,
      lastActivity: Date.now(),
    }),
    
    extendSession: (state) => ({
      ...state,
      sessionExpiry: Date.now() + (24 * 60 * 60 * 1000),
      lastActivity: Date.now(),
    }),
  },
  
  effects: (dispatch) => ({
    // Login effect
    async login(payload: { email: string; password: string; tenantId?: string }) {
      dispatch.auth.setLoading(true);
      
      try {
        // This will be implemented with actual API call
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        
        dispatch.auth.loginSuccess({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          tenant: data.tenant,
        });
        
        // Set available tenants if provided
        if (data.availableTenants) {
          dispatch.auth.setAvailableTenants(data.availableTenants);
        }
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        dispatch.auth.setError(message);
        throw error;
      }
    },
    
    // Logout effect
    async logoutUser() {
      dispatch.auth.setLoading(true);
      
      try {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      } finally {
        dispatch.auth.logout();
      }
    },
    
    // Refresh token effect
    async refreshToken() {
      const state = this as AuthState;
      
      if (!state.refreshToken) {
        dispatch.auth.logout();
        return;
      }
      
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${state.refreshToken}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        
        dispatch.auth.updateTokens({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        
        return data;
      } catch (error) {
        console.error('Token refresh failed:', error);
        dispatch.auth.logout();
        throw error;
      }
    },
    
    // Switch tenant effect
    async switchTenant(tenantId: string) {
      dispatch.auth.setLoading(true);
      
      try {
        const response = await fetch('/api/auth/switch-tenant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify({ tenant_id: tenantId }),
        });
        
        if (!response.ok) {
          throw new Error('Tenant switch failed');
        }
        
        const data = await response.json();
        
        dispatch.auth.updateTokens({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        
        dispatch.auth.setCurrentTenant(data.tenant);
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tenant switch failed';
        dispatch.auth.setError(message);
        throw error;
      } finally {
        dispatch.auth.setLoading(false);
      }
    },
    
    // Check session validity
    checkSession() {
      const state = this as AuthState;
      
      if (!state.isAuthenticated || !state.sessionExpiry) {
        return false;
      }
      
      const now = Date.now();
      const isExpired = now > state.sessionExpiry;
      
      if (isExpired) {
        dispatch.auth.logout();
        return false;
      }
      
      // Auto-refresh if within 1 hour of expiry
      const oneHour = 60 * 60 * 1000;
      if (now > (state.sessionExpiry - oneHour)) {
        dispatch.auth.refreshToken().catch(() => {
          // If refresh fails, logout
          dispatch.auth.logout();
        });
      }
      
      return true;
    },
    
    // Initialize auth from storage
    async initializeAuth() {
      const state = this as AuthState;
      
      if (state.isAuthenticated && state.token) {
        // Check if session is still valid
        const isValid = dispatch.auth.checkSession();
        
        if (isValid) {
          // Fetch current user data to ensure it's up to date
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${state.token}`,
                'Accept': 'application/json',
              },
            });
            
            if (response.ok) {
              const userData = await response.json();
              dispatch.auth.updateUser(userData.user);
              
              if (userData.tenant) {
                dispatch.auth.setCurrentTenant(userData.tenant);
              }
              
              if (userData.availableTenants) {
                dispatch.auth.setAvailableTenants(userData.availableTenants);
              }
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }
        }
      }
    },
  }),
});
