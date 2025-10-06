/**
 * Custom Hooks Index
 * Performance-optimized React hooks for the accounting platform
 */

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedSearch,
  useDebouncedEffect,
} from './useDebounce';

export {
  useMemoizedCallback,
  useStableCallback,
  useOptimizedCallback,
  useThrottledCallback,
  useMemoizedEventHandler,
  useMemoizedClickHandler,
  useAsyncCallback,
} from './useMemoizedCallback';

export {
  useFormValidation,
  type ValidationRule,
  type ValidationRules,
  type FormErrors,
  type FormTouched,
  type UseFormValidationOptions,
  type UseFormValidationReturn,
} from './useFormValidation';

// Default exports
export { default as useDebounce } from './useDebounce';
export { default as useMemoizedCallback } from './useMemoizedCallback';
export { default as useFormValidation } from './useFormValidation';
