/**
 * App Rematch Model
 * Global application state management with Rematch
 */

import { createModel } from '@rematch/core';

// Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: 'US' | 'EU' | 'IN';
  compactMode: boolean;
  animations: boolean;
  soundEffects: boolean;
}

export interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobile: boolean;
  fullscreen: boolean;
  loading: boolean;
  pageTitle: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export interface AppState {
  settings: AppSettings;
  ui: UIState;
  notifications: Notification[];
  isOnline: boolean;
  wsConnected: boolean;
  performanceMetrics: {
    renderTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    lastUpdated: string;
  };
}

// Default state
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
  currency: 'USD',
  numberFormat: 'US',
  compactMode: false,
  animations: true,
  soundEffects: false,
};

const defaultUIState: UIState = {
  sidebarCollapsed: false,
  sidebarMobile: false,
  fullscreen: false,
  loading: false,
  pageTitle: 'Dashboard',
  breadcrumbs: [{ label: 'Dashboard', current: true }],
};

const initialState: AppState = {
  settings: defaultSettings,
  ui: defaultUIState,
  notifications: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  wsConnected: false,
  performanceMetrics: {
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    lastUpdated: new Date().toISOString(),
  },
};

// Helper function for theme application
const applyTheme = (theme: AppSettings['theme']) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
};

// Generate unique ID for notifications
const generateId = () => Math.random().toString(36).substr(2, 9);

export const appModel = createModel()({
  state: initialState,
  
  reducers: {
    // Settings reducers
    updateSettings: (state, payload: Partial<AppSettings>) => ({
      ...state,
      settings: { ...state.settings, ...payload },
    }),
    
    // UI reducers
    toggleSidebar: (state) => ({
      ...state,
      ui: {
        ...state.ui,
        sidebarCollapsed: !state.ui.sidebarCollapsed,
      },
    }),
    
    setSidebarMobile: (state, payload: boolean) => ({
      ...state,
      ui: {
        ...state.ui,
        sidebarMobile: payload,
      },
    }),
    
    toggleFullscreen: (state) => ({
      ...state,
      ui: {
        ...state.ui,
        fullscreen: !state.ui.fullscreen,
      },
    }),
    
    setLoading: (state, payload: boolean) => ({
      ...state,
      ui: {
        ...state.ui,
        loading: payload,
      },
    }),
    
    setPageTitle: (state, payload: string) => ({
      ...state,
      ui: {
        ...state.ui,
        pageTitle: payload,
      },
    }),
    
    setBreadcrumbs: (state, payload: UIState['breadcrumbs']) => ({
      ...state,
      ui: {
        ...state.ui,
        breadcrumbs: payload,
      },
    }),
    
    // Notification reducers
    addNotification: (state, payload: Omit<Notification, 'id' | 'createdAt'>) => {
      const notification: Notification = {
        ...payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
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
    
    // Connection status reducers
    setOnlineStatus: (state, payload: boolean) => ({
      ...state,
      isOnline: payload,
    }),
    
    setWebSocketStatus: (state, payload: boolean) => ({
      ...state,
      wsConnected: payload,
    }),
    
    // Performance reducers
    updatePerformanceMetrics: (state, payload: Partial<AppState['performanceMetrics']>) => ({
      ...state,
      performanceMetrics: {
        ...state.performanceMetrics,
        ...payload,
        lastUpdated: new Date().toISOString(),
      },
    }),
    
    // Reset reducer
    resetApp: () => initialState,
  },
  
  effects: (dispatch) => ({
    // Theme effect with side effects
    async updateTheme(theme: AppSettings['theme']) {
      dispatch.app.updateSettings({ theme });
      applyTheme(theme);
    },
    
    // Auto-remove notifications after duration
    async addTimedNotification(payload: Omit<Notification, 'id' | 'createdAt'>) {
      const id = dispatch.app.addNotification(payload);
      
      if (payload.duration && payload.duration > 0 && !payload.persistent) {
        setTimeout(() => {
          dispatch.app.removeNotification(id);
        }, payload.duration);
      }
      
      return id;
    },
    
    // Initialize app with system preferences
    async initializeApp() {
      // Set online status
      if (typeof navigator !== 'undefined') {
        dispatch.app.setOnlineStatus(navigator.onLine);
        
        // Listen for online/offline events
        window.addEventListener('online', () => dispatch.app.setOnlineStatus(true));
        window.addEventListener('offline', () => dispatch.app.setOnlineStatus(false));
      }
      
      // Apply initial theme
      const currentTheme = this.getState().app.settings.theme;
      applyTheme(currentTheme);
      
      // Initialize performance monitoring
      if (typeof performance !== 'undefined') {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          dispatch.app.updatePerformanceMetrics({
            memoryUsage: memoryInfo.usedJSHeapSize,
          });
        }
      }
    },
    
    // Performance tracking
    async trackRenderTime(renderTime: number) {
      dispatch.app.updatePerformanceMetrics({ renderTime });
    },
    
    async trackApiResponseTime(responseTime: number) {
      dispatch.app.updatePerformanceMetrics({ apiResponseTime: responseTime });
    },
  }),
});

export type AppModel = typeof appModel;
