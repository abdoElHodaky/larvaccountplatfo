import React, { memo, useMemo, useRef } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useColorModeValue } from '@chakra-ui/react';
import { ChartContainer, ChartContainerProps } from './ChartContainer';
import { useMemoizedCallback } from '@/shared/hooks';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

/**
 * Performance-Optimized Pie Chart Component
 * Specialized for financial proportion data with interactive features
 */

export interface PieChartDataPoint {
  [key: string]: any;
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps extends Omit<ChartContainerProps, 'children'> {
  data: PieChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  formatValue?: (value: any) => string;
  formatTooltip?: (value: any, name: string) => [string, string];
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  startAngle?: number;
  endAngle?: number;
  animationDuration?: number;
  colorScheme?: 'default' | 'financial' | 'profit-loss' | 'asset-liability';
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const PieChart: React.FC<PieChartProps> = memo(({
  data,
  dataKey = 'value',
  nameKey = 'name',
  formatValue,
  formatTooltip,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  showPercentage = true,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 0,
  startAngle = 90,
  endAngle = 450,
  animationDuration = 300,
  colorScheme = 'default',
  legendPosition = 'bottom',
  ...containerProps
}) => {
  const chartRef = useRef<SVGSVGElement>(null);

  // Memoized color values
  const textColor = useColorModeValue('#4a5568', '#a0aec0');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');

  // Memoized color schemes
  const colorSchemes = useMemo(() => ({
    default: [
      '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5',
      '#dd6b20', '#319795', '#c53030', '#9f7aea', '#2b6cb0'
    ],
    financial: [
      '#38a169', // Assets (green)
      '#e53e3e', // Liabilities (red)
      '#3182ce', // Equity (blue)
      '#d69e2e', // Revenue (yellow)
      '#dd6b20', // Expenses (orange)
      '#319795', // Cash (teal)
      '#805ad5', // Investments (purple)
    ],
    'profit-loss': [
      '#38a169', // Profit (green)
      '#e53e3e', // Loss (red)
    ],
    'asset-liability': [
      '#38a169', // Assets (green)
      '#e53e3e', // Liabilities (red)
      '#3182ce', // Equity (blue)
    ],
  }), []);

  // Memoized processed data with colors and percentages
  const processedData = useMemo(() => {
    const colors = colorSchemes[colorScheme];
    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
    
    return data.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length],
      percentage: total > 0 ? ((item[dataKey] || 0) / total) * 100 : 0,
    }));
  }, [data, colorSchemes, colorScheme, dataKey]);

  // Memoized value formatter
  const valueFormatter = useMemoizedCallback((value: any) => {
    if (formatValue) {
      return formatValue(value);
    }
    
    // Default financial formatting
    if (typeof value === 'number') {
      return FinancialPerformanceUtils.formatCurrency(value, 'USD');
    }
    
    return String(value);
  }, [formatValue]);

  // Memoized tooltip formatter
  const tooltipFormatter = useMemoizedCallback((value: any, name: string) => {
    if (formatTooltip) {
      return formatTooltip(value, name);
    }
    
    // Default financial formatting with percentage
    if (typeof value === 'number') {
      const item = processedData.find(d => d[nameKey] === name);
      const percentage = item ? item.percentage : 0;
      
      return [
        `${FinancialPerformanceUtils.formatCurrency(value, 'USD')} (${percentage.toFixed(1)}%)`,
        name
      ];
    }
    
    return [String(value), name];
  }, [formatTooltip, processedData, nameKey]);

  // Memoized export handler
  const handleExport = useMemoizedCallback((format: 'png' | 'pdf' | 'csv' | 'excel') => {
    if (format === 'csv' || format === 'excel') {
      // Export data as CSV/Excel
      const csvData = processedData.map(item => ({
        [nameKey]: item[nameKey],
        [dataKey]: item[dataKey],
        percentage: `${item.percentage.toFixed(2)}%`,
      }));
      
      // Convert to CSV string
      const headers = [nameKey, dataKey, 'percentage'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => row[h] || '').join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pie-chart-data.${format === 'excel' ? 'csv' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export chart as image (PNG/PDF)
      console.log(`Export as ${format} not implemented yet`);
    }
  }, [processedData, nameKey, dataKey]);

  // Memoized custom tooltip component
  const CustomTooltip = useMemo(() => {
    if (!showTooltip) return null;
    
    return ({ active, payload }: any) => {
      if (!active || !payload || !payload.length) return null;

      const data = payload[0].payload;
      
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ color: textColor, margin: '0 0 8px 0', fontWeight: 'bold' }}>
            {data[nameKey]}
          </p>
          <p style={{ color: payload[0].color, margin: '4px 0', fontSize: '14px' }}>
            {`Value: ${valueFormatter(data[dataKey])}`}
          </p>
          {showPercentage && (
            <p style={{ color: textColor, margin: '4px 0', fontSize: '14px' }}>
              {`Percentage: ${data.percentage.toFixed(1)}%`}
            </p>
          )}
        </div>
      );
    };
  }, [showTooltip, tooltipBg, tooltipBorder, textColor, nameKey, dataKey, valueFormatter, showPercentage]);

  // Memoized label renderer
  const renderLabel = useMemoizedCallback((entry: any) => {
    if (!showLabels) return null;
    
    if (showPercentage) {
      return `${entry.percentage.toFixed(1)}%`;
    }
    
    return entry[nameKey];
  }, [showLabels, showPercentage, nameKey]);

  // Memoized chart component
  const chartComponent = useMemo(() => (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart ref={chartRef}>
        <Pie
          data={processedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? renderLabel : false}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          paddingAngle={paddingAngle}
          startAngle={startAngle}
          endAngle={endAngle}
          dataKey={dataKey}
          animationDuration={animationDuration}
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        
        {showTooltip && <Tooltip content={CustomTooltip} />}
        
        {showLegend && (
          <Legend
            wrapperStyle={{ color: textColor }}
            iconType="circle"
            layout={legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal'}
            verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'}
            align={legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  ), [
    processedData,
    outerRadius,
    innerRadius,
    paddingAngle,
    startAngle,
    endAngle,
    dataKey,
    animationDuration,
    showLabels,
    showTooltip,
    showLegend,
    renderLabel,
    CustomTooltip,
    textColor,
    legendPosition,
  ]);

  return (
    <ChartContainer
      {...containerProps}
      onExport={handleExport}
    >
      {chartComponent}
    </ChartContainer>
  );
});

PieChart.displayName = 'PieChart';

/**
 * Financial Pie Chart with specialized formatting and colors
 */
export const FinancialPieChart: React.FC<PieChartProps> = memo((props) => (
  <PieChart
    {...props}
    variant="financial"
    colorScheme="financial"
    formatValue={(value) => FinancialPerformanceUtils.formatCurrency(value, 'USD')}
  />
));

FinancialPieChart.displayName = 'FinancialPieChart';

/**
 * Donut Chart (Pie chart with inner radius)
 */
export const DonutChart: React.FC<PieChartProps> = memo((props) => (
  <PieChart
    {...props}
    innerRadius={60}
    outerRadius={100}
  />
));

DonutChart.displayName = 'DonutChart';

/**
 * Financial Donut Chart
 */
export const FinancialDonutChart: React.FC<PieChartProps> = memo((props) => (
  <FinancialPieChart
    {...props}
    innerRadius={60}
    outerRadius={100}
  />
));

FinancialDonutChart.displayName = 'FinancialDonutChart';

export default PieChart;
