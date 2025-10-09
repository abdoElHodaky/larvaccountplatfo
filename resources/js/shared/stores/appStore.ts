/**
 * Application Store with Zustand
 * Global application state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
  // Settings
  settings: AppSettings;
  
  // UI State
  ui: UIState;
  
  // Notifications
  notifications: Notification[];
  
  // Connection Status
  isOnline: boolean;
  wsConnected: boolean;
  
  // Performance
  performanceMetrics: {
    renderTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    lastUpdated: string;
  };
  
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setSidebarMobile: (open: boolean) => void;
  toggleFullscreen: () => void;
  setLoading: (loading: boolean) => void;
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setOnlineStatus: (online: boolean) => void;
  setWebSocketStatus: (connected: boolean) => void;
  updatePerformanceMetrics: (metrics: Partial<AppState['performanceMetrics']>) => void;
  resetApp: () => void;
}

// Default settings
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

// Create the app store
export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      settings: defaultSettings,
      ui: defaultUIState,
      notifications: [],
      isOnline: navigator.onLine,
      wsConnected: false,
      performanceMetrics: {
        renderTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        lastUpdated: new Date().toISOString(),
      },

      // Actions
      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => {
          state.settings = { ...state.settings, ...newSettings };
        });

        // Apply theme changes immediately
        if (newSettings.theme) {
          applyTheme(newSettings.theme);
        }
      },

      toggleSidebar: () => {
        set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
        });
      },

      setSidebarMobile: (open: boolean) => {
        set((state) => {
          state.ui.sidebarMobile = open;
        });
      },

      toggleFullscreen: () => {
        set((state) => {
          state.ui.fullscreen = !state.ui.fullscreen;
        });

        // Handle browser fullscreen API
        const { ui } = get();
        if (ui.fullscreen) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.ui.loading = loading;
        });
      },

      setPageTitle: (title: string) => {
        set((state) => {
          state.ui.pageTitle = title;
        });
        
        // Update document title
        document.title = `${title} - Laravel Accounting Platform`;
      },

      setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => {
        set((state) => {
          state.ui.breadcrumbs = breadcrumbs;
        });
      },

      addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => {
          state.notifications.push({
            ...notification,
            id,
            createdAt: new Date().toISOString(),
          });
        });

        // Auto-remove notification after duration
        if (!notification.persistent && notification.duration !== 0) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }

        return id;
      },

      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      setOnlineStatus: (online: boolean) => {
        set((state) => {
          state.isOnline = online;
        });

        // Show notification when going offline/online
        if (online) {
          get().addNotification({
            type: 'success',
            title: 'Connection Restored',
            message: 'You are back online',
            duration: 3000,
          });
        } else {
          get().addNotification({
            type: 'warning',
            title: 'Connection Lost',
            message: 'You are currently offline',
            persistent: true,
          });
        }
      },

      setWebSocketStatus: (connected: boolean) => {
        set((state) => {
          state.wsConnected = connected;
        });
      },

      updatePerformanceMetrics: (metrics: Partial<AppState['performanceMetrics']>) => {
        set((state) => {
          state.performanceMetrics = {
            ...state.performanceMetrics,
            ...metrics,
            lastUpdated: new Date().toISOString(),
          };
        });
      },

      resetApp: () => {
        set((state) => {
          state.settings = defaultSettings;
          state.ui = defaultUIState;
          state.notifications = [];
          state.performanceMetrics = {
            renderTime: 0,
            apiResponseTime: 0,
            memoryUsage: 0,
            lastUpdated: new Date().toISOString(),
          };
        });
      },
    })),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        ui: {
          sidebarCollapsed: state.ui.sidebarCollapsed,
        },
      }),
    }
  )
);

// Helper function to apply theme
function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Initialize theme on store creation
applyTheme(defaultSettings.theme);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { settings } = useAppStore.getState();
    if (settings.theme === 'system') {
      applyTheme('system');
    }
  });

  // Listen for online/offline events
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    useAppStore.setState((state) => {
      state.ui.fullscreen = isFullscreen;
    });
  });
}

// Selectors for better performance
export const useAppSettings = () => useAppStore((state) => state.settings);

export const useUIState = () => useAppStore((state) => state.ui);

export const useNotifications = () => useAppStore((state) => state.notifications);

export const useConnectionStatus = () => useAppStore((state) => ({
  isOnline: state.isOnline,
  wsConnected: state.wsConnected,
}));

export const usePerformanceMetrics = () => useAppStore((state) => state.performanceMetrics);

export const useAppActions = () => useAppStore((state) => ({
  updateSettings: state.updateSettings,
  toggleSidebar: state.toggleSidebar,
  setSidebarMobile: state.setSidebarMobile,
  toggleFullscreen: state.toggleFullscreen,
  setLoading: state.setLoading,
  setPageTitle: state.setPageTitle,
  setBreadcrumbs: state.setBreadcrumbs,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  updatePerformanceMetrics: state.updatePerformanceMetrics,
}));

