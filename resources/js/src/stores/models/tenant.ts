/**
 * Tenant Model for Rematch
 * Handles tenant-specific data and multi-tenant operations
 */

import { createModel } from '@rematch/core';
import type { RootModel } from '../index';

// Types
export interface TenantSettings {
  currency: string;
  dateFormat: string;
  timezone: string;
  fiscalYearStart: string;
  language: string;
  numberFormat: string;
  taxSettings: {
    defaultTaxRate: number;
    taxNumber?: string;
    taxRegion: string;
  };
  companyInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  features: {
    multiCurrency: boolean;
    inventory: boolean;
    projects: boolean;
    timeTracking: boolean;
    payroll: boolean;
    budgeting: boolean;
  };
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  invitedAt?: string;
  joinedAt?: string;
}

export interface TenantInvitation {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface TenantSubscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
  limits: {
    users: number;
    storage: number; // in GB
    transactions: number;
    apiCalls: number;
  };
  usage: {
    users: number;
    storage: number;
    transactions: number;
    apiCalls: number;
  };
}

export interface TenantAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface TenantState {
  // Current tenant data
  currentTenant: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: 'active' | 'suspended' | 'trial';
    settings: TenantSettings;
    enabledModules: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  
  // Available tenants for switching
  availableTenants: Array<{
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    role: string;
  }>;
  
  // Tenant users
  users: TenantUser[];
  usersLoading: boolean;
  
  // Invitations
  invitations: TenantInvitation[];
  invitationsLoading: boolean;
  
  // Subscription
  subscription: TenantSubscription | null;
  subscriptionLoading: boolean;
  
  // Audit logs
  auditLogs: TenantAuditLog[];
  auditLogsLoading: boolean;
  
  // UI State
  settingsTab: 'general' | 'users' | 'subscription' | 'security' | 'integrations';
  
  // Loading states
  switchingTenant: boolean;
  updatingSettings: boolean;
  
  // Error handling
  error: string | null;
  
  // Pagination
  pagination: {
    users: { page: number; total: number; perPage: number };
    auditLogs: { page: number; total: number; perPage: number };
  };
}

const initialState: TenantState = {
  currentTenant: null,
  availableTenants: [],
  users: [],
  usersLoading: false,
  invitations: [],
  invitationsLoading: false,
  subscription: null,
  subscriptionLoading: false,
  auditLogs: [],
  auditLogsLoading: false,
  settingsTab: 'general',
  switchingTenant: false,
  updatingSettings: false,
  error: null,
  pagination: {
    users: { page: 1, total: 0, perPage: 20 },
    auditLogs: { page: 1, total: 0, perPage: 50 },
  },
};

export const tenant = createModel<RootModel>()({
  state: initialState,
  
  reducers: {
    // General
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
    }),
    
    setSettingsTab: (state, payload: TenantState['settingsTab']) => ({
      ...state,
      settingsTab: payload,
    }),
    
    // Current tenant
    setCurrentTenant: (state, payload: TenantState['currentTenant']) => ({
      ...state,
      currentTenant: payload,
    }),
    
    updateCurrentTenant: (state, payload: Partial<TenantState['currentTenant']>) => ({
      ...state,
      currentTenant: state.currentTenant ? { ...state.currentTenant, ...payload } : null,
    }),
    
    updateTenantSettings: (state, payload: Partial<TenantSettings>) => ({
      ...state,
      currentTenant: state.currentTenant ? {
        ...state.currentTenant,
        settings: { ...state.currentTenant.settings, ...payload }
      } : null,
    }),
    
    // Available tenants
    setAvailableTenants: (state, payload: TenantState['availableTenants']) => ({
      ...state,
      availableTenants: payload,
    }),
    
    // Tenant switching
    setSwitchingTenant: (state, payload: boolean) => ({
      ...state,
      switchingTenant: payload,
    }),
    
    // Settings updates
    setUpdatingSettings: (state, payload: boolean) => ({
      ...state,
      updatingSettings: payload,
    }),
    
    // Users
    setUsersLoading: (state, payload: boolean) => ({
      ...state,
      usersLoading: payload,
    }),
    
    setUsers: (state, payload: { users: TenantUser[]; pagination?: Partial<TenantState['pagination']['users']> }) => ({
      ...state,
      users: payload.users,
      usersLoading: false,
      pagination: {
        ...state.pagination,
        users: { ...state.pagination.users, ...payload.pagination },
      },
    }),
    
    addUser: (state, payload: TenantUser) => ({
      ...state,
      users: [...state.users, payload],
    }),
    
    updateUser: (state, payload: TenantUser) => ({
      ...state,
      users: state.users.map(user => user.id === payload.id ? payload : user),
    }),
    
    removeUser: (state, payload: string) => ({
      ...state,
      users: state.users.filter(user => user.id !== payload),
    }),
    
    // Invitations
    setInvitationsLoading: (state, payload: boolean) => ({
      ...state,
      invitationsLoading: payload,
    }),
    
    setInvitations: (state, payload: TenantInvitation[]) => ({
      ...state,
      invitations: payload,
      invitationsLoading: false,
    }),
    
    addInvitation: (state, payload: TenantInvitation) => ({
      ...state,
      invitations: [...state.invitations, payload],
    }),
    
    updateInvitation: (state, payload: TenantInvitation) => ({
      ...state,
      invitations: state.invitations.map(inv => inv.id === payload.id ? payload : inv),
    }),
    
    removeInvitation: (state, payload: string) => ({
      ...state,
      invitations: state.invitations.filter(inv => inv.id !== payload),
    }),
    
    // Subscription
    setSubscriptionLoading: (state, payload: boolean) => ({
      ...state,
      subscriptionLoading: payload,
    }),
    
    setSubscription: (state, payload: TenantSubscription) => ({
      ...state,
      subscription: payload,
      subscriptionLoading: false,
    }),
    
    updateSubscriptionUsage: (state, payload: Partial<TenantSubscription['usage']>) => ({
      ...state,
      subscription: state.subscription ? {
        ...state.subscription,
        usage: { ...state.subscription.usage, ...payload }
      } : null,
    }),
    
    // Audit logs
    setAuditLogsLoading: (state, payload: boolean) => ({
      ...state,
      auditLogsLoading: payload,
    }),
    
    setAuditLogs: (state, payload: { auditLogs: TenantAuditLog[]; pagination?: Partial<TenantState['pagination']['auditLogs']> }) => ({
      ...state,
      auditLogs: payload.auditLogs,
      auditLogsLoading: false,
      pagination: {
        ...state.pagination,
        auditLogs: { ...state.pagination.auditLogs, ...payload.pagination },
      },
    }),
    
    addAuditLog: (state, payload: TenantAuditLog) => ({
      ...state,
      auditLogs: [payload, ...state.auditLogs],
    }),
  },
  
  effects: (dispatch) => ({
    // Tenant switching
    async switchTenant(tenantId: string) {
      dispatch.tenant.setSwitchingTenant(true);
      
      try {
        const response = await fetch('/api/tenant/switch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ tenant_id: tenantId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to switch tenant');
        }
        
        const data = await response.json();
        
        // Update auth store with new token and tenant
        dispatch.auth.updateTokens({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        
        dispatch.auth.setCurrentTenant(data.tenant);
        dispatch.tenant.setCurrentTenant(data.tenant);
        
        // Reinitialize data for new tenant
        await dispatch.financial.initializeFinancialData();
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to switch tenant';
        dispatch.tenant.setError(message);
        throw error;
      } finally {
        dispatch.tenant.setSwitchingTenant(false);
      }
    },
    
    // Fetch tenant data
    async fetchTenantData() {
      try {
        const response = await fetch('/api/tenant/current', {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tenant data');
        }
        
        const data = await response.json();
        dispatch.tenant.setCurrentTenant(data.tenant);
        
        return data.tenant;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch tenant data';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    // Update tenant settings
    async updateSettings(payload: Partial<TenantSettings>) {
      dispatch.tenant.setUpdatingSettings(true);
      
      try {
        const response = await fetch('/api/tenant/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update tenant settings');
        }
        
        const data = await response.json();
        dispatch.tenant.updateTenantSettings(data.settings);
        
        return data.settings;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update tenant settings';
        dispatch.tenant.setError(message);
        throw error;
      } finally {
        dispatch.tenant.setUpdatingSettings(false);
      }
    },
    
    // Users management
    async fetchUsers(payload?: { page?: number; search?: string; role?: string }) {
      dispatch.tenant.setUsersLoading(true);
      
      try {
        const params = new URLSearchParams();
        if (payload?.page) params.append('page', payload.page.toString());
        if (payload?.search) params.append('search', payload.search);
        if (payload?.role) params.append('role', payload.role);
        
        const response = await fetch(`/api/tenant/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        dispatch.tenant.setUsers({
          users: data.data,
          pagination: {
            page: data.current_page,
            total: data.total,
            perPage: data.per_page,
          },
        });
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch users';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    async inviteUser(payload: { email: string; role: string; permissions: string[] }) {
      try {
        const response = await fetch('/api/tenant/users/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to invite user');
        }
        
        const data = await response.json();
        dispatch.tenant.addInvitation(data.invitation);
        
        return data.invitation;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to invite user';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    async updateUserRole(payload: { userId: string; role: string; permissions: string[] }) {
      try {
        const response = await fetch(`/api/tenant/users/${payload.userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            role: payload.role,
            permissions: payload.permissions,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update user role');
        }
        
        const data = await response.json();
        dispatch.tenant.updateUser(data.user);
        
        return data.user;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update user role';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    async removeUser(userId: string) {
      try {
        const response = await fetch(`/api/tenant/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove user');
        }
        
        dispatch.tenant.removeUser(userId);
        
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove user';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    // Subscription management
    async fetchSubscription() {
      dispatch.tenant.setSubscriptionLoading(true);
      
      try {
        const response = await fetch('/api/tenant/subscription', {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        dispatch.tenant.setSubscription(data.subscription);
        
        return data.subscription;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch subscription';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    // Audit logs
    async fetchAuditLogs(payload?: { page?: number; action?: string; resource?: string; userId?: string }) {
      dispatch.tenant.setAuditLogsLoading(true);
      
      try {
        const params = new URLSearchParams();
        if (payload?.page) params.append('page', payload.page.toString());
        if (payload?.action) params.append('action', payload.action);
        if (payload?.resource) params.append('resource', payload.resource);
        if (payload?.userId) params.append('user_id', payload.userId);
        
        const response = await fetch(`/api/tenant/audit-logs?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        
        const data = await response.json();
        
        dispatch.tenant.setAuditLogs({
          auditLogs: data.data,
          pagination: {
            page: data.current_page,
            total: data.total,
            perPage: data.per_page,
          },
        });
        
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
        dispatch.tenant.setError(message);
        throw error;
      }
    },
    
    // Initialize tenant data
    async initializeTenantData() {
      try {
        await Promise.all([
          dispatch.tenant.fetchTenantData(),
          dispatch.tenant.fetchUsers({ page: 1 }),
          dispatch.tenant.fetchSubscription(),
        ]);
      } catch (error) {
        console.error('Failed to initialize tenant data:', error);
      }
    },
  }),
});
