/**
 * App Rematch Model
 * Manages global application state
 */

import { createModel } from '@rematch/core';
import { PATTERNS, Notification, NotificationAction } from '@/shared/types/PATTERNS';

// Types
export interface AppState {
  // Add your global state properties here
  isInitialized: boolean;
  theme: 'light' | 'dark';
  colorMode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  modals: any[];
  features: Record<string, boolean>;
  breadcrumbs: any[];
  // ... other global state properties
}

const initialState: AppState = {
  isInitialized: false,
  theme: 'light',
  colorMode: 'light',
  sidebarCollapsed: false,
  notifications: [],
  // ... other initial state values
};

export const appModel = createModel<AppState>()({
  name: 'app',
  state: initialState,

  reducers: {
    setInitialized: (state) => ({
      ...state,
      isInitialized: true,
    }),

    setTheme: (state, theme: 'light' | 'dark') => ({
      ...state,
      theme: theme,
    }),

    setColorMode: (state, colorMode: 'light' | 'dark') => ({
      ...state,
      colorMode: colorMode,
    }),

    setSidebarOpen: (state, open: boolean) => ({
      ...state,
      sidebarCollapsed: !open,
    }),

    updateTheme: (state, theme: 'light' | 'dark') => ({
      ...state,
      theme: theme,
      colorMode: theme,
    }),

    toggleSidebar: (state) => ({
      ...state,
      sidebarCollapsed: !state.sidebarCollapsed,
    }),

    // Notification reducers
    showNotification: (state, notification: Notification) => ({
      ...state,
      notifications: [...state.notifications, notification],
    }),

    removeNotification: (state, id: string) => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id),
    }),

    clearNotifications: (state) => ({
      ...state,
      notifications: [],
    }),
    // ... other reducers
  },

  // Add effects if needed
  effects: (dispatch) => ({
    // Notification effects
    showSuccess: (_, payload: { title: string; message?: string; actions?: any[] }) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'success',
        title: payload.title,
        message: payload.message || '',
        actions: payload.actions || [],
        createdAt: new Date().toISOString(),
      };
      dispatch.app.showNotification(notification);
    },

    showError: (_, payload: { title: string; message?: string; actions?: any[] }) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'error',
        title: payload.title,
        message: payload.message || '',
        actions: payload.actions || [],
        createdAt: new Date().toISOString(),
      };
      dispatch.app.showNotification(notification);
    },

    showWarning: (_, payload: { title: string; message?: string; actions?: any[] }) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'warning',
        title: payload.title,
        message: payload.message || '',
        actions: payload.actions || [],
      };
      dispatch.app.showNotification(notification);
    },

    showInfo: (_, payload: { title: string; message?: string; actions?: any[] }) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'info',
        title: payload.title,
        message: payload.message || '',
        actions: payload.actions || [],
      };
      dispatch.app.showNotification(notification);
    },

    initializeTheme: (state) => {
      // Initialize theme based on system preference or saved preference
      // This would typically check localStorage or system preferences
      // For now, we'll just set initialized flag
      dispatch.app.setInitialized();
    },
  }),
});

export type AppModel = typeof appModel;