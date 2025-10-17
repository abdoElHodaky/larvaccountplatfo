/**
 * Dashboard REST API Service
 * Connects frontend to the new Laravel Dashboard API endpoints
 * Maintains compatibility with existing GraphQL interface
 */

import axios, { AxiosResponse } from 'axios';
import { log } from '../../../shared/utils/logger';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard Types (matching backend models)
export interface DashboardWidget {
  id: number;
  organization_id: number;
  user_id: number;
  widget_type: string;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  id: number;
  organization_id: number;
  user_id: number;
  grid_columns: number;
  grid_rows: string;
  widget_positions?: Record<string, any>;
  theme: string;
  sidebar_collapsed: boolean;
  header_visible: boolean;
  footer_visible: boolean;
  custom_css?: string;
  responsive_breakpoints?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DashboardPreference {
  id: number;
  organization_id: number;
  user_id: number;
  auto_refresh: boolean;
  refresh_interval: number;
  show_animations: boolean;
  compact_mode: boolean;
  show_tooltips: boolean;
  currency_format: string;
  date_format: string;
  time_format: string;
  timezone: string;
  language: string;
  email_alerts: boolean;
  browser_notifications: boolean;
  sound_alerts: boolean;
  share_analytics: boolean;
  track_usage: boolean;
  high_contrast: boolean;
  large_text: boolean;
  reduced_motion: boolean;
  screen_reader_support: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  preferences: DashboardPreference;
  analytics: any;
  performance: any;
}

export interface WidgetData {
  widget: DashboardWidget;
  data: any;
  metrics: any;
}

export interface CreateWidgetRequest {
  widget_type: string;
  title: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  configuration?: Record<string, any>;
  position?: number;
}

export interface UpdateWidgetRequest {
  title?: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  configuration?: Record<string, any>;
  position?: number;
  is_active?: boolean;
}

export interface DashboardFilters {
  widget_type?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  options?: Record<string, any>;
}

export interface ReportOptions {
  report_type: 'executive_summary' | 'financial_analysis' | 'performance_metrics' | 'trend_analysis' | 'budget_variance' | 'forecast_report';
  options?: Record<string, any>;
}

/**
 * Dashboard REST API Service Class
 */
export class DashboardRestApiService {
  private baseUrl = '/api/dashboard';
  private widgetsUrl = '/api/dashboard/widgets';

  private async handleRequest<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
    try {
      const response = await request;
      
      if (!response.data.success) {
        throw new Error(response.data.error || response.data.message || 'API request failed');
      }
      
      return response.data.data as T;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
      log.error('Dashboard API Error:', error, 'DashboardRestAPI');
      throw new Error(errorMessage);
    }
  }

  // Dashboard Methods
  async getDashboard(): Promise<DashboardData> {
    return this.handleRequest(
      axios.get<ApiResponse<DashboardData>>(this.baseUrl)
    );
  }

  async refreshDashboard(): Promise<boolean> {
    return this.handleRequest(
      axios.post<ApiResponse<boolean>>(`${this.baseUrl}/refresh`)
    );
  }

  async getPerformanceInsights(): Promise<any> {
    return this.handleRequest(
      axios.get<ApiResponse<any>>(`${this.baseUrl}/performance`)
    );
  }

  async getWidgetRecommendations(): Promise<any[]> {
    return this.handleRequest(
      axios.get<ApiResponse<any[]>>(`${this.baseUrl}/recommendations`)
    );
  }

  async customizeDashboard(layout?: Record<string, any>, preferences?: Record<string, any>): Promise<boolean> {
    return this.handleRequest(
      axios.put<ApiResponse<boolean>>(`${this.baseUrl}/customize`, {
        layout,
        preferences
      })
    );
  }

  async exportDashboard(options: ExportOptions): Promise<{ file_path: string; download_url: string }> {
    return this.handleRequest(
      axios.post<ApiResponse<{ file_path: string; download_url: string }>>(`${this.baseUrl}/export`, options)
    );
  }

  async generateReport(options: ReportOptions): Promise<any> {
    return this.handleRequest(
      axios.post<ApiResponse<any>>(`${this.baseUrl}/reports`, options)
    );
  }

  // Widget Methods
  async getWidgets(filters?: DashboardFilters): Promise<{ data: DashboardWidget[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.handleRequest(
      axios.get<ApiResponse<{ data: DashboardWidget[]; total: number; per_page: number; current_page: number }>>(
        `${this.widgetsUrl}?${params.toString()}`
      )
    );
  }

  async createWidget(widgetData: CreateWidgetRequest): Promise<DashboardWidget> {
    return this.handleRequest(
      axios.post<ApiResponse<DashboardWidget>>(this.widgetsUrl, widgetData)
    );
  }

  async getWidget(widgetId: number): Promise<WidgetData> {
    return this.handleRequest(
      axios.get<ApiResponse<WidgetData>>(`${this.widgetsUrl}/${widgetId}`)
    );
  }

  async updateWidget(widgetId: number, widgetData: UpdateWidgetRequest): Promise<DashboardWidget> {
    return this.handleRequest(
      axios.put<ApiResponse<DashboardWidget>>(`${this.widgetsUrl}/${widgetId}`, widgetData)
    );
  }

  async deleteWidget(widgetId: number): Promise<boolean> {
    return this.handleRequest(
      axios.delete<ApiResponse<boolean>>(`${this.widgetsUrl}/${widgetId}`)
    );
  }

  async duplicateWidget(widgetId: number, options?: { title?: string; position?: number }): Promise<DashboardWidget> {
    return this.handleRequest(
      axios.post<ApiResponse<DashboardWidget>>(`${this.widgetsUrl}/${widgetId}/duplicate`, options)
    );
  }

  async reorderWidgets(widgetOrder: number[]): Promise<boolean> {
    return this.handleRequest(
      axios.post<ApiResponse<boolean>>(`${this.widgetsUrl}/reorder`, { widget_order: widgetOrder })
    );
  }

  async updateWidgetConfiguration(widgetId: number, configuration: Record<string, any>): Promise<DashboardWidget> {
    return this.handleRequest(
      axios.put<ApiResponse<DashboardWidget>>(`${this.widgetsUrl}/${widgetId}/configuration`, { configuration })
    );
  }

  async getConfigurationSchema(widgetType: string): Promise<any> {
    return this.handleRequest(
      axios.get<ApiResponse<any>>(`${this.widgetsUrl}/types/${widgetType}/schema`)
    );
  }

  async getAvailableWidgetTypes(): Promise<any[]> {
    return this.handleRequest(
      axios.get<ApiResponse<any[]>>(`${this.widgetsUrl}/types`)
    );
  }

  async refreshWidgetData(widgetId: number): Promise<any> {
    return this.handleRequest(
      axios.post<ApiResponse<any>>(`${this.widgetsUrl}/${widgetId}/refresh`)
    );
  }

  // Compatibility Methods (for existing GraphQL interface)
  async getLayouts(): Promise<{ data: DashboardLayout[] }> {
    const dashboard = await this.getDashboard();
    return {
      data: [dashboard.layout]
    };
  }

  async getMetrics(filters?: any): Promise<{ data: any[] }> {
    const insights = await this.getPerformanceInsights();
    return {
      data: insights.metrics || []
    };
  }

  async getCharts(filters?: any): Promise<{ data: any[] }> {
    const insights = await this.getPerformanceInsights();
    return {
      data: insights.charts || []
    };
  }

  async getWidgetData(widgetId: number, filters?: any): Promise<{ data: any }> {
    const widgetData = await this.getWidget(widgetId);
    return {
      data: widgetData.data
    };
  }

  // Real-time subscription simulation
  async subscribeToWidgetUpdates(widgetId: number, callback: (data: any) => void): Promise<() => void> {
    const interval = setInterval(async () => {
      try {
        const response = await this.refreshWidgetData(widgetId);
        callback(response);
      } catch (error) {
        log.error('Failed to fetch widget update', error, 'DashboardRestAPI');
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }
}

// Create and export singleton instance
export const dashboardRestApi = new DashboardRestApiService();

// Export for backward compatibility
export const dashboardApi = dashboardRestApi;
