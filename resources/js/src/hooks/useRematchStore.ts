/**
 * Rematch Store Hooks
 * Custom hooks for connecting React components to Rematch store
 */

import { useSelector, useDispatch } from 'react-redux';
import { RootState, Dispatch } from '../stores';

// Base hooks
export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  return useSelector(selector);
};

export const useAppDispatch = (): Dispatch => {
  return useDispatch<Dispatch>();
};

// Auth hooks
export const useAuth = () => {
  const auth = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  
  return {
    ...auth,
    login: dispatch.auth.login,
    logout: dispatch.auth.logout,
    register: dispatch.auth.register,
    switchTenant: dispatch.auth.switchTenant,
    refreshUser: dispatch.auth.refreshUser,
    updatePreferences: dispatch.auth.updatePreferences,
    clearError: dispatch.auth.clearError,
  };
};

export const useCurrentUser = () => {
  return useAppSelector(state => state.auth.user);
};

export const useCurrentTenant = () => {
  return useAppSelector(state => state.auth.currentTenant);
};

export const useUserTenants = () => {
  return useAppSelector(state => state.auth.userTenants);
};

export const useIsAuthenticated = () => {
  return useAppSelector(state => state.auth.isAuthenticated);
};

// App hooks
export const useApp = () => {
  const app = useAppSelector(state => state.app);
  const dispatch = useAppDispatch();
  
  return {
    ...app,
    setSidebarOpen: dispatch.app.setSidebarOpen,
    toggleSidebar: dispatch.app.toggleSidebar,
    setTheme: dispatch.app.setTheme,
    updateTheme: dispatch.app.updateTheme,
    showNotification: dispatch.app.showNotification,
    showSuccess: dispatch.app.showSuccess,
    showError: dispatch.app.showError,
    showWarning: dispatch.app.showWarning,
    showInfo: dispatch.app.showInfo,
    removeNotification: dispatch.app.removeNotification,
    clearNotifications: dispatch.app.clearNotifications,
    openModal: dispatch.app.openModal,
    closeModal: dispatch.app.closeModal,
    closeAllModals: dispatch.app.closeAllModals,
    setGlobalLoading: dispatch.app.setGlobalLoading,
    handleGlobalError: dispatch.app.handleGlobalError,
    updatePageContext: dispatch.app.updatePageContext,
    loadFeatureFlags: dispatch.app.loadFeatureFlags,
    initializeTheme: dispatch.app.initializeTheme,
  };
};

export const useNotifications = () => {
  return useAppSelector(state => state.app.notifications);
};

export const useTheme = () => {
  const theme = useAppSelector(state => state.app.theme);
  const colorMode = useAppSelector(state => state.app.colorMode);
  const dispatch = useAppDispatch();
  
  return {
    theme,
    colorMode,
    updateTheme: dispatch.app.updateTheme,
  };
};

export const useModals = () => {
  const modals = useAppSelector(state => state.app.modals);
  const dispatch = useAppDispatch();
  
  return {
    modals,
    openModal: dispatch.app.openModal,
    closeModal: dispatch.app.closeModal,
    closeAllModals: dispatch.app.closeAllModals,
  };
};

export const useFeatureFlags = () => {
  return useAppSelector(state => state.app.features);
};

export const useBreadcrumbs = () => {
  return useAppSelector(state => state.app.breadcrumbs);
};

// Financial hooks
export const useFinancial = () => {
  const financial = useAppSelector(state => state.financial);
  const dispatch = useAppDispatch();
  
  return {
    ...financial,
    loadAccounts: dispatch.financial.loadAccounts,
    loadTransactions: dispatch.financial.loadTransactions,
    loadDashboardMetrics: dispatch.financial.loadDashboardMetrics,
    createTransaction: dispatch.financial.createTransaction,
    updateFilters: dispatch.financial.updateFilters,
    bulkUpdateTransactions: dispatch.financial.bulkUpdateTransactions,
    setSelectedTransactions: dispatch.financial.setSelectedTransactions,
    toggleTransactionSelection: dispatch.financial.toggleTransactionSelection,
    clearTransactionSelection: dispatch.financial.clearTransactionSelection,
    setSelectedAccounts: dispatch.financial.setSelectedAccounts,
    toggleAccountSelection: dispatch.financial.toggleAccountSelection,
    clearAccountSelection: dispatch.financial.clearAccountSelection,
    setDateRange: dispatch.financial.setDateRange,
    setSearchQuery: dispatch.financial.setSearchQuery,
    clearError: dispatch.financial.clearError,
  };
};

export const useAccounts = () => {
  return useAppSelector(state => ({
    accounts: state.financial.accounts,
    loading: state.financial.accountsLoading,
    selectedAccounts: state.financial.selectedAccounts,
  }));
};

export const useTransactions = () => {
  return useAppSelector(state => ({
    transactions: state.financial.transactions,
    loading: state.financial.transactionsLoading,
    pagination: state.financial.transactionsPagination,
    selectedTransactions: state.financial.selectedTransactions,
  }));
};

export const useDashboardMetrics = () => {
  return useAppSelector(state => ({
    metrics: state.financial.dashboardMetrics,
    loading: state.financial.dashboardLoading,
  }));
};

export const useFinancialFilters = () => {
  return useAppSelector(state => state.financial.filters);
};

// Tenant hooks
export const useTenant = () => {
  const tenant = useAppSelector(state => state.tenant);
  const dispatch = useAppDispatch();
  
  return {
    ...tenant,
    loadTenantData: dispatch.tenant.loadTenantData,
    loadTenantUsers: dispatch.tenant.loadTenantUsers,
    loadTenantUsage: dispatch.tenant.loadTenantUsage,
    loadAvailablePlans: dispatch.tenant.loadAvailablePlans,
    inviteUser: dispatch.tenant.inviteUser,
    updateSettings: dispatch.tenant.updateSettings,
    clearError: dispatch.tenant.clearError,
  };
};

export const useTenantUsers = () => {
  return useAppSelector(state => ({
    users: state.tenant.users,
    loading: state.tenant.usersLoading,
    invitations: state.tenant.invitations,
    invitationsLoading: state.tenant.invitationsLoading,
  }));
};

export const useTenantUsage = () => {
  return useAppSelector(state => ({
    usage: state.tenant.usage,
    loading: state.tenant.usageLoading,
  }));
};

export const useTenantSettings = () => {
  return useAppSelector(state => ({
    settings: state.tenant.tenantSettings,
    loading: state.tenant.settingsLoading,
  }));
};

export const useAvailablePlans = () => {
  return useAppSelector(state => ({
    plans: state.tenant.availablePlans,
    loading: state.tenant.plansLoading,
  }));
};

// Loading hooks (from @rematch/loading plugin)
export const useLoading = () => {
  return useAppSelector(state => (state as any).loading);
};

export const useModelLoading = (modelName: string) => {
  const loading = useLoading();
  return loading.models[modelName] || false;
};

export const useEffectLoading = (modelName: string, effectName: string) => {
  const loading = useLoading();
  return loading.effects[modelName]?.[effectName] || false;
};

// Composite hooks for common use cases
export const useAuthActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    login: dispatch.auth.login,
    logout: dispatch.auth.logout,
    register: dispatch.auth.register,
    switchTenant: dispatch.auth.switchTenant,
    refreshUser: dispatch.auth.refreshUser,
  };
};

export const useAppActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    showSuccess: dispatch.app.showSuccess,
    showError: dispatch.app.showError,
    showWarning: dispatch.app.showWarning,
    showInfo: dispatch.app.showInfo,
    removeNotification: dispatch.app.removeNotification,
    openModal: dispatch.app.openModal,
    closeModal: dispatch.app.closeModal,
    setGlobalLoading: dispatch.app.setGlobalLoading,
    updatePageContext: dispatch.app.updatePageContext,
  };
};

export const useFinancialActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    loadAccounts: dispatch.financial.loadAccounts,
    loadTransactions: dispatch.financial.loadTransactions,
    loadDashboardMetrics: dispatch.financial.loadDashboardMetrics,
    createTransaction: dispatch.financial.createTransaction,
    updateFilters: dispatch.financial.updateFilters,
  };
};

export const useTenantActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    loadTenantData: dispatch.tenant.loadTenantData,
    loadTenantUsers: dispatch.tenant.loadTenantUsers,
    loadTenantUsage: dispatch.tenant.loadTenantUsage,
    inviteUser: dispatch.tenant.inviteUser,
    updateSettings: dispatch.tenant.updateSettings,
  };
};

