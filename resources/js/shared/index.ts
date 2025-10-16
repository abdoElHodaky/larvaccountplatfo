/**
 * Shared Module Index
 * Centralized exports for all shared utilities, services, and assets
 */

// Performance Utilities
export * from './utils/performance';
export * from './utils/performance/debounce';
export * from './utils/performance/memoization';
export * from './utils/performance/comparison';
export * from './utils/performance/reactUtils';
export * from './utils/performance/financialUtils';
export * from './utils/performance/monitor';

// Legacy Performance Export (backward compatibility)
export * from './utils/Debounce';

// Services
export * from './services/analytics/metricsCollector';
export * from './services/analytics/analyticsReporter';
export * from './services/analytics/performanceMonitor';

// Assets
export * from './assets/icons';
export * from './assets/animations';

// Types (if any shared types exist)
export * from './types';

// Hooks (if any shared hooks exist)
export * from './hooks';

// Constants
export const SHARED_CONSTANTS = {
  // Performance
  DEFAULT_DEBOUNCE_DELAY: 300,
  DEFAULT_THROTTLE_LIMIT: 100,
  DEFAULT_CACHE_SIZE: 100,
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
  
  // Analytics
  DEFAULT_BATCH_SIZE: 100,
  DEFAULT_FLUSH_INTERVAL: 30000, // 30 seconds
  
  // UI
  DEFAULT_ANIMATION_DURATION: 300,
  DEFAULT_TRANSITION_EASE: 'ease-in-out',
  
  // Financial
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US',
  DEFAULT_DECIMAL_PLACES: 2
};

// Utility Functions
export const SharedUtils = {
  /**
   * Format currency with default settings
   */
  formatCurrency: (amount: number, currency?: string, locale?: string) => {
    return new Intl.NumberFormat(locale || SHARED_CONSTANTS.DEFAULT_LOCALE, {
      style: 'currency',
      currency: currency || SHARED_CONSTANTS.DEFAULT_CURRENCY,
    }).format(amount);
  },
  
  /**
   * Format percentage
   */
  formatPercentage: (value: number, decimals?: number, locale?: string) => {
    return new Intl.NumberFormat(locale || SHARED_CONSTANTS.DEFAULT_LOCALE, {
      style: 'percent',
      minimumFractionDigits: decimals || SHARED_CONSTANTS.DEFAULT_DECIMAL_PLACES,
      maximumFractionDigits: decimals || SHARED_CONSTANTS.DEFAULT_DECIMAL_PLACES,
    }).format(value / 100);
  },
  
  /**
   * Generate unique ID
   */
  generateId: (prefix?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return prefix ? `${prefix}_${id}` : id;
  },
  
  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => SharedUtils.deepClone(item)) as unknown as T;
    if (typeof obj === 'object') {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = SharedUtils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    return obj;
  },
  
  /**
   * Capitalize first letter
   */
  capitalize: (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  /**
   * Convert camelCase to kebab-case
   */
  camelToKebab: (str: string) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  },
  
  /**
   * Convert kebab-case to camelCase
   */
  kebabToCamel: (str: string) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },
  
  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
  },
  
  /**
   * Check if value is empty
   */
  isEmpty: (value: any) => {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

