/**
 * Dashboard API Service
 * Handles all dashboard-related API calls with GraphQL integration
 */

import { apolloClient } from '../../../shared/services/graphql/apolloClient';
import { gql } from '@apollo/client';
import { log } from '../../../shared/utils/logger';
import type { DashboardLayout, Widget, MetricData, ChartData, DashboardFilters } from '../stores/dashboardModel';
import type { ApiResponse } from '../../accounting/services/accountingApi';

// GraphQL Queries
const GET_DASHBOARD_LAYOUTS = gql`
  query GetDashboardLayouts {
    dashboardLayouts {
      id
      name
      description
      isDefault
      widgets {
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
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_DASHBOARD_METRICS = gql`
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
    }
  }
`;

const GET_DASHBOARD_CHARTS = gql`
  query GetDashboardCharts($filters: DashboardFiltersInput) {
    dashboardCharts(filters: $filters) {
      id
      type
      title
      data {
        labels
        datasets {
          label
          data
          backgroundColor
          borderColor
          borderWidth
        }
      }
      options
    }
  }
`;

const GET_WIDGET_DATA = gql`
  query GetWidgetData($widgetId: ID!, $filters: DashboardFiltersInput) {
    widgetData(widgetId: $widgetId, filters: $filters) {
      id
      data
      lastUpdated
    }
  }
`;

// GraphQL Mutations
const CREATE_DASHBOARD_LAYOUT = gql`
  mutation CreateDashboardLayout($input: CreateDashboardLayoutInput!) {
    createDashboardLayout(input: $input) {
      id
      name
      description
      isDefault
      widgets {
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
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_DASHBOARD_LAYOUT = gql`
  mutation UpdateDashboardLayout($id: ID!, $input: UpdateDashboardLayoutInput!) {
    updateDashboardLayout(id: $id, input: $input) {
      id
      name
      description
      isDefault
      widgets {
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
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_DASHBOARD_LAYOUT = gql`
  mutation DeleteDashboardLayout($id: ID!) {
    deleteDashboardLayout(id: $id) {
      success
      message
    }
  }
`;

const CREATE_WIDGET = gql`
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
      lastUpdated
    }
  }
`;

const UPDATE_WIDGET = gql`
  mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
    updateWidget(id: $id, input: $input) {
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
      lastUpdated
    }
  }
`;

const DELETE_WIDGET = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id) {
      success
      message
    }
  }
`;

// API Service Class
export class DashboardApiService {
  // Layout methods
  async getLayouts(): Promise<ApiResponse<DashboardLayout[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_DASHBOARD_LAYOUTS,
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.dashboardLayouts,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard layouts';
      log.error('Failed to fetch dashboard layouts', error, 'DashboardAPI');
      throw new Error(errorMessage);
    }
  }

  async createLayout(layoutData: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<DashboardLayout>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_DASHBOARD_LAYOUT,
        variables: { input: layoutData },
        update: (cache, { data: mutationData }) => {
          // Update cache with new layout
          const existingLayouts = cache.readQuery({ query: GET_DASHBOARD_LAYOUTS });
          if (existingLayouts) {
            cache.writeQuery({
              query: GET_DASHBOARD_LAYOUTS,
              data: {
                dashboardLayouts: [...(existingLayouts as { dashboardLayouts: DashboardLayout[] }).dashboardLayouts, mutationData.createDashboardLayout],
              },
            });
          }
        },
      });

      return {
        data: data.createDashboardLayout,
        success: true,
        message: 'Dashboard layout created successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dashboard layout';
      log.error('Failed to create dashboard layout', error, 'DashboardAPI');
      throw new Error(errorMessage);
    }
  }

  async updateLayout(id: string, layoutData: Partial<DashboardLayout>): Promise<ApiResponse<DashboardLayout>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_DASHBOARD_LAYOUT,
        variables: { id, input: layoutData },
        update: (cache, { data: mutationData }) => {
          // Update cache
          cache.modify({
            id: cache.identify({ __typename: 'DashboardLayout', id }),
            fields: {
              ...mutationData.updateDashboardLayout,
            },
          });
        },
      });

      return {
        data: data.updateDashboardLayout,
        success: true,
        message: 'Dashboard layout updated successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update dashboard layout';
      log.error('Failed to update dashboard layout', error, 'DashboardAPI');
      throw new Error(errorMessage);
    }
  }

  async deleteLayout(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_DASHBOARD_LAYOUT,
        variables: { id },
        update: (cache) => {
          // Remove from cache
          cache.evict({ id: cache.identify({ __typename: 'DashboardLayout', id }) });
          cache.gc();
        },
      });

      return {
        data: data.deleteDashboardLayout.success,
        success: true,
        message: data.deleteDashboardLayout.message,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dashboard layout';
      log.error('Failed to delete dashboard layout:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  // Widget methods
  async createWidget(widgetData: Omit<Widget, 'id'>): Promise<ApiResponse<Widget>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_WIDGET,
        variables: { input: widgetData },
      });

      return {
        data: data.createWidget,
        success: true,
        message: 'Widget created successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create widget';
      log.error('Failed to create widget:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  async updateWidget(id: string, widgetData: Partial<Widget>): Promise<ApiResponse<Widget>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_WIDGET,
        variables: { id, input: widgetData },
      });

      return {
        data: data.updateWidget,
        success: true,
        message: 'Widget updated successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update widget';
      log.error('Failed to update widget:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  async deleteWidget(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_WIDGET,
        variables: { id },
      });

      return {
        data: data.deleteWidget.success,
        success: true,
        message: data.deleteWidget.message,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete widget';
      log.error('Failed to delete widget:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  async getWidgetData(widgetId: string, filters?: Partial<DashboardFilters>): Promise<ApiResponse<unknown>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_WIDGET_DATA,
        variables: { widgetId, filters },
        fetchPolicy: 'network-only', // Always fetch fresh data for widgets
      });

      return {
        data: data.widgetData.data,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch widget data';
      log.error('Failed to fetch widget data:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  // Data methods
  async getMetrics(filters?: Partial<DashboardFilters>): Promise<ApiResponse<MetricData[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_DASHBOARD_METRICS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.dashboardMetrics,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics';
      log.error('Failed to fetch dashboard metrics:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  async getCharts(filters?: Partial<DashboardFilters>): Promise<ApiResponse<ChartData[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_DASHBOARD_CHARTS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.dashboardCharts,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard charts';
      log.error('Failed to fetch dashboard charts:', error, "DashboardAPI");
      throw new Error(errorMessage);
    }
  }

  // Utility methods
  async exportDashboard(layoutId: string): Promise<ApiResponse<string>> {
    try {
      const layoutResponse = await this.getLayouts();
      const layout = layoutResponse.data.find(l => l.id === layoutId);
      
      if (!layout) {
        throw new Error('Dashboard layout not found');
      }

      // Get all widget data
      const widgetDataPromises = layout.widgets.map(widget => 
        this.getWidgetData(widget.id).catch(() => ({ data: null, success: false }))
      );
      
      const widgetDataResults = await Promise.all(widgetDataPromises);
      
      // Combine layout with widget data
      const exportData = {
        layout,
        widgetData: layout.widgets.map((widget, index) => ({
          widgetId: widget.id,
          data: widgetDataResults[index].data,
        })),
        exportedAt: new Date().toISOString(),
      };

      return {
        data: JSON.stringify(exportData, null, 2),
        success: true,
        message: 'Dashboard exported successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export dashboard';
      log.error('Failed to export dashboard', error, 'DashboardAPI');
      throw new Error(errorMessage);
    }
  }

  async getDashboardAnalytics(layoutId: string, dateRange: { start: string; end: string }): Promise<ApiResponse<unknown>> {
    try {
      // This would typically be a separate GraphQL query
      // For now, we'll simulate analytics data
      const analytics = {
        layoutId,
        dateRange,
        metrics: {
          totalViews: Math.floor(Math.random() * 1000),
          averageSessionTime: Math.floor(Math.random() * 300), // seconds
          mostUsedWidgets: [
            { widgetId: 'widget-1', views: Math.floor(Math.random() * 100) },
            { widgetId: 'widget-2', views: Math.floor(Math.random() * 100) },
          ],
          refreshRate: Math.floor(Math.random() * 10), // per hour
        },
        performance: {
          averageLoadTime: Math.floor(Math.random() * 2000), // ms
          slowestWidget: 'widget-3',
          cacheHitRate: Math.random() * 100, // percentage
        },
      };

      return {
        data: analytics,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get dashboard analytics';
      log.error('Failed to get dashboard analytics', error, 'DashboardAPI');
      throw new Error(errorMessage);
    }
  }

  // Real-time updates (would typically use subscriptions)
  async subscribeToWidgetUpdates(widgetId: string, callback: (data: unknown) => void): Promise<() => void> {
    // Simulate real-time updates with polling
    const interval = setInterval(async () => {
      try {
        const response = await this.getWidgetData(widgetId);
        callback(response.data);
      } catch (error) {
        log.error('Failed to fetch widget update', error, 'DashboardAPI');
        // Don't throw here as it would break the subscription
      }
    }, 30000); // Update every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

// Create and export singleton instance
export const dashboardApi = new DashboardApiService();
