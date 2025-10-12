import React, { memo, useMemo, useRef } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useColorModeValue } from '@chakra-ui/react';
import { ChartContainer, ChartContainerProps } from './ChartContainer';
import { useMemoizedCallback } from '@/shared/hooks';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

/**
 * Performance-Optimized Line Chart Component
 * Specialized for financial time-series data with interactive features
 */

export interface LineChartDataPoint {
  [key: string]: any;
  date?: string;
  timestamp?: number;
}

export interface LineChartSeries {
  key: string;
  name: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'step';
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean;
  connectNulls?: boolean;
}

export interface LineChartProps extends Omit<ChartContainerProps, 'children'> {
  data: LineChartDataPoint[];
  series: LineChartSeries[];
  xAxisKey?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any, name: string) => [string, string];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  enableZoom?: boolean;
  enableBrush?: boolean;
  animationDuration?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export const LineChart: React.FC<LineChartProps> = memo(({
  data,
  series,
  xAxisKey = 'date',
  formatXAxis,
  formatYAxis,
  formatTooltip,
  showGrid = true,
  showLegend = true,
  showTooltip = true,

  animationDuration = 300,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  ...containerProps
}) => {
  const chartRef = useRef<SVGSVGElement>(null);

  // Memoized color values
  const gridColor = useColorModeValue('#f0f0f0', '#2d3748');
  const textColor = useColorModeValue('#4a5568', '#a0aec0');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');

  // Memoized default colors for series
  const defaultColors = useMemo(() => [
    '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5',
    '#dd6b20', '#319795', '#c53030', '#9f7aea', '#2b6cb0'
  ], []);

  // Memoized processed data
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      [xAxisKey]: item[xAxisKey] || item.timestamp || item.date,
    }));
  }, [data, xAxisKey]);

  // Memoized series with default colors
  const processedSeries = useMemo(() => {
    return series.map((s, index) => ({
      ...s,
      color: s.color || defaultColors[index % defaultColors.length],
      type: s.type || 'monotone',
      strokeWidth: s.strokeWidth || 2,
      dot: s.dot !== undefined ? s.dot : false,
      connectNulls: s.connectNulls !== undefined ? s.connectNulls : true,
    }));
  }, [series, defaultColors]);

  // Memoized X-axis formatter
  const xAxisFormatter = useMemoizedCallback((value: any) => {
    if (formatXAxis) {
      return formatXAxis(value);
    }
    
    // Default date formatting
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
    
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
      a.download = `chart-data.${format === 'excel' ? 'csv' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export chart as image (PNG/PDF)
      // This would require additional libraries like html2canvas
      console.log(`Export as ${format} not implemented yet`);
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
      <RechartsLineChart
        data={processedData}
        margin={margin}
        ref={chartRef}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            opacity={0.5}
          />
        )}
        
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={xAxisFormatter}
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis
          tickFormatter={yAxisFormatter}
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        
        {showTooltip && <Tooltip content={CustomTooltip} />}
        
        {showLegend && (
          <Legend
            wrapperStyle={{ color: textColor }}
            iconType="line"
          />
        )}
        
        {processedSeries.map((s) => (
          <Line
            key={s.key}
            type={s.type}
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={s.strokeWidth}
            strokeDasharray={s.strokeDasharray}
            dot={s.dot}
            connectNulls={s.connectNulls}
            animationDuration={animationDuration}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  ), [
    processedData,
    processedSeries,
    margin,
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

LineChart.displayName = 'LineChart';

/**
 * Financial Line Chart with specialized formatting
 */
export const FinancialLineChart: React.FC<LineChartProps> = memo((props) => (
  <LineChart
    {...props}
    variant="financial"
    formatYAxis={(value) => FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD')}
    formatTooltip={(value, name) => [
      FinancialPerformanceUtils.formatCurrency(Number(value) || 0, 'USD'),
      name
    ]}
  />
));

FinancialLineChart.displayName = 'FinancialLineChart';

export default LineChart;
