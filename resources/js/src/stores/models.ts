/**
 * Rematch Models
 * State models for the application
 */

import { Models } from '@rematch/core';

// Auth model
export interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const auth = {
  state: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  } as AuthState,
  reducers: {
    setUser: (state: AuthState, payload: any) => ({
      ...state,
      user: payload,
      isAuthenticated: !!payload,
    }),
    setToken: (state: AuthState, payload: string | null) => ({
      ...state,
      token: payload,
    }),
    setLoading: (state: AuthState, payload: boolean) => ({
      ...state,
      loading: payload,
    }),
    logout: (state: AuthState) => ({
      ...state,
      user: null,
      token: null,
      isAuthenticated: false,
    }),
  },
  effects: (dispatch: any) => ({
    // Add async effects here
  }),
};

// App model
export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: any[];
}

export const app = {
  state: {
    theme: 'light',
    sidebarOpen: true,
    notifications: [],
  } as AppState,
  reducers: {
    setTheme: (state: AppState, payload: 'light' | 'dark') => ({
      ...state,
      theme: payload,
    }),
    setSidebarOpen: (state: AppState, payload: boolean) => ({
      ...state,
      sidebarOpen: payload,
    }),
    addNotification: (state: AppState, payload: any) => ({
      ...state,
      notifications: [...state.notifications, payload],
    }),
    removeNotification: (state: AppState, payload: string) => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== payload),
    }),
  },
};

// Export models
export const models: Models<RootModel> = {
  auth,
  app,
};

// Export root model type
export interface RootModel extends Models<RootModel> {
  auth: typeof auth;
  app: typeof app;
}
