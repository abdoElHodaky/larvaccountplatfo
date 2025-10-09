/**
 * Authentication Store with Zustand
 * Centralized authentication state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apolloClient } from '../services/graphql/apollo-client';
import { LOGIN, LOGOUT, REGISTER, SWITCH_TENANT } from '../services/graphql/mutations';
import { GET_CURRENT_USER } from '../services/graphql/queries';

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

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  currentTenant: Tenant | null;
  userTenants: UserTenant[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  switchTenant: (tenantId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  tenantName?: string;
  tenantSubdomain?: string;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      currentTenant: null,
      userTenants: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string, remember = false) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const { data } = await apolloClient.mutate({
            mutation: LOGIN,
            variables: { email, password, remember },
          });

          if (data?.login) {
            const { user, token, tenants } = data.login;
            
            set((state) => {
              state.user = user;
              state.token = token;
              state.userTenants = tenants;
              state.currentTenant = tenants[0]?.tenant || null;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            // Store token in localStorage for Apollo Client
            localStorage.setItem('auth_token', token);
            if (tenants[0]?.tenant) {
              localStorage.setItem('current_tenant', JSON.stringify(tenants[0].tenant));
            }

            return true;
          }

          throw new Error('Login failed');
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Login failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await apolloClient.mutate({
            mutation: LOGOUT,
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call success
          set((state) => {
            state.user = null;
            state.token = null;
            state.currentTenant = null;
            state.userTenants = [];
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
          });

          // Clear localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_tenant');

          // Clear Apollo Client cache
          await apolloClient.clearStore();
        }
      },

      register: async (data: RegisterData) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const { data: result } = await apolloClient.mutate({
            mutation: REGISTER,
            variables: data,
          });

          if (result?.register) {
            const { user, token, tenant } = result.register;
            
            set((state) => {
              state.user = user;
              state.token = token;
              state.currentTenant = tenant;
              state.userTenants = tenant ? [{ 
                tenant, 
                role: 'admin', 
                permissions: [], 
                joinedAt: new Date().toISOString() 
              }] : [];
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            if (tenant) {
              localStorage.setItem('current_tenant', JSON.stringify(tenant));
            }

            return true;
          }

          throw new Error('Registration failed');
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Registration failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      switchTenant: async (tenantId: string) => {
        const { userTenants } = get();
        const targetTenant = userTenants.find(ut => ut.tenant.id === tenantId);
        
        if (!targetTenant) {
          set((state) => {
            state.error = 'Tenant not found';
          });
          return false;
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const { data } = await apolloClient.mutate({
            mutation: SWITCH_TENANT,
            variables: { tenantId },
          });

          if (data?.switchTenant?.success) {
            set((state) => {
              state.currentTenant = data.switchTenant.tenant;
              state.isLoading = false;
            });

            // Update localStorage
            localStorage.setItem('current_tenant', JSON.stringify(data.switchTenant.tenant));

            return true;
          }

          throw new Error('Failed to switch tenant');
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to switch tenant';
            state.isLoading = false;
          });
          return false;
        }
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        set((state) => {
          state.isLoading = true;
        });

        try {
          const { data } = await apolloClient.query({
            query: GET_CURRENT_USER,
            fetchPolicy: 'network-only',
          });

          if (data?.me) {
            set((state) => {
              state.user = data.me;
              state.userTenants = data.me.tenants || [];
              state.isLoading = false;
            });
          }
        } catch (error: any) {
          console.error('Failed to refresh user:', error);
          
          // If token is invalid, logout
          if (error.networkError?.statusCode === 401) {
            get().logout();
          } else {
            set((state) => {
              state.isLoading = false;
            });
          }
        }
      },

      updateUserPreferences: async (preferences: Partial<User['preferences']>) => {
        const { user } = get();
        if (!user) return;

        try {
          // Optimistically update the UI
          set((state) => {
            if (state.user) {
              state.user.preferences = {
                ...state.user.preferences,
                ...preferences,
              };
            }
          });

          // TODO: Implement UPDATE_USER_PREFERENCES mutation
          // await apolloClient.mutate({
          //   mutation: UPDATE_USER_PREFERENCES,
          //   variables: { preferences },
          // });
        } catch (error: any) {
          console.error('Failed to update preferences:', error);
          // Revert optimistic update on error
          set((state) => {
            if (state.user) {
              state.user.preferences = user.preferences;
            }
          });
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentTenant: state.currentTenant,
        userTenants: state.userTenants,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useCurrentTenant = () => useAuthStore((state) => state.currentTenant);

export const useUserTenants = () => useAuthStore((state) => state.userTenants);

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  register: state.register,
  switchTenant: state.switchTenant,
  refreshUser: state.refreshUser,
  updateUserPreferences: state.updateUserPreferences,
  clearError: state.clearError,
}));
