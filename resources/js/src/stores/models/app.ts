/**
 * Application Model for Rematch
 * Handles global app state, UI preferences, and notifications
 */

import { createModel } from '@rematch/core';
import type { RootModel } from '../index';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  createdAt: number;
}

export interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  sidebarMobile: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Notifications
  notifications: Notification[];
  
  // Modals and overlays
  activeModal: string | null;
  modalData: any;
  
  // Navigation
  currentPage: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  
  // Search
  globalSearchOpen: boolean;
  globalSearchQuery: string;
  
  // Settings
  language: string;
  dateFormat: string;
  currency: string;
  timezone: string;
  
  // Feature flags
  features: Record<string, boolean>;
  
  // Error handling
  error: string | null;
  
  // Performance
  performanceMetrics: {
    pageLoadTime?: number;
    apiResponseTimes: Record<string, number>;
    renderTimes: Record<string, number>;
  };
}

const initialState: AppState = {
  // UI State
  theme: 'system',
  sidebarCollapsed: false,
  sidebarMobile: false,
  
  // Loading states
  globalLoading: false,
  loadingMessage: null,
  
  // Notifications
  notifications: [],
  
  // Modals and overlays
  activeModal: null,
  modalData: null,
  
  // Navigation
  currentPage: 'dashboard',
  breadcrumbs: [
    { label: 'Dashboard', current: true }
  ],
  
  // Search
  globalSearchOpen: false,
  globalSearchQuery: '',
  
  // Settings
  language: 'en',
  dateFormat: 'MM/dd/yyyy',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  
  // Feature flags
  features: {
    realTimeUpdates: true,
    advancedReporting: true,
    multiCurrency: true,
    auditTrail: true,
    apiAccess: true,
  },
  
  // Error handling
  error: null,
  
  // Performance
  performanceMetrics: {
    apiResponseTimes: {},
    renderTimes: {},
  },
};

export const app = createModel<RootModel>()({
  state: initialState,
  
  reducers: {
    // UI State
    setTheme: (state, payload: 'light' | 'dark' | 'system') => ({
      ...state,
      theme: payload,
    }),
    
    toggleSidebar: (state) => ({
      ...state,
      sidebarCollapsed: !state.sidebarCollapsed,
    }),
    
    setSidebarCollapsed: (state, payload: boolean) => ({
      ...state,
      sidebarCollapsed: payload,
    }),
    
    setSidebarMobile: (state, payload: boolean) => ({
      ...state,
      sidebarMobile: payload,
    }),
    
    // Loading states
    setGlobalLoading: (state, payload: boolean) => ({
      ...state,
      globalLoading: payload,
      loadingMessage: payload ? state.loadingMessage : null,
    }),
    
    setLoadingMessage: (state, payload: string | null) => ({
      ...state,
      loadingMessage: payload,
    }),
    
    // Notifications
    addNotification: (state, payload: Omit<Notification, 'id' | 'createdAt'>) => {
      const notification: Notification = {
        ...payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      
      return {
        ...state,
        notifications: [...state.notifications, notification],
      };
    },
    
    removeNotification: (state, payload: string) => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== payload),
    }),
    
    clearNotifications: (state) => ({
      ...state,
      notifications: [],
    }),
    
    // Modals
    openModal: (state, payload: { modal: string; data?: any }) => ({
      ...state,
      activeModal: payload.modal,
      modalData: payload.data || null,
    }),
    
    closeModal: (state) => ({
      ...state,
      activeModal: null,
      modalData: null,
    }),
    
    // Navigation
    setCurrentPage: (state, payload: string) => ({
      ...state,
      currentPage: payload,
    }),
    
    setBreadcrumbs: (state, payload: AppState['breadcrumbs']) => ({
      ...state,
      breadcrumbs: payload,
    }),
    
    // Search
    setGlobalSearchOpen: (state, payload: boolean) => ({
      ...state,
      globalSearchOpen: payload,
      globalSearchQuery: payload ? state.globalSearchQuery : '',
    }),
    
    setGlobalSearchQuery: (state, payload: string) => ({
      ...state,
      globalSearchQuery: payload,
    }),
    
    // Settings
    updateSettings: (state, payload: Partial<Pick<AppState, 'language' | 'dateFormat' | 'currency' | 'timezone'>>) => ({
      ...state,
      ...payload,
    }),
    
    // Feature flags
    setFeature: (state, payload: { feature: string; enabled: boolean }) => ({
      ...state,
      features: {
        ...state.features,
        [payload.feature]: payload.enabled,
      },
    }),
    
    setFeatures: (state, payload: Record<string, boolean>) => ({
      ...state,
      features: { ...state.features, ...payload },
    }),
    
    // Error handling
    setError: (state, payload: string | null) => ({
      ...state,
      error: payload,
    }),
    
    // Performance
    recordPageLoadTime: (state, payload: number) => ({
      ...state,
      performanceMetrics: {
        ...state.performanceMetrics,
        pageLoadTime: payload,
      },
    }),
    
    recordApiResponseTime: (state, payload: { endpoint: string; time: number }) => ({
      ...state,
      performanceMetrics: {
        ...state.performanceMetrics,
        apiResponseTimes: {
          ...state.performanceMetrics.apiResponseTimes,
          [payload.endpoint]: payload.time,
        },
      },
    }),
    
    recordRenderTime: (state, payload: { component: string; time: number }) => ({
      ...state,
      performanceMetrics: {
        ...state.performanceMetrics,
        renderTimes: {
          ...state.performanceMetrics.renderTimes,
          [payload.component]: payload.time,
        },
      },
    }),
  },
  
  effects: (dispatch) => ({
    // Auto-remove notifications
    async showNotification(payload: Omit<Notification, 'id' | 'createdAt'>) {
      const notification = dispatch.app.addNotification(payload);
      
      // Auto-remove after duration (default 5 seconds)
      if (!payload.persistent) {
        const duration = payload.duration || 5000;
        setTimeout(() => {
          dispatch.app.removeNotification(notification.payload.id);
        }, duration);
      }
      
      return notification;
    },
    
    // Show success notification
    async showSuccess(payload: { title: string; message: string; duration?: number }) {
      return dispatch.app.showNotification({
        type: 'success',
        ...payload,
      });
    },
    
    // Show error notification
    async showError(payload: { title: string; message: string; persistent?: boolean }) {
      return dispatch.app.showNotification({
        type: 'error',
        persistent: payload.persistent || true,
        ...payload,
      });
    },
    
    // Show warning notification
    async showWarning(payload: { title: string; message: string; duration?: number }) {
      return dispatch.app.showNotification({
        type: 'warning',
        ...payload,
      });
    },
    
    // Show info notification
    async showInfo(payload: { title: string; message: string; duration?: number }) {
      return dispatch.app.showNotification({
        type: 'info',
        ...payload,
      });
    },
    
    // Initialize app settings
    async initializeApp() {
      // Load user preferences from localStorage or API
      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        dispatch.app.setTheme(savedTheme);
      }
      
      const savedSidebarState = localStorage.getItem('sidebar-collapsed');
      if (savedSidebarState !== null) {
        dispatch.app.setSidebarCollapsed(JSON.parse(savedSidebarState));
      }
      
      // Apply theme
      dispatch.app.applyTheme();
      
      // Record page load time
      if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        dispatch.app.recordPageLoadTime(loadTime);
      }
    },
    
    // Apply theme to document
    async applyTheme() {
      const state = this as AppState;
      let effectiveTheme = state.theme;
      
      if (effectiveTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(effectiveTheme);
      
      // Save to localStorage
      localStorage.setItem('app-theme', state.theme);
    },
    
    // Handle responsive sidebar
    async handleResize() {
      const isMobile = window.innerWidth < 768;
      dispatch.app.setSidebarMobile(isMobile);
      
      if (isMobile) {
        dispatch.app.setSidebarCollapsed(true);
      }
    },
    
    // Update page context
    async updatePageContext(payload: { page: string; breadcrumbs: AppState['breadcrumbs'] }) {
      dispatch.app.setCurrentPage(payload.page);
      dispatch.app.setBreadcrumbs(payload.breadcrumbs);
      
      // Update document title
      const pageTitle = payload.breadcrumbs
        .filter(b => !b.current)
        .map(b => b.label)
        .join(' / ');
      
      document.title = pageTitle 
        ? `${pageTitle} - Laravel Accounting Platform`
        : 'Laravel Accounting Platform';
    },
    
    // Handle global keyboard shortcuts
    async handleKeyboardShortcut(payload: { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }) {
      const { key, ctrlKey, altKey, shiftKey } = payload;
      
      // Ctrl/Cmd + K for global search
      if ((ctrlKey || altKey) && key === 'k') {
        dispatch.app.setGlobalSearchOpen(true);
        return;
      }
      
      // Escape to close modals/search
      if (key === 'Escape') {
        const state = this as AppState;
        if (state.globalSearchOpen) {
          dispatch.app.setGlobalSearchOpen(false);
        } else if (state.activeModal) {
          dispatch.app.closeModal();
        }
        return;
      }
      
      // Ctrl/Cmd + B to toggle sidebar
      if ((ctrlKey || altKey) && key === 'b') {
        dispatch.app.toggleSidebar();
        return;
      }
    },
  }),
});
