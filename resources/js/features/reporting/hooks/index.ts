/**
 * Reporting Hooks Index
 * Hooks specific to reporting and analytics features
 * 
 * Note: useChartData and useReportBuilder have been moved to @/shared/hooks
 * for better reusability across the application.
 */

// Re-export from shared hooks for backward compatibility
export {
  useChartData,
  useReportBuilder,
  type ChartDataOptions,
  type ChartDataReturn,
  type ReportBuilderOptions,
  type ReportBuilderReturn,
} from '@/shared/hooks';
