/**
 * Reporting Hooks Index
 * Hooks specific to reporting and analytics features
 */

export {
  useChartData,
  useFinancialTimeSeriesData,
  useFinancialCategoricalData,
  type ChartDataOptions,
  type UseChartDataReturn,
} from './useChartData';

export {
  useReportBuilder,
  type ReportWidget,
  type ReportTemplate,
  type UseReportBuilderOptions,
  type UseReportBuilderReturn,
} from './useReportBuilder';

// Default exports
export { default as useChartData } from './useChartData';
export { default as useReportBuilder } from './useReportBuilder';
