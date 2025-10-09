/**
 * Financial Chart Component
 * Display financial data in chart format
 */

import React from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface FinancialChartProps {
  data?: ChartDataPoint[];
  title?: string;
  type?: 'line' | 'bar' | 'area';
  className?: string;
  height?: number;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  data = [],
  title = 'Financial Overview',
  type = 'line',
  className = '',
  height = 300
}) => {
  const defaultData: ChartDataPoint[] = [
    { label: 'Jan', value: 12000, date: '2023-01' },
    { label: 'Feb', value: 15000, date: '2023-02' },
    { label: 'Mar', value: 18000, date: '2023-03' },
    { label: 'Apr', value: 14000, date: '2023-04' },
    { label: 'May', value: 22000, date: '2023-05' },
    { label: 'Jun', value: 25000, date: '2023-06' }
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value));

  // Simple SVG chart implementation
  const renderChart = () => {
    const width = 100; // percentage
    const chartHeight = height - 60; // Leave space for labels
    const barWidth = width / chartData.length;

    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={chartHeight * ratio}
              x2={width}
              y2={chartHeight * ratio}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Chart bars/lines */}
          {type === 'bar' && chartData.map((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            const x = index * barWidth + barWidth * 0.1;
            const y = chartHeight - barHeight;
            
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                fill="#3b82f6"
                className="hover:fill-blue-600 transition-colors"
              />
            );
          })}

          {/* Chart line */}
          {type === 'line' && (
            <polyline
              points={chartData.map((point, index) => {
                const x = index * barWidth + barWidth * 0.5;
                const y = chartHeight - (point.value / maxValue) * chartHeight;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          )}

          {/* Data points for line chart */}
          {type === 'line' && chartData.map((point, index) => {
            const x = index * barWidth + barWidth * 0.5;
            const y = chartHeight - (point.value / maxValue) * chartHeight;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3b82f6"
                className="hover:r-4 transition-all"
              />
            );
          })}

          {/* X-axis labels */}
          {chartData.map((point, index) => {
            const x = index * barWidth + barWidth * 0.5;
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {point.label}
              </text>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
            <span key={index} className="text-right">
              ${Math.round(value).toLocaleString()}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`financial-chart ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;
