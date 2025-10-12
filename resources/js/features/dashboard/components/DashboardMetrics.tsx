/**
 * Dashboard Metrics Component
 * Displays key performance indicators and metrics
 */

import React from 'react';
import { StatusChartIcon, StatusTrendUpIcon, StatusTrendDownIcon, StatusTrendRightIcon } from '@/shared/icons';

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

interface DashboardMetricsProps {
  metrics: MetricData[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics = [],
  loading = false,
  error = null,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`dashboard-metrics loading ${className}`}>
        <div className="metrics-skeleton">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="metric-card skeleton">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-metrics error ${className}`}>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>Failed to load metrics: {error}</p>
        </div>
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div className={`dashboard-metrics empty ${className}`}>
        <div className="empty-state">
          <StatusChartIcon size="xl" color="gray" className="empty-icon" />
          <p>No metrics available</p>
        </div>
      </div>
    );
  }

  const formatChange = (change: number, changeType: string) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getTrendIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <StatusTrendUpIcon size="sm" color="success" />;
      case 'decrease':
        return <StatusTrendDownIcon size="sm" color="danger" />;
      default:
        return <StatusTrendRightIcon size="sm" color="gray" />;
    }
  };

  return (
    <div className={`dashboard-metrics ${className}`}>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`metric-card ${metric.color || 'default'}`}
          >
            <div className="metric-header">
              {metric.icon && (
                <span className="metric-icon">{metric.icon}</span>
              )}
              <h3 className="metric-title">{metric.title}</h3>
            </div>
            
            <div className="metric-content">
              <div className="metric-value">{metric.value}</div>
              
              {metric.change !== undefined && metric.changeType && (
                <div className={`metric-change ${metric.changeType}`}>
                  {getTrendIcon(metric.changeType)}
                  <span>{formatChange(metric.change, metric.changeType)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardMetrics;
