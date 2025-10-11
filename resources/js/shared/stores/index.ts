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
import {
    accountingModel,
    type AccountingModel,
} from '../../features/accounting/stores/accountingModel';
import {
    inventoryModel,
    type InventoryModel,
} from '../../features/inventory/stores/inventoryModel';
import {
    dashboardModel,
    type DashboardModel,
} from '../../features/dashboard/stores/dashboardModel';

// Import persistence configuration and dev tools
import persistConfig from './persistence';
import { setDevToolsStore } from '../utils/devTools';

// Define the models interface
export interface RootModel {
    app: AppModel;
    auth: AuthModel;
    accounting: AccountingModel;
    inventory: InventoryModel;
    dashboard: DashboardModel;
}

// Create the models object
const models: RootModel = {
    app: appModel,
    auth: authModel,
    accounting: accountingModel,
    inventory: inventoryModel,
    dashboard: dashboardModel,
};

// Configure the store
export const store = init<RootModel, ExtraModelsFromLoading<RootModel>>({
    models,
    plugins: [loadingPlugin(), persistPlugin(persistConfig)],
    redux: {
        devtoolOptions: {
            name: 'Laravel Account Platform',
            disabled: process.env.NODE_ENV === 'production',
            trace: process.env.NODE_ENV === 'development',
            traceLimit: 25,
        },
    },
});

// Initialize dev tools in development
if (process.env.NODE_ENV === 'development') {
    setDevToolsStore(store);
}

// Export types
export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, ExtraModelsFromLoading<RootModel>>;

// Export models for type inference
export { appModel, authModel, accountingModel, inventoryModel, dashboardModel };
export type { AppModel, AuthModel, AccountingModel, InventoryModel, DashboardModel };

// Export models object for testing
export { models };

// Export model types
export type { AppState, AppSettings, UIState, Notification } from './models/appModel';
export type { AuthState, User, Tenant, UserTenant, RegisterData } from './models/authModel';
export type {
    AccountingState,
    Account,
    Transaction,
    JournalEntry,
    Filters,
} from '../../features/accounting/stores/accountingModel';
export type {
    InventoryState,
    InventoryItem,
    StockMovement,
    InventoryFilters,
} from '../../features/inventory/stores/inventoryModel';
export type {
    DashboardState,
    Widget,
    DashboardLayout,
    MetricData,
    ChartData,
    DashboardFilters,
} from '../../features/dashboard/stores/dashboardModel';
