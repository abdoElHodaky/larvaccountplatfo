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

// Accounting hooks (replacing financial)
export const useAccounting = () => {
  const accounting = useAppSelector(state => state.accounting);
  const _dispatch = useAppDispatch();
  
  return {
    ...accounting,
    // Add accounting actions here when they're implemented
  };
};

// Inventory hooks
export const useInventory = () => {
  const inventory = useAppSelector(state => state.inventory);
  const dispatch = useAppDispatch();
  
  return {
    ...inventory,
    // Add inventory actions here when they're implemented
  };
};

// Dashboard hooks
export const useDashboard = () => {
  const dashboard = useAppSelector(state => state.dashboard);
  const dispatch = useAppDispatch();
  
  return {
    ...dashboard,
    // Add dashboard actions here when they're implemented
  };
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
    handleGlobalError: dispatch.app.handleGlobalError,
    loadFeatureFlags: dispatch.app.loadFeatureFlags,
    initializeTheme: dispatch.app.initializeTheme,
  };
};

export const useAccountingActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    // Add accounting actions here when they're implemented
  };
};

export const useInventoryActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    // Add inventory actions here when they're implemented
  };
};

export const useDashboardActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    // Add dashboard actions here when they're implemented
  };
};
