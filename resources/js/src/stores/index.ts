/**
 * Rematch Store Configuration
 * Centralized state management with Rematch
 */

import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import loadingPlugin from '@rematch/loading';
import persistPlugin from '@rematch/persist';
import { auth } from './models/auth';
import { app } from './models/app';
import { financial } from './models/financial';
import { tenant } from './models/tenant';

// Define models
export const models = {
  auth,
  app,
  financial,
  tenant,
};

export type RootModel = typeof models;

// Configure plugins
const persistConfig = {
  key: 'laravel-accounting-platform',
  storage: localStorage,
  whitelist: ['auth', 'app'], // Only persist auth and app state
  version: 1,
};

// Initialize store with plugins
export const store = init<RootModel>({
  models,
  plugins: [
    loadingPlugin(),
    persistPlugin(persistConfig),
  ],
  redux: {
    devtoolOptions: {
      name: 'Laravel Accounting Platform',
      trace: process.env.NODE_ENV === 'development',
    },
  },
});

// Export types for TypeScript
export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel>;

// Export store instance
export default store;
