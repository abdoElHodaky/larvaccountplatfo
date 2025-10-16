/**
 * Performance Utilities Index
 * Consolidated exports for all performance-related utilities
 */

// Debounce and throttling utilities
export {
  debounce,
  throttle,
  advancedDebounce
} from './debounce';

// Memoization utilities
export {
  memoize,
  memoizeLRU,
  memoizeWithTTL,
  memoizeWeak,
  memoizeAsync
} from './memoization';

// Comparison utilities
export { deepEqual, shallowEqual } from './comparison';

// React performance utilities
export {
  ReactPerformanceUtils,
  usePerformanceMonitor,
  withPerformanceTracking
} from './reactUtils';

// Financial performance utilities
export { FinancialPerformanceUtils } from './financialUtils';

// Performance monitoring
export { PerformanceMonitor } from './monitor';

// Re-export everything as default for backward compatibility
import { debounce, throttle } from './debounce';
import { memoize } from './memoization';

export default {
  debounce,
  throttle,
  memoize,
  // Add other utilities as needed
};

