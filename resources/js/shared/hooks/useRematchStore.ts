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

  const appActions = {
    setSidebarOpen: (dispatch.app as any).setSidebarOpen,
    toggleSidebar: (dispatch.app as any).toggleSidebar,
    setTheme: (dispatch.app as any).setTheme,
    updateTheme: (dispatch.app as any).updateTheme,
    showNotification: (dispatch.app as any).showNotification,
    showSuccess: (dispatch.app as any).showSuccess,
    showError: (dispatch.app as any).showError,
    showWarning: (dispatch.app as any).showWarning,
    showInfo: (dispatch.app as any).showInfo,
    removeNotification: (dispatch.app as any).removeNotification,
    clearNotifications: (dispatch.app as any).clearNotifications,
    openModal: (dispatch.app as any).openModal,
    closeModal: (dispatch.app as any).closeModal,
    closeAllModals: (dispatch.app as any).closeAllModals,
    setGlobalLoading: (dispatch.app as any).setGlobalLoading,
    handleGlobalError: (dispatch.app as any).handleGlobalError,
    updatePageContext: (dispatch.app as any).updatePageContext,
    loadFeatureFlags: (dispatch.app as any).loadFeatureFlags,
    initializeTheme: (dispatch.app as any).initializeTheme,
  };

  return {
    ...app,
    ...appActions,
  };
};

export const useNotifications = () => {
  return useAppSelector(state => state.app.notifications);
};

export const useAppTheme = () => {
  const theme = useAppSelector(state => state.app.theme);
  const colorMode = useAppSelector(state => state.app.colorMode);
  const dispatch = useAppDispatch();

  return {
    theme,
    colorMode,
    updateTheme: (dispatch.app as any).updateTheme,
  };
};

export const useModals = () => {
  const modals = useAppSelector(state => state.app.modals);
  const dispatch = useAppDispatch();

  return {
    modals,
    openModal: (dispatch.app as any).openModal,
    closeModal: (dispatch.app as any).closeModal,
    closeAllModals: (dispatch.app as any).closeAllModals,
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
  const _dispatch = useAppDispatch();
  
  return {
    ...inventory,
    // Add inventory actions here when they're implemented
  };
};

// Dashboard hooks
export const useDashboard = () => {
  const dashboard = useAppSelector(state => state.dashboard);
  const _dispatch = useAppDispatch();
  
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
    showNotification: (dispatch.app as any).showNotification,
    showSuccess: (dispatch.app as any).showSuccess,
    showError: (dispatch.app as any).showError,
    showWarning: (dispatch.app as any).showWarning,
    showInfo: (dispatch.app as any).showInfo,
    removeNotification: (dispatch.app as any).removeNotification,
    clearNotifications: (dispatch.app as any).clearNotifications,
    openModal: (dispatch.app as any).openModal,
    closeModal: (dispatch.app as any).closeModal,
    setGlobalLoading: (dispatch.app as any).setGlobalLoading,
    handleGlobalError: (dispatch.app as any).handleGlobalError,
    loadFeatureFlags: (dispatch.app as any).loadFeatureFlags,
    initializeTheme: (dispatch.app as any).initializeTheme,
  };
};

export const useAccountingActions = () => {
  const _dispatch = useAppDispatch();
  
  return {
    // Add accounting actions here when they're implemented
  };
};

export const useInventoryActions = () => {
  const _dispatch = useAppDispatch();
  
  return {
    // Add inventory actions here when they're implemented
  };
};

export const useDashboardActions = () => {
  const _dispatch = useAppDispatch();
  
  return {
    // Add dashboard actions here when they're implemented
  };
};
