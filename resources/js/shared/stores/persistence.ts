/**
 * State Persistence Configuration
 * Handles state hydration and persistence with Rematch
 */

import { getPersistor } from '@rematch/persist';
import type { RootState } from './index';

// Storage configuration
const storage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      const item = localStorage.getItem(key);
      return Promise.resolve(item);
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error);
      return Promise.resolve(null);
    }
  },
  
  setItem: (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error);
      return Promise.resolve();
    }
  },
  
  removeItem: (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error);
      return Promise.resolve();
    }
  },
};

// Persistence configuration
export const persistConfig = {
  key: 'larv-account-platform',
  storage,
  version: 1,
  
  // Whitelist - only persist these reducers
  whitelist: ['auth', 'app'],
  
  // Blacklist - never persist these reducers
  blacklist: [],
  
  // Transform functions for serialization/deserialization
  transforms: [
    // Transform for auth state
    {
      in: (inboundState: any, key: string) => {
        if (key === 'auth') {
          // Don't persist sensitive token data in some cases
          const { token, ...rest } = inboundState;
          return {
            ...rest,
            // Only persist token if remember me is enabled
            token: inboundState.rememberMe ? token : null,
          };
        }
        return inboundState;
      },
      out: (outboundState: any, key: string) => {
        if (key === 'auth') {
          // Validate token on hydration
          if (outboundState.token && outboundState.user) {
            // Could add token validation logic here
            return outboundState;
          }
          // Clear invalid auth state
          return {
            ...outboundState,
            isAuthenticated: false,
            user: null,
            token: null,
          };
        }
        return outboundState;
      },
    },
    
    // Transform for app state
    {
      in: (inboundState: any, key: string) => {
        if (key === 'app') {
          // Don't persist loading states or errors
          const { loading, error, ...rest } = inboundState;
          return rest;
        }
        return inboundState;
      },
      out: (outboundState: any, key: string) => {
        if (key === 'app') {
          // Reset transient state on hydration
          return {
            ...outboundState,
            loading: false,
            error: null,
          };
        }
        return outboundState;
      },
    },
  ],
  
  // Migration function for version updates
  migrate: (persistedState: any, currentVersion: number) => {
    if (persistedState._persist?.version !== currentVersion) {
      console.log('Migrating persisted state from version', persistedState._persist?.version, 'to', currentVersion);
      
      // Handle version migrations
      switch (persistedState._persist?.version) {
        case undefined:
        case 0:
          // Migration from v0 to v1
          return {
            ...persistedState,
            app: {
              ...persistedState.app,
              theme: persistedState.app?.theme || 'light',
              language: persistedState.app?.language || 'en',
            },
          };
        default:
          return persistedState;
      }
    }
    
    return persistedState;
  },
  
  // Throttle writes to storage
  throttle: 1000,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
};

// Selective persistence for different features
export const featurePersistConfigs = {
  // Accounting feature persistence
  accounting: {
    key: 'larv-accounting',
    storage,
    whitelist: ['filters', 'currentView'],
    blacklist: ['accounts', 'transactions', 'journalEntries', 'loading', 'error'],
    transforms: [
      {
        in: (inboundState: any) => {
          // Only persist UI preferences
          const { filters, currentView } = inboundState;
          return { filters, currentView };
        },
        out: (outboundState: any) => {
          // Merge with default state
          return {
            accounts: [],
            transactions: [],
            journalEntries: [],
            selectedAccount: null,
            selectedTransaction: null,
            selectedJournalEntry: null,
            accountsLoading: false,
            transactionsLoading: false,
            journalEntriesLoading: false,
            error: null,
            ...outboundState,
          };
        },
      },
    ],
  },
  
  // Inventory feature persistence
  inventory: {
    key: 'larv-inventory',
    storage,
    whitelist: ['filters', 'currentView'],
    blacklist: ['items', 'stockMovements', 'loading', 'error'],
    transforms: [
      {
        in: (inboundState: any) => {
          const { filters, currentView } = inboundState;
          return { filters, currentView };
        },
        out: (outboundState: any) => {
          return {
            items: [],
            stockMovements: [],
            selectedItem: null,
            selectedMovement: null,
            itemsLoading: false,
            movementsLoading: false,
            categories: [],
            warehouses: [],
            error: null,
            ...outboundState,
          };
        },
      },
    ],
  },
};

// Utility functions for persistence management
export const persistenceUtils = {
  // Clear all persisted data
  clearAll: async () => {
    try {
      await storage.removeItem('persist:' + persistConfig.key);
      await storage.removeItem('persist:' + featurePersistConfigs.accounting.key);
      await storage.removeItem('persist:' + featurePersistConfigs.inventory.key);
      console.log('All persisted data cleared');
    } catch (error) {
      console.error('Failed to clear persisted data:', error);
    }
  },
  
  // Clear specific feature data
  clearFeature: async (feature: keyof typeof featurePersistConfigs) => {
    try {
      await storage.removeItem('persist:' + featurePersistConfigs[feature].key);
      console.log(`Persisted data for ${feature} cleared`);
    } catch (error) {
      console.error(`Failed to clear persisted data for ${feature}:`, error);
    }
  },
  
  // Get persisted data size
  getStorageSize: async (): Promise<number> => {
    try {
      let totalSize = 0;
      const keys = [
        'persist:' + persistConfig.key,
        'persist:' + featurePersistConfigs.accounting.key,
        'persist:' + featurePersistConfigs.inventory.key,
      ];
      
      for (const key of keys) {
        const data = await storage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  },
  
  // Check if storage is available
  isStorageAvailable: (): boolean => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Export persisted data
  exportData: async (): Promise<string> => {
    try {
      const data: Record<string, any> = {};
      const keys = [
        'persist:' + persistConfig.key,
        'persist:' + featurePersistConfigs.accounting.key,
        'persist:' + featurePersistConfigs.inventory.key,
      ];
      
      for (const key of keys) {
        const value = await storage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },
  
  // Import persisted data
  importData: async (dataString: string): Promise<void> => {
    try {
      const data = JSON.parse(dataString);
      
      for (const [key, value] of Object.entries(data)) {
        await storage.setItem(key, JSON.stringify(value));
      }
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  },
};

// React hook for persistence utilities
export const usePersistence = () => {
  return {
    clearAll: persistenceUtils.clearAll,
    clearFeature: persistenceUtils.clearFeature,
    getStorageSize: persistenceUtils.getStorageSize,
    isStorageAvailable: persistenceUtils.isStorageAvailable,
    exportData: persistenceUtils.exportData,
    importData: persistenceUtils.importData,
  };
};

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Add persistence utilities to window for debugging
  (window as any).__persistenceUtils = persistenceUtils;
  
  // Log persistence events
  const originalSetItem = storage.setItem;
  storage.setItem = async (key: string, value: string) => {
    console.log(`[Persistence] Setting ${key}:`, JSON.parse(value));
    return originalSetItem(key, value);
  };
}

export default persistConfig;
