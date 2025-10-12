/**
 * Dashboard Header Component
 * Header with title, actions, and filters
 */

import React from 'react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  // Extended props for advanced dashboard functionality
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (dateRange: { start: string; end: string }) => void;
  metricTypes?: string[];
  onMetricTypesChange?: (metricTypes: string[]) => void;
  viewMode?: 'view' | 'edit';
  onViewModeChange?: (mode: 'view' | 'edit') => void;
  isEditable?: boolean;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  lastSaved?: Date | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Dashboard',
  subtitle,
  actions,
  filters,
  className = '',
  onRefresh,
  isLoading = false
}) => {
  return (
    <div className={`dashboard-header ${className}`}>
      <div className="header-content">
        <div className="header-info">
          <h1 className="dashboard-title">{title}</h1>
          {subtitle && (
            <p className="dashboard-subtitle">{subtitle}</p>
          )}
        </div>

        <div className="header-actions">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`refresh-button ${isLoading ? 'loading' : ''}`}
              title="Refresh dashboard"
            >
              {isLoading ? '⟳' : '↻'}
            </button>
          )}
          
          {actions && (
            <div className="custom-actions">
              {actions}
            </div>
          )}
        </div>
      </div>

      {filters && (
        <div className="header-filters">
          {filters}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
