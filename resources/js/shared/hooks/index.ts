/**
 * Shared Hooks Index
 * General-purpose React hooks
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

export {
  useChartData,
  type ChartDataOptions,
  type ChartDataReturn,
} from './useChartData';

export {
  useReportBuilder,
  type ReportBuilderOptions,
  type ReportBuilderReturn,
} from './useReportBuilder';

// Default exports
export { default as useDebounce } from './useDebounce';
export { default as useMemoizedCallback } from './useMemoizedCallback';
export { default as useFormValidation } from './useFormValidation';
export { default as useChartData } from './useChartData';
export { default as useReportBuilder } from './useReportBuilder';
