/**
 * Rematch Store Configuration
 * 
 * This module configures and exports the main Rematch store with all models.
 * Centralized state management for the application.
 */

import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import persistPlugin from '@rematch/persist';
import loadingPlugin, { ExtraModelsFromLoading } from '@rematch/loading';
import { appModel, type AppModel } from './models/appModel';
import { authModel, type AuthModel } from './models/authModel';
import { accountingModel, type AccountingModel } from '../../features/accounting/stores/accountingModel';

// Define the models interface
export interface RootModel {
  app: AppModel;
  auth: AuthModel;
  accounting: AccountingModel;
}

// Create the models object
const models: RootModel = {
  app: appModel,
  auth: authModel,
  accounting: accountingModel,
};

// Configure the store
export const store = init<RootModel, ExtraModelsFromLoading<RootModel>>({
  models,
  plugins: [
    loadingPlugin(),
    persistPlugin({
      key: 'laravel-accounting-platform',
      storage: 'localStorage',
      whitelist: ['app', 'auth'],
      version: 1,
    }),
  ],
  redux: {
    devtoolOptions: {
      disabled: process.env.NODE_ENV === 'production',
    },
  },
});

// Export types
export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, ExtraModelsFromLoading<RootModel>>;

// Export models for type inference
export { appModel, authModel, accountingModel };
export type { AppModel, AuthModel, AccountingModel };

// Export model types
export type { AppState, AppSettings, UIState, Notification } from './models/appModel';
export type { AuthState, User, Tenant, UserTenant, RegisterData } from './models/authModel';
export type { AccountingState, Account, Transaction, JournalEntry, AccountingFilters } from '../../features/accounting/stores/accountingModel';
