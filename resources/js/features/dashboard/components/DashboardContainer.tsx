/**
 * Modern Dashboard Container Component
 * Updated to use Alova.js GraphQL and real-time Socket.io integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDashboardMetrics, useDashboardWidgets } from '../services/dashboardApiAlova';
import { useRealtimeDashboard } from '../../../shared/hooks/useSocket';
import { useCollaborativeDashboard } from '../../../shared/hooks/useCollaboration';
import { performanceMonitor } from '../../../shared/services/analytics/PerformanceMonitor';
import { getCurrentOrganizationId } from '../../../shared/services/alova/alova.config';
import { DashboardGrid } from './DashboardGrid';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardHeader } from './DashboardHeader';
import { CollaborationIndicator } from './CollaborationIndicator';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { ErrorFallback } from '../../../shared/components/ui/ErrorFallback';

// Types
interface DashboardContainerProps {
  dashboardId?: string;
  organizationId?: number;
  isEditable?: boolean;
  enableCollaboration?: boolean;
  enableRealtime?: boolean;
}

interface DashboardState {
  selectedDateRange: {
    start: string;
    end: string;
  };
  selectedMetricTypes: string[];
  viewMode: 'view' | 'edit';
  isFullscreen: boolean;
}

/**
 * Main Dashboard Container Component
 * Integrates Alova.js API calls with real-time Socket.io updates
 */
export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  dashboardId = 'default',
  organizationId,
  isEditable = true,
  enableCollaboration = true,
  enableRealtime = true,
}) => {
  // Performance monitoring
  const renderStartTime = performance.now();

  // State management
  const [state, setState] = useState<DashboardState>({
    selectedDateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    selectedMetricTypes: ['revenue', 'expenses', 'profit'],
    viewMode: 'view',
    isFullscreen: false,
  });

  const orgId = organizationId || getCurrentOrganizationId();

  // API hooks with Alova.js
  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useDashboardMetrics(
    {
      organizationId: orgId || undefined,
      dateRange: state.selectedDateRange,
      metricTypes: state.selectedMetricTypes,
    },
    {
      pollingInterval: 30000, // 30 seconds
      enabled: !!orgId,
    }
  );

  const {
    widgets,
    loading: widgetsLoading,
    error: widgetsError,
    refetch: refetchWidgets,
  } = useDashboardWidgets(orgId!, undefined, {
    enabled: !!orgId,
  });

  // Real-time hooks
  const {
    metrics: realtimeMetrics,
    widgets: realtimeWidgets,
    lastUpdate: realtimeLastUpdate,
    isConnected: socketConnected,
  } = useRealtimeDashboard(orgId || undefined);

  // Collaboration hooks
  const {
    collaborators,
    updateData: updateCollaborativeData,
    isLocked: dashboardLocked,
    hasUnsavedChanges,
    saveDocument: saveDashboard,
    lastSaved,
  } = useCollaborativeDashboard(dashboardId);

  // Memoized combined data
  const combinedMetrics = useMemo(() => {
    if (!enableRealtime) return metrics;
    
    // Merge static metrics with real-time updates
    const metricsMap = new Map(metrics.map((m: any) => [m.id, m]));
    
    realtimeMetrics.forEach(rtMetric => {
      const existingMetric = metricsMap.get(rtMetric.id);
      metricsMap.set(rtMetric.id, {
        ...(existingMetric || {}),
        ...rtMetric,
        isRealtime: true,
      });
    });
    
    return Array.from(metricsMap.values());
  }, [metrics, realtimeMetrics, enableRealtime]);

  const combinedWidgets = useMemo(() => {
    if (!enableRealtime) return widgets;
    
    // Merge static widgets with real-time updates
    const widgetsMap = new Map(widgets.map(w => [w.id, w]));
    
    realtimeWidgets.forEach(rtWidget => {
      const existingWidget = widgetsMap.get(rtWidget.id);
      widgetsMap.set(rtWidget.id, {
        ...(existingWidget || {}),
        ...rtWidget,
        isRealtime: true,
      });
    });
    
    return Array.from(widgetsMap.values());
  }, [widgets, realtimeWidgets, enableRealtime]);

  // Performance monitoring
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    performanceMonitor.recordUIMetric({
      component: 'DashboardContainer',
      action: 'render',
      renderTime,
      componentProps: {
        dashboardId,
        organizationId: orgId,
        widgetCount: combinedWidgets.length,
        metricCount: combinedMetrics.length,
      },
    });
  }, [dashboardId, orgId, combinedWidgets.length, combinedMetrics.length, renderStartTime]);

  // Error handling
  const handleError = useCallback((error: Error, errorInfo: any) => {
    performanceMonitor.recordError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        component: 'DashboardContainer',
        dashboardId,
        organizationId: orgId,
        errorInfo,
      },
    });
  }, [dashboardId, orgId]);

  // Event handlers
  const handleDateRangeChange = useCallback((dateRange: { start: string; end: string }) => {
    setState(prev => ({ ...prev, selectedDateRange: dateRange }));
    
    // Track user interaction
    performanceMonitor.recordInteraction({
      type: 'input',
      element: 'date-range-picker',
      page: '/dashboard',
      metadata: { dateRange },
    });
  }, []);

  const handleMetricTypesChange = useCallback((metricTypes: string[]) => {
    setState(prev => ({ ...prev, selectedMetricTypes: metricTypes }));
    
    performanceMonitor.recordInteraction({
      type: 'input',
      element: 'metric-type-selector',
      page: '/dashboard',
      metadata: { metricTypes },
    });
  }, []);

  const handleViewModeChange = useCallback((viewMode: 'view' | 'edit') => {
    setState(prev => ({ ...prev, viewMode }));
    
    if (viewMode === 'edit' && enableCollaboration) {
      // Notify other collaborators about edit mode
      updateCollaborativeData(prev => ({
        ...prev,
        editMode: true,
        editedBy: 'current-user-id',
        editedAt: new Date(),
      }));
    }
    
    performanceMonitor.recordInteraction({
      type: 'click',
      element: `view-mode-${viewMode}`,
      page: '/dashboard',
    });
  }, [enableCollaboration, updateCollaborativeData]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: any) => {
    if (enableCollaboration) {
      updateCollaborativeData((prev: any) => ({
        ...prev,
        widgets: (prev.widgets || []).map((w: any) => 
          w.id === widgetId ? { ...w, ...updates } : w
        ),
      }));
    }
    
    // Refetch widgets to ensure consistency
    refetchWidgets();
  }, [enableCollaboration, updateCollaborativeData, refetchWidgets]);

  const handleSaveDashboard = useCallback(async () => {
    if (enableCollaboration && hasUnsavedChanges) {
      try {
        await saveDashboard();
        
        performanceMonitor.recordInteraction({
          type: 'click',
          element: 'save-dashboard',
          page: '/dashboard',
          metadata: { hasUnsavedChanges },
        });
      } catch (error) {
        console.error('Failed to save dashboard:', error);
      }
    }
  }, [enableCollaboration, hasUnsavedChanges, saveDashboard]);

  const handleRefresh = useCallback(() => {
    refetchMetrics();
    refetchWidgets();
    
    performanceMonitor.recordInteraction({
      type: 'click',
      element: 'refresh-dashboard',
      page: '/dashboard',
    });
  }, [refetchMetrics, refetchWidgets]);

  // Auto-save functionality
  useEffect(() => {
    if (enableCollaboration && hasUnsavedChanges && state.viewMode === 'edit') {
      const autoSaveTimer = setTimeout(() => {
        handleSaveDashboard();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [enableCollaboration, hasUnsavedChanges, state.viewMode, handleSaveDashboard]);

  // Loading state
  const isLoading = metricsLoading || widgetsLoading;

  // Error state
  const hasError = metricsError || widgetsError;

  if (isLoading && combinedMetrics.length === 0 && combinedWidgets.length === 0) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner 
          message="Loading dashboard..." 
          size="lg"
          showProgress={true}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      resetKeys={[dashboardId, orgId]}
    >
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Dashboard"
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Collaboration Indicator */}
        {enableCollaboration && (
          <CollaborationIndicator
            activeUsers={collaborators}
            showUserCount={true}
          />
        )}

        {/* Error Display */}
        {hasError && (
          <div className="dashboard-error">
            <div className="error-message">
              {metricsError?.message || widgetsError?.message || 'An error occurred'}
            </div>
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className={`dashboard-content ${state.isFullscreen ? 'fullscreen' : ''}`}>
          {/* Metrics Section */}
          <div className="dashboard-metrics-section">
            <DashboardMetrics
              metrics={combinedMetrics}
              loading={metricsLoading}
              error={metricsError}
              dateRange={state.selectedDateRange}
              enableRealtime={enableRealtime}
              socketConnected={socketConnected}
            />
          </div>

          {/* Widgets Grid */}
          <div className="dashboard-widgets-section">
            <DashboardGrid
              widgets={combinedWidgets}
              loading={widgetsLoading}
              error={widgetsError}
              viewMode={state.viewMode}
              isEditable={isEditable && !dashboardLocked}
              onWidgetUpdate={handleWidgetUpdate}
              enableCollaboration={enableCollaboration}
              enableRealtime={enableRealtime}
              collaborators={collaborators}
            />
          </div>
        </div>

        {/* Real-time Status */}
        {enableRealtime && (
          <div className="realtime-status">
            <div className={`connection-indicator ${socketConnected ? 'connected' : 'disconnected'}`}>
              {socketConnected ? '🟢 Live' : '🔴 Offline'}
            </div>
            {realtimeLastUpdate && (
              <div className="last-update">
                Last update: {new Date(realtimeLastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Memoized export for performance
export default React.memo(DashboardContainer);
