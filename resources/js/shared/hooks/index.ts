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

// Advanced Hooks (migrated from src/)
export * from './useAlovaAdvanced';
export * from './useGraphQL';
export * from './useRealTime';
export * from './useRealTimeNotifications';
export * from './useRematchStore';

export { useChartData, type ChartDataOptions, type UseChartDataReturn } from './useChartData';

export {
    useReportBuilder,
    type UseReportBuilderOptions,
    type UseReportBuilderReturn,
} from './useReportBuilder';
