/**
 * App Rematch Model
 * Manages global application state
 */

import { createModel } from '@rematch/core';
import { PATTERNS } from '@/shared/types/PATTERNS';

// Types
export interface AppState {
  // Add your global state properties here
  isInitialized: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  // ... other global state properties
}

const initialState: AppState = {
  isInitialized: false,
  theme: 'light',
  sidebarCollapsed: false,
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

    toggleSidebar: (state) => ({
      ...state,
      sidebarCollapsed: !state.sidebarCollapsed,
    }),
    // ... other reducers
  },

  // Add effects if needed
  effects: (dispatch) => ({
    // Add effects here
  }),
});

export type AppModel = typeof appModel;