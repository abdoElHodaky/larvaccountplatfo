/**
 * Charts Components Index
 * Performance-optimized chart components for financial data visualization
 */

export { 
  ChartContainer, 
  FinancialChartContainer, 
  CompactChartContainer,
  type ChartContainerProps 
} from './ChartContainer';

export { 
  LineChart, 
  FinancialLineChart,
  type LineChartProps,
  type LineChartDataPoint,
  type LineChartSeries 
} from './LineChart';

export { 
  BarChart, 
  FinancialBarChart, 
  ProfitLossBarChart,
  type BarChartProps,
  type BarChartDataPoint,
  type BarChartSeries 
} from './BarChart';

export { 
  PieChart, 
  FinancialPieChart, 
  DonutChart, 
  FinancialDonutChart,
  type PieChartProps,
  type PieChartDataPoint 
} from './PieChart';

// Default exports
export { default as ChartContainer } from './ChartContainer';
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';
