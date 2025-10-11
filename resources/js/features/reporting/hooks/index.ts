/**
 * Reporting Hooks Index
 * Phase 5+9: Advanced reporting hooks with AlovaJS integration
 */

// Phase 5+9: Modern reporting data hooks
export * from './useReportingData';

// Re-export from shared hooks for backward compatibility
export {
  useChartData,
  useReportBuilder,
  type ChartDataOptions,
  type ChartDataReturn,
  type ReportBuilderOptions,
  type ReportBuilderReturn,
} from '@/shared/hooks';
