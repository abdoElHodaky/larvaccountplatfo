/**
 * Dashboard API Service using Alova.js
 * Replaces Apollo Client with lightweight, performant GraphQL client
 */

import { gql, mutation } from '../../../shared/services/alova/alova.config';
import { useRequest, useAutoRequest } from 'alova';

// TypeScript interfaces
export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'number' | 'percentage';
  period: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  isActive: boolean;
  refreshInterval: number;
  dataSource?: string;
  userId?: number;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilters {
  organizationId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  metricTypes?: string[];
  includeInactive?: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CreateWidgetInput {
  type: string;
  title: string;
  description?: string;
  position: WidgetPosition;
  config?: Record<string, any>;
  refreshInterval?: number;
  dataSource?: string;
  organizationId: number;
  userId?: number;
}

export interface UpdateWidgetInput {
  id: string;
  title?: string;
  description?: string;
  position?: WidgetPosition;
  config?: Record<string, any>;
  refreshInterval?: number;
  isActive?: boolean;
}

/**
 * Dashboard API methods using Alova.js GraphQL client
 */
export const dashboardApi = {
  // Get dashboard metrics
  getMetrics: (filters?: DashboardFilters) => gql(`
    query GetDashboardMetrics($filters: DashboardFiltersInput) {
      dashboardMetrics(filters: $filters) {
        id
        name
        value
        previousValue
        change
        changePercent
        trend
        format
        period
        updatedAt
      }
    }
  `, { filters }),

  // Get dashboard widgets
  getWidgets: (organizationId: number, userId?: number) => gql(`
    query GetDashboardWidgets($organizationId: Int!, $userId: Int) {
      dashboardWidgets(organizationId: $organizationId, userId: $userId) {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        isActive
        refreshInterval
        dataSource
        userId
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { organizationId, userId }),

  // Get widget by ID
  getWidget: (widgetId: string) => gql(`
    query GetWidget($widgetId: ID!) {
      widget(id: $widgetId) {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        isActive
        refreshInterval
        dataSource
        userId
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { widgetId }),

  // Create new widget
  createWidget: (input: CreateWidgetInput) => mutation(`
    mutation CreateWidget($input: CreateWidgetInput!) {
      createWidget(input: $input) {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        isActive
        refreshInterval
        dataSource
        userId
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { input }),

  // Update widget
  updateWidget: (input: UpdateWidgetInput) => mutation(`
    mutation UpdateWidget($input: UpdateWidgetInput!) {
      updateWidget(input: $input) {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        isActive
        refreshInterval
        dataSource
        updatedAt
      }
    }
  `, { input }),

  // Update widget position
  updateWidgetPosition: (widgetId: string, position: WidgetPosition) => mutation(`
    mutation UpdateWidgetPosition($widgetId: ID!, $position: PositionInput!) {
      updateWidgetPosition(widgetId: $widgetId, position: $position) {
        id
        position {
          x
          y
          width
          height
        }
        updatedAt
      }
    }
  `, { widgetId, position }),

  // Bulk update widget positions
  bulkUpdateWidgetPositions: (updates: Array<{ widgetId: string; position: WidgetPosition }>) => mutation(`
    mutation BulkUpdateWidgetPositions($updates: [WidgetPositionUpdateInput!]!) {
      bulkUpdateWidgetPositions(updates: $updates) {
        id
        position {
          x
          y
          width
          height
        }
        updatedAt
      }
    }
  `, { updates }),

  // Delete widget
  deleteWidget: (widgetId: string) => mutation(`
    mutation DeleteWidget($widgetId: ID!) {
      deleteWidget(widgetId: $widgetId) {
        success
        message
      }
    }
  `, { widgetId }),

  // Clone widget
  cloneWidget: (widgetId: string, userId?: number) => mutation(`
    mutation CloneWidget($widgetId: ID!, $userId: Int) {
      cloneWidget(widgetId: $widgetId, userId: $userId) {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        isActive
        refreshInterval
        dataSource
        userId
        organizationId
        createdAt
        updatedAt
      }
    }
  `, { widgetId, userId }),

  // Get widget data (for rendering)
  getWidgetData: (widgetId: string, filters?: Record<string, any>) => gql(`
    query GetWidgetData($widgetId: ID!, $filters: JSON) {
      widgetData(widgetId: $widgetId, filters: $filters) {
        widgetId
        data
        lastUpdated
        error
      }
    }
  `, { widgetId, filters }),

  // Refresh widget data
  refreshWidgetData: (widgetId: string) => mutation(`
    mutation RefreshWidgetData($widgetId: ID!) {
      refreshWidgetData(widgetId: $widgetId) {
        widgetId
        data
        lastUpdated
        success
      }
    }
  `, { widgetId }),

  // Get dashboard layout
  getDashboardLayout: (organizationId: number, userId?: number) => gql(`
    query GetDashboardLayout($organizationId: Int!, $userId: Int) {
      dashboardLayout(organizationId: $organizationId, userId: $userId) {
        id
        name
        description
        isDefault
        config
        widgets {
          id
          type
          title
          position {
            x
            y
            width
            height
          }
          config
          isActive
        }
        createdAt
        updatedAt
      }
    }
  `, { organizationId, userId }),

  // Save dashboard layout
  saveDashboardLayout: (layoutData: any) => mutation(`
    mutation SaveDashboardLayout($input: DashboardLayoutInput!) {
      saveDashboardLayout(input: $input) {
        id
        name
        description
        isDefault
        config
        updatedAt
      }
    }
  `, { input: layoutData }),

  // Get dashboard statistics
  getDashboardStats: (organizationId: number) => gql(`
    query GetDashboardStats($organizationId: Int!) {
      dashboardStats(organizationId: $organizationId) {
        totalWidgets
        activeWidgets
        widgetsByType {
          type
          count
        }
        lastUpdated
      }
    }
  `, { organizationId })
};

/**
 * React hooks for dashboard data using Alova.js
 */

// Hook for dashboard metrics with real-time updates
export function useDashboardMetrics(filters?: DashboardFilters, options?: {
  pollingInterval?: number;
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useAutoRequest(
    () => dashboardApi.getMetrics(filters),
    {
      immediate: options?.enabled !== false,
      initialData: [],
      pollingTime: options?.pollingInterval || 30000, // 30 seconds default
      enableVisibility: true, // Refetch when browser becomes visible
      enableFocus: true, // Refetch when browser gets focus
      enableNetwork: true, // Refetch when network reconnects
      throttle: 1000, // Throttle multiple triggers within 1 second
    }
  );

  return {
    metrics: (data as any)?.data?.dashboardMetrics || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for dashboard widgets
export function useDashboardWidgets(organizationId: number, userId?: number, options?: {
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => dashboardApi.getWidgets(organizationId, userId),
    {
      immediate: options?.enabled !== false,
      initialData: [],
    }
  );

  return {
    widgets: (data as any)?.data?.dashboardWidgets || [],
    loading,
    error,
    refetch: send,
  };
}

// Hook for single widget data
export function useWidgetData(widgetId: string, filters?: Record<string, any>, options?: {
  pollingInterval?: number;
  enabled?: boolean;
}) {
  const { data, loading, error, send } = useRequest(
    () => dashboardApi.getWidgetData(widgetId, filters),
    {
      immediate: options?.enabled !== false && !!widgetId,
      pollingTime: options?.pollingInterval || 60000, // 1 minute default
    }
  );

  return {
    widgetData: (data as any)?.data?.widgetData,
    loading,
    error,
    refetch: send,
  };
}

// Hook for dashboard layout
export function useDashboardLayout(organizationId: number, userId?: number) {
  const { data, loading, error, send } = useRequest(
    () => dashboardApi.getDashboardLayout(organizationId, userId),
    {
      immediate: true,
    }
  );

  return {
    layout: (data as any)?.data?.dashboardLayout,
    loading,
    error,
    refetch: send,
  };
}

// Hook for creating widgets
export function useCreateWidget() {
  const { loading, error, send } = useRequest(
    (input: CreateWidgetInput) => dashboardApi.createWidget(input),
    {
      immediate: false,
    }
  );

  return {
    createWidget: send,
    loading,
    error,
  };
}

// Hook for updating widgets
export function useUpdateWidget() {
  const { loading, error, send } = useRequest(
    (input: UpdateWidgetInput) => dashboardApi.updateWidget(input),
    {
      immediate: false,
    }
  );

  return {
    updateWidget: send,
    loading,
    error,
  };
}

// Hook for updating widget positions
export function useUpdateWidgetPosition() {
  const { loading, error, send } = useRequest(
    (widgetId: string, position: WidgetPosition) => 
      dashboardApi.updateWidgetPosition(widgetId, position),
    {
      immediate: false,
    }
  );

  return {
    updatePosition: send,
    loading,
    error,
  };
}

// Hook for deleting widgets
export function useDeleteWidget() {
  const { loading, error, send } = useRequest(
    (widgetId: string) => dashboardApi.deleteWidget(widgetId),
    {
      immediate: false,
    }
  );

  return {
    deleteWidget: send,
    loading,
    error,
  };
}
