/**
 * Dashboard Rematch Model
 * Manages dashboard state, widgets, and analytics data
 */

import { createModel } from '@rematch/PATTERNS';
import { dashboardApi } from '../services/dashboardApi';
import { dashboardRestApi } from '../services/dashboardRestApi';

// Types
export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  data?: any;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetricData {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'number' | 'percentage';
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      borderWidth?: number;
    }>;
  };
  options?: Record<string, any>;
}

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  } | null;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  accounts: string[];
  categories: string[];
  customFilters: Record<string, any>;
}

export interface DashboardState {
  // Layouts
  layouts: DashboardLayout[];
  currentLayout: DashboardLayout | null;
  layoutsLoading: boolean;
  
  // Widgets
  widgets: Widget[];
  selectedWidget: Widget | null;
  widgetsLoading: boolean;
  
  // Data
  metrics: MetricData[];
  charts: ChartData[];
  dataLoading: boolean;
  
  // UI state
  filters: DashboardFilters;
  editMode: boolean;
  dragMode: boolean;
  
  // Feature flags and API state
  useRestApi: boolean;
  useRealTime: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  
  // General
  error: string | null;
  lastRefresh: string | null;
}

const initialFilters: DashboardFilters = {
  dateRange: null,
  period: 'month',
  accounts: [],
  categories: [],
  customFilters: {},
};

const initialState: DashboardState = {
  layouts: [],
  currentLayout: null,
  layoutsLoading: false,
  widgets: [],
  selectedWidget: null,
  widgetsLoading: false,
  metrics: [],
  charts: [],
  dataLoading: false,
  filters: initialFilters,
  editMode: false,
  dragMode: false,
  useRestApi: true, // Default to using REST API
  useRealTime: true, // Default to using real-time updates
  connectionStatus: 'disconnected',
  error: null,
  lastRefresh: null,
};

export const dashboardModel = createModel()({
  name: 'dashboard',
  state: initialState,
  
  reducers: {
    // Layout reducers
    setLayouts: (state, layouts: DashboardLayout[]) => ({
      ...state,
      layouts,
      layoutsLoading: false,
    }),
    
    setCurrentLayout: (state, layout: DashboardLayout | null) => ({
      ...state,
      currentLayout: layout,
      widgets: layout?.widgets || [],
    }),
    
    addLayout: (state, layout: DashboardLayout) => ({
      ...state,
      layouts: [...state.layouts, layout],
    }),
    
    updateLayout: (state, updatedLayout: DashboardLayout) => ({
      ...state,
      layouts: state.layouts.map(layout => 
        layout.id === updatedLayout.id ? updatedLayout : layout
      ),
      currentLayout: state.currentLayout?.id === updatedLayout.id ? updatedLayout : state.currentLayout,
    }),
    
    removeLayout: (state, layoutId: string) => ({
      ...state,
      layouts: state.layouts.filter(layout => layout.id !== layoutId),
      currentLayout: state.currentLayout?.id === layoutId ? null : state.currentLayout,
    }),
    
    setLayoutsLoading: (state, loading: boolean) => ({
      ...state,
      layoutsLoading: loading,
    }),
    
    // Widget reducers
    setWidgets: (state, widgets: Widget[]) => ({
      ...state,
      widgets,
      widgetsLoading: false,
    }),
    
    addWidget: (state, widget: Widget) => ({
      ...state,
      widgets: [...state.widgets, widget],
    }),
    
    updateWidget: (state, updatedWidget: Widget) => ({
      ...state,
      widgets: state.widgets.map(widget => 
        widget.id === updatedWidget.id ? updatedWidget : widget
      ),
    }),
    
    removeWidget: (state, widgetId: string) => ({
      ...state,
      widgets: state.widgets.filter(widget => widget.id !== widgetId),
      selectedWidget: state.selectedWidget?.id === widgetId ? null : state.selectedWidget,
    }),
    
    setSelectedWidget: (state, widget: Widget | null) => ({
      ...state,
      selectedWidget: widget,
    }),
    
    setWidgetsLoading: (state, loading: boolean) => ({
      ...state,
      widgetsLoading: loading,
    }),
    
    updateWidgetData: (state, payload: { widgetId: string; data: any; error?: string }) => ({
      ...state,
      widgets: state.widgets.map(widget => 
        widget.id === payload.widgetId 
          ? { 
              ...widget, 
              data: payload.data, 
              error: payload.error || null,
              loading: false,
              lastUpdated: new Date().toISOString(),
            }
          : widget
      ),
    }),
    
    setWidgetLoading: (state, payload: { widgetId: string; loading: boolean }) => ({
      ...state,
      widgets: state.widgets.map(widget => 
        widget.id === payload.widgetId 
          ? { ...widget, loading: payload.loading }
          : widget
      ),
    }),
    
    // Data reducers
    setMetrics: (state, metrics: MetricData[]) => ({
      ...state,
      metrics,
      dataLoading: false,
    }),
    
    setCharts: (state, charts: ChartData[]) => ({
      ...state,
      charts,
      dataLoading: false,
    }),
    
    setDataLoading: (state, loading: boolean) => ({
      ...state,
      dataLoading: loading,
    }),
    
    // UI state reducers
    updateFilters: (state, newFilters: Partial<DashboardFilters>) => ({
      ...state,
      filters: { ...state.filters, ...newFilters },
    }),
    
    resetFilters: (state) => ({
      ...state,
      filters: initialFilters,
    }),
    
    setEditMode: (state, editMode: boolean) => ({
      ...state,
      editMode,
      dragMode: editMode ? state.dragMode : false,
    }),
    
    setDragMode: (state, dragMode: boolean) => ({
      ...state,
      dragMode,
    }),
    
    // Feature flag reducers
    setUseRestApi: (state, useRestApi: boolean) => ({
      ...state,
      useRestApi,
    }),
    
    setUseRealTime: (state, useRealTime: boolean) => ({
      ...state,
      useRealTime,
    }),
    
    setConnectionStatus: (state, status: 'connected' | 'disconnected' | 'connecting' | 'error') => ({
      ...state,
      connectionStatus: status,
    }),
    
    // General reducers
    setError: (state, error: string | null) => ({
      ...state,
      error,
      layoutsLoading: false,
      widgetsLoading: false,
      dataLoading: false,
    }),
    
    clearError: (state) => ({
      ...state,
      error: null,
    }),
    
    setLastRefresh: (state, timestamp: string) => ({
      ...state,
      lastRefresh: timestamp,
    }),
  },
  
  effects: (dispatch) => ({
    // Layout effects
    async fetchLayouts() {
      dispatch.dashboard.setLayoutsLoading(true);
      dispatch.dashboard.clearError();
      
      try {
        const state = this as DashboardState;
        let response;
        
        if (state.useRestApi) {
          // Use new REST API
          response = await dashboardRestApi.getLayouts();
        } else {
          // Use legacy GraphQL API
          response = await dashboardApi.getLayouts();
        }
        
        const layouts = state.useRestApi ? response : response.data;
        dispatch.dashboard.setLayouts(layouts);
        
        // Set default layout if none is current
        if (!state.currentLayout && layouts.length > 0) {
          const defaultLayout = layouts.find(l => l.isDefault) || layouts[0];
          dispatch.dashboard.setCurrentLayout(defaultLayout);
        }
      } catch (error: any) {
        dispatch.dashboard.setError(error.message || 'Failed to fetch dashboard layouts');
      }
    },

    // New effect for fetching complete dashboard data via REST API
    async fetchDashboardData() {
      dispatch.dashboard.setDataLoading(true);
      dispatch.dashboard.clearError();
      
      try {
        const state = this as DashboardState;
        
        if (state.useRestApi) {
          // Use new REST API to get complete dashboard data
          const dashboardData = await dashboardRestApi.getDashboard();
          
          // Update state with the received data
          if (dashboardData.layouts) {
            dispatch.dashboard.setLayouts(dashboardData.layouts);
            
            // Set current layout if available
            if (dashboardData.currentLayout) {
              dispatch.dashboard.setCurrentLayout(dashboardData.currentLayout);
            } else if (dashboardData.layouts.length > 0) {
              const defaultLayout = dashboardData.layouts.find(l => l.isDefault) || dashboardData.layouts[0];
              dispatch.dashboard.setCurrentLayout(defaultLayout);
            }
          }
          
          if (dashboardData.widgets) {
            dispatch.dashboard.setWidgets(dashboardData.widgets);
          }
          
          if (dashboardData.metrics) {
            dispatch.dashboard.setMetrics(dashboardData.metrics);
          }
          
          if (dashboardData.charts) {
            dispatch.dashboard.setCharts(dashboardData.charts);
          }
          
          dispatch.dashboard.setLastRefresh(new Date().toISOString());
        } else {
          // Fall back to individual API calls for legacy support
          await dispatch.dashboard.fetchLayouts();
          await dispatch.dashboard.fetchMetrics();
          await dispatch.dashboard.fetchCharts();
        }
      } catch (error: any) {
        dispatch.dashboard.setError(error.message || 'Failed to fetch dashboard data');
      } finally {
        dispatch.dashboard.setDataLoading(false);
      }
    },
    
    async createLayout(layoutData: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) {
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.createLayout(layoutData);
        dispatch.dashboard.addLayout(response.data);
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create dashboard layout';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async updateLayout(payload: { id: string; data: Partial<DashboardLayout> }) {
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.updateLayout(payload.id, payload.data);
        dispatch.dashboard.updateLayout({ data: payload.data, ...response.data } as DashboardLayout & { data: Partial<DashboardLayout> });
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update dashboard layout';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async deleteLayout(layoutId: string) {
      dispatch.dashboard.clearError();
      
      try {
        await dashboardApi.deleteLayout(layoutId);
        dispatch.dashboard.removeLayout(layoutId);
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to delete dashboard layout';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    // Widget effects
    async createWidget(widgetData: Omit<Widget, 'id'>) {
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.createWidget(widgetData);
        dispatch.dashboard.addWidget(response.data);
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create widget';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async updateWidget(payload: { id: string; data: Partial<Widget> }) {
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.updateWidget(payload.id, payload.data);
        dispatch.dashboard.updateWidget({ data: payload.data, ...response.data } as Widget & { data: Partial<Widget> });
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update widget';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    async deleteWidget(widgetId: string) {
      dispatch.dashboard.clearError();
      
      try {
        await dashboardApi.deleteWidget(widgetId);
        dispatch.dashboard.removeWidget(widgetId);
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to delete widget';
        dispatch.dashboard.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    // Data effects
    async refreshWidgetData(widgetId: string) {
      dispatch.dashboard.setWidgetLoading({ widgetId, loading: true });
      
      try {
        const response = await dashboardApi.getWidgetData(widgetId, {});
        dispatch.dashboard.updateWidgetData({ 
          widgetId, 
          data: response.data 
        });
      } catch (error: any) {
        dispatch.dashboard.updateWidgetData({ 
          widgetId, 
          data: null, 
          error: error.message || 'Failed to load widget data' 
        });
      }
    },
    
    async refreshAllWidgets() {
      // Get widgets from state - this would need to be passed as parameter in real implementation
      const widgets: any[] = [];
      
      await Promise.all(
        widgets.map((widget: any) => 
          dispatch.dashboard.refreshWidgetData(widget.id)
        )
      );
      
      dispatch.dashboard.setLastRefresh(new Date().toISOString());
    },
    
    async fetchMetrics(filters?: Partial<DashboardFilters>) {
      dispatch.dashboard.setDataLoading(true);
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.getMetrics(filters || {});
        dispatch.dashboard.setMetrics(response.data);
      } catch (error: any) {
        dispatch.dashboard.setError(error.message || 'Failed to fetch metrics');
      }
    },
    
    async fetchCharts(filters?: Partial<DashboardFilters>) {
      dispatch.dashboard.setDataLoading(true);
      dispatch.dashboard.clearError();
      
      try {
        const response = await dashboardApi.getCharts(filters || {});
        dispatch.dashboard.setCharts(response.data);
      } catch (error: any) {
        dispatch.dashboard.setError(error.message || 'Failed to fetch charts');
      }
    },
    
    // Initialization
    async initializeDashboard() {
      await Promise.all([
        dispatch.dashboard.fetchLayouts(),
        dispatch.dashboard.fetchMetrics(),
        dispatch.dashboard.fetchCharts(),
      ]);
      
      // Refresh all widgets after layout is loaded
      if (this.widgets.length > 0) {
        await dispatch.dashboard.refreshAllWidgets();
      }
    },
    
    // Auto-refresh
    async startAutoRefresh(intervalMs: number = 300000) { // 5 minutes default
      const refreshInterval = setInterval(() => {
        dispatch.dashboard.refreshAllWidgets();
      }, intervalMs);
      
      // Store interval ID for cleanup (would need to be handled in component)
      return refreshInterval;
    },
  }),
});

export type DashboardModel = typeof dashboardModel;
