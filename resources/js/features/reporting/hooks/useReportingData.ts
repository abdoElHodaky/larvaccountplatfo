/**
 * Reporting Data Hooks - AlovaJS Integration
 * Phase 5+9: Advanced Data Management for Charts and Reports
 */

import { useRequest, usePagination } from 'alova/client';
import { restClient, createGraphQLQuery } from '@/shared/services/api/client';

// Types
export interface ChartData {
  id: string;
  name: string;
  type: 'pie' | 'bar' | 'line' | 'area' | 'doughnut';
  data: ChartDataPoint[];
  config: ChartConfig;
  created_at: string;
  updated_at: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  title?: string;
  subtitle?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  responsive?: boolean;
  animation?: boolean;
  height?: number;
  width?: number;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'financial' | 'operational' | 'custom';
  template_id?: string;
  filters: ReportFilters;
  charts: ChartData[];
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  account_types?: string[];
  departments?: string[];
  categories?: string[];
  custom_filters?: Record<string, any>;
}

export interface FinancialMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  profit_margin: number;
  assets: number;
  liabilities: number;
  equity: number;
  cash_flow: number;
}

// =============================================================================
// CHART DATA HOOKS
// =============================================================================

/**
 * Get chart data with caching and real-time updates
 */
export const useChartData = (chartId: string) => {
  return useRequest(
    restClient.Get(`/charts/${chartId}/data`),
    {
      initialData: null,
      cacheFor: 60000, // 1 minute cache for chart data
      transform: (response) => response.data,
    }
  );
};

/**
 * Get multiple charts data efficiently
 */
export const useChartsData = (chartIds: string[]) => {
  return useRequest(
    restClient.Post('/charts/batch', { chart_ids: chartIds }),
    {
      initialData: [],
      cacheFor: 60000, // 1 minute cache
      transform: (response) => response.data,
    }
  );
};

/**
 * Create new chart with optimistic updates
 */
export const useCreateChart = () => {
  return useRequest(
    (chartData: Omit<ChartData, 'id' | 'created_at' | 'updated_at'>) =>
      restClient.Post('/charts', chartData),
    {
      immediate: false,
      transform: (response) => response.data,
    }
  );
};

/**
 * Update chart data
 */
export const useUpdateChart = () => {
  return useRequest(
    ({ id, data }: { id: string; data: Partial<ChartData> }) =>
      restClient.Put(`/charts/${id}`, data),
    {
      immediate: false,
      transform: (response) => response.data,
    }
  );
};

// =============================================================================
// REPORT HOOKS
// =============================================================================

/**
 * Get paginated reports with advanced filtering
 */
export const useReports = (filters?: { type?: string; search?: string }) => {
  return usePagination(
    (page: number, pageSize: number) =>
      restClient.Get('/reports', {
        params: {
          ...filters,
          page,
          per_page: pageSize,
        },
      }),
    {
      initialPage: 1,
      initialPageSize: 10,
      preloadPreviousPage: false,
      preloadNextPage: true,
      transform: (response) => ({
        data: response.data,
        total: response.meta.total,
      }),
    }
  );
};

/**
 * Get single report with charts
 */
export const useReport = (reportId: string) => {
  return useRequest(
    restClient.Get(`/reports/${reportId}`, {
      params: { include: 'charts' },
    }),
    {
      initialData: null,
      cacheFor: 300000, // 5 minutes cache
      transform: (response) => response.data,
    }
  );
};

/**
 * Create new report
 */
export const useCreateReport = () => {
  return useRequest(
    (reportData: Omit<Report, 'id' | 'created_at' | 'updated_at'>) =>
      restClient.Post('/reports', reportData),
    {
      immediate: false,
      transform: (response) => response.data,
    }
  );
};

/**
 * Generate report data based on filters
 */
export const useGenerateReport = () => {
  return useRequest(
    (filters: ReportFilters) =>
      restClient.Post('/reports/generate', filters),
    {
      immediate: false,
      cacheFor: 60000, // 1 minute cache for generated reports
      transform: (response) => response.data,
    }
  );
};

// =============================================================================
// FINANCIAL METRICS HOOKS
// =============================================================================

/**
 * Get financial metrics with date range
 */
export const useFinancialMetrics = (dateFrom?: string, dateTo?: string) => {
  return useRequest(
    restClient.Get('/reports/financial-metrics', {
      params: { date_from: dateFrom, date_to: dateTo },
    }),
    {
      initialData: null,
      cacheFor: 300000, // 5 minutes cache
      transform: (response) => response.data,
    }
  );
};

/**
 * Get dashboard summary data
 */
export const useDashboardSummary = () => {
  return useRequest(
    restClient.Get('/reports/dashboard-summary'),
    {
      initialData: null,
      cacheFor: 60000, // 1 minute cache for dashboard
      transform: (response) => response.data,
    }
  );
};

// =============================================================================
// GRAPHQL HOOKS FOR ADVANCED REPORTING
// =============================================================================

/**
 * GraphQL query for comprehensive financial data
 */
const GET_FINANCIAL_REPORT_QUERY = `
  query GetFinancialReport($filters: ReportFilters!) {
    financialReport(filters: $filters) {
      summary {
        totalRevenue
        totalExpenses
        netProfit
        profitMargin
      }
      accountBalances {
        accountId
        accountName
        accountType
        balance
        currency
      }
      monthlyTrends {
        month
        revenue
        expenses
        profit
      }
      categoryBreakdown {
        category
        amount
        percentage
      }
    }
  }
`;

/**
 * Get comprehensive financial report via GraphQL
 */
export const useFinancialReportGraphQL = (filters: ReportFilters) => {
  return useRequest(
    createGraphQLQuery(GET_FINANCIAL_REPORT_QUERY, { filters }, {
      cacheFor: 300000, // 5 minutes cache
      transform: (data) => data.financialReport,
    }),
    {
      initialData: null,
    }
  );
};

/**
 * Real-time chart data subscription
 */
const CHART_DATA_SUBSCRIPTION = `
  subscription ChartDataUpdates($chartId: ID!) {
    chartDataUpdated(chartId: $chartId) {
      id
      data {
        label
        value
        color
      }
      lastUpdated
    }
  }
`;

/**
 * Subscribe to real-time chart updates
 */
export const useChartDataSubscription = (chartId: string) => {
  return useRequest(
    createGraphQLQuery(CHART_DATA_SUBSCRIPTION, { chartId }, {
      cacheFor: 0, // No cache for real-time data
      transform: (data) => data.chartDataUpdated,
    }),
    {
      initialData: null,
    }
  );
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Chart configuration presets
 */
export const useChartPresets = () => {
  const presets = {
    revenue: {
      type: 'line' as const,
      config: {
        title: 'Revenue Trend',
        colors: ['#3B82F6', '#10B981'],
        showLegend: true,
        animation: true,
      },
    },
    expenses: {
      type: 'bar' as const,
      config: {
        title: 'Expense Breakdown',
        colors: ['#EF4444', '#F59E0B', '#8B5CF6'],
        showLegend: true,
        animation: true,
      },
    },
    profitMargin: {
      type: 'area' as const,
      config: {
        title: 'Profit Margin',
        colors: ['#10B981'],
        showLegend: false,
        animation: true,
      },
    },
    accountTypes: {
      type: 'pie' as const,
      config: {
        title: 'Account Distribution',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        showLegend: true,
        animation: true,
      },
    },
  };

  return { presets };
};

/**
 * Report template configurations
 */
export const useReportTemplates = () => {
  const templates = [
    {
      id: 'income-statement',
      name: 'Income Statement',
      description: 'Comprehensive income statement with revenue and expense breakdown',
      type: 'financial' as const,
      defaultFilters: {
        account_types: ['revenue', 'expense'],
      },
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity overview',
      type: 'financial' as const,
      defaultFilters: {
        account_types: ['asset', 'liability', 'equity'],
      },
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Operating, investing, and financing activities',
      type: 'financial' as const,
      defaultFilters: {
        account_types: ['asset'],
        categories: ['cash', 'cash_equivalents'],
      },
    },
    {
      id: 'custom-dashboard',
      name: 'Custom Dashboard',
      description: 'Build your own dashboard with custom metrics',
      type: 'custom' as const,
      defaultFilters: {},
    },
  ];

  return { templates };
};

/**
 * Data formatting utilities for charts
 */
export const useChartFormatters = () => {
  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const generateColors = (count: number) => {
    const baseColors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    ];
    
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // Generate additional colors if needed
    const additionalColors = [];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      additionalColors.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    return [...baseColors, ...additionalColors];
  };

  return {
    formatCurrency,
    formatPercentage,
    formatNumber,
    generateColors,
  };
};
