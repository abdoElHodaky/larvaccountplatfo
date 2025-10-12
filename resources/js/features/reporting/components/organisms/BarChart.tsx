import React, { memo, useMemo, useRef } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useColorModeValue } from '@chakra-ui/react';
import { ChartContainer, ChartContainerProps } from './ChartContainer';
import { useMemoizedCallback } from '@/shared/hooks';
import { FinancialPerformanceUtils } from '@/shared/utils/Debounce';

/**
 * Performance-Optimized Bar Chart Component
 * Specialized for financial categorical data with interactive features
 */

export interface BarChartDataPoint {
  [key: string]: any;
  category?: string;
  name?: string;
}

export interface BarChartSeries {
  key: string;
  name: string;
  color?: string;
  stackId?: string;
  fill?: string;
}

export interface BarChartProps extends Omit<ChartContainerProps, 'children'> {
  data: BarChartDataPoint[];
  series: BarChartSeries[];
  xAxisKey?: string;
  layout?: 'horizontal' | 'vertical';
  formatXAxis?: (_value: any) => string;
  formatYAxis?: (_value: any) => string;
  formatTooltip?: (_value: any, _name: string) => [string, string];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animationDuration?: number;
  barSize?: number;
  maxBarSize?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  colorScheme?: 'default' | 'financial' | 'profit-loss' | 'asset-liability';
}

export const BarChart: React.FC<BarChartProps> = memo(({
  data,
  series,
  xAxisKey = 'name',
  layout = 'vertical',
  formatXAxis,
  formatYAxis,
  formatTooltip,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animationDuration = 300,
  barSize,
  maxBarSize = 50,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  colorScheme = 'default',
  ...containerProps
}) => {
  const chartRef = useRef<SVGSVGElement>(null);

  // Memoized color values
  const gridColor = useColorModeValue('#f0f0f0', '#2d3748');
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

  // Memoized processed data with color assignment
  const processedData = useMemo(() => {
    const colors = colorSchemes[colorScheme];
    
    return data.map((item, index) => {
      const processedItem = { ...item };
      
      // Add color for single-series charts
      if (series.length === 1) {
        processedItem._color = colors[index % colors.length];
      }
      
      return processedItem;
    });
  }, [data, colorSchemes, colorScheme, series.length]);

  // Memoized series with default colors
  const processedSeries = useMemo(() => {
    const colors = colorSchemes[colorScheme];
    
    return series.map((s, index) => ({
      ...s,
      color: s.color || colors[index % colors.length],
      fill: s.fill || s.color || colors[index % colors.length],
    }));
  }, [series, colorSchemes, colorScheme]);

  // Memoized X-axis formatter
  const xAxisFormatter = useMemoizedCallback((value: any) => {
    if (formatXAxis) {
      return formatXAxis(value);
    }
    
    // Default formatting for categories
    return String(value);
  }, [formatXAxis]);

  // Memoized Y-axis formatter
  const yAxisFormatter = useMemoizedCallback((value: any) => {
    if (formatYAxis) {
      return formatYAxis(value);
    }
    
    // Default financial formatting
    if (typeof value === 'number') {
      return FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD');
    }
    
    return String(value);
  }, [formatYAxis]);

  // Memoized tooltip formatter
  const tooltipFormatter = useMemoizedCallback((value: any, name: string) => {
    if (formatTooltip) {
      return formatTooltip(value, name);
    }
    
    // Default financial formatting
    if (typeof value === 'number') {
      return [
        FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD'),
        name
      ];
    }
    
    return [String(value), name];
  }, [formatTooltip]);

  // Memoized export handler
  const handleExport = useMemoizedCallback((format: 'png' | 'pdf' | 'csv' | 'excel') => {
    if (format === 'csv' || format === 'excel') {
      // Export data as CSV/Excel
      const csvData = processedData.map(item => {
        const row: any = { [xAxisKey]: item[xAxisKey] };
        processedSeries.forEach(s => {
          row[s.name] = item[s.key];
        });
        return row;
      });
      
      // Convert to CSV string
      const headers = [xAxisKey, ...processedSeries.map(s => s.name)];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => row[h] || '').join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bar-chart-data.${format === 'excel' ? 'csv' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export chart as image (PNG/PDF)
      // TODO: Implement image export functionality
    }
  }, [processedData, processedSeries, xAxisKey]);

  // Memoized custom tooltip component
  const CustomTooltip = useMemo(() => {
    if (!showTooltip) return undefined;
    
    return ({ active, payload, label }: any) => {
      if (!active || !payload || !payload.length) return null;

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
            {xAxisFormatter(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: '4px 0',
                fontSize: '14px',
              }}
            >
              {`${entry.name}: ${tooltipFormatter(entry.value, entry.name)[0]}`}
            </p>
          ))}
        </div>
      );
    };
  }, [showTooltip, tooltipBg, tooltipBorder, textColor, xAxisFormatter, tooltipFormatter]);

  // Memoized chart component
  const chartComponent = useMemo(() => (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        layout={layout}
        data={processedData}
        margin={margin}
        ref={chartRef}
        barSize={barSize}
        maxBarSize={maxBarSize}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            opacity={0.5}
          />
        )}
        
        <XAxis
          type={layout === 'vertical' ? 'number' : 'category'}
          dataKey={layout === 'vertical' ? undefined : xAxisKey}
          tickFormatter={layout === 'vertical' ? yAxisFormatter : xAxisFormatter}
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={layout === 'vertical' ? 80 : undefined}
        />
        
        <YAxis
          type={layout === 'vertical' ? 'category' : 'number'}
          dataKey={layout === 'vertical' ? xAxisKey : undefined}
          tickFormatter={layout === 'vertical' ? xAxisFormatter : yAxisFormatter}
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={layout === 'vertical' ? 120 : 80}
        />
        
        {showTooltip && <Tooltip content={CustomTooltip} />}
        
        {showLegend && (
          <Legend
            wrapperStyle={{ color: textColor }}
            iconType="rect"
          />
        )}
        
        {processedSeries.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.fill}
            stackId={s.stackId}
            animationDuration={animationDuration}
          >
            {/* Individual cell colors for single-series charts */}
            {series.length === 1 && processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry._color} />
            ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  ), [
    layout,
    processedData,
    processedSeries,
    margin,
    barSize,
    maxBarSize,
    showGrid,
    showTooltip,
    showLegend,
    xAxisKey,
    xAxisFormatter,
    yAxisFormatter,
    CustomTooltip,
    gridColor,
    textColor,
    animationDuration,
    series.length,
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

BarChart.displayName = 'BarChart';

/**
 * Financial Bar Chart with specialized formatting and colors
 */
export const FinancialBarChart: React.FC<BarChartProps> = memo((props) => (
  <BarChart
    {...props}
    variant="financial"
    colorScheme="financial"
    formatYAxis={(value) => FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD')}
    formatTooltip={(value, name) => [
      FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD'),
      name
    ]}
  />
));

FinancialBarChart.displayName = 'FinancialBarChart';

/**
 * Profit/Loss Bar Chart with green/red color scheme
 */
export const ProfitLossBarChart: React.FC<BarChartProps> = memo((props) => (
  <BarChart
    {...props}
    variant="financial"
    colorScheme="profit-loss"
    formatYAxis={(value) => FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD')}
    formatTooltip={(value, name) => [
      FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD'),
      name
    ]}
  />
));

ProfitLossBarChart.displayName = 'ProfitLossBarChart';

export default BarChart;
