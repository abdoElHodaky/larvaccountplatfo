<?php

namespace App\Features\Dashboard\Services\Application;

use App\Features\Dashboard\Contracts\WidgetRenderingServiceInterface;
use App\Features\Dashboard\Models\DashboardWidget;
use App\Features\Dashboard\Services\AdvancedDashboardService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class WidgetRenderingService implements WidgetRenderingServiceInterface
{
    protected AdvancedDashboardService $dashboardService;

    public function __construct(AdvancedDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get widget data for rendering
     */
    public function getWidgetData(DashboardWidget $widget): array
    {
        $config = $widget->getConfigurationWithDefaults();
        $organizationId = $widget->organization_id;

        return match ($widget->widget_type) {
            DashboardWidget::TYPE_FINANCIAL_SUMMARY => $this->getFinancialSummaryData($organizationId, $config),
            DashboardWidget::TYPE_REVENUE_CHART => $this->getRevenueChartData($organizationId, $config),
            DashboardWidget::TYPE_EXPENSE_CHART => $this->getExpenseChartData($organizationId, $config),
            DashboardWidget::TYPE_CASH_FLOW => $this->getCashFlowData($organizationId, $config),
            DashboardWidget::TYPE_BUDGET_OVERVIEW => $this->getBudgetOverviewData($organizationId, $config),
            DashboardWidget::TYPE_FORECAST_CHART => $this->getForecastChartData($organizationId, $config),
            DashboardWidget::TYPE_TAX_SUMMARY => $this->getTaxSummaryData($organizationId, $config),
            DashboardWidget::TYPE_KPI_METRICS => $this->getKpiMetricsData($organizationId, $config),
            DashboardWidget::TYPE_RECENT_ACTIVITY => $this->getRecentActivityData($organizationId, $config),
            DashboardWidget::TYPE_ALERTS => $this->getAlertsData($organizationId, $config),
            DashboardWidget::TYPE_QUICK_STATS => $this->getQuickStatsData($organizationId, $config),
            DashboardWidget::TYPE_BALANCE_SHEET => $this->getBalanceSheetData($organizationId, $config),
            DashboardWidget::TYPE_PROFIT_LOSS => $this->getProfitLossData($organizationId, $config),
            DashboardWidget::TYPE_ACCOUNTS_AGING => $this->getAccountsAgingData($organizationId, $config),
            DashboardWidget::TYPE_INVENTORY_STATUS => $this->getInventoryStatusData($organizationId, $config),
            default => ['error' => 'Unknown widget type'],
        };
    }

    /**
     * Render widget HTML
     */
    public function renderWidget(DashboardWidget $widget): string
    {
        $data = $this->getCachedWidgetData($widget);
        
        return view("dashboard.widgets.{$widget->widget_type}", [
            'widget' => $widget,
            'data' => $data,
        ])->render();
    }

    /**
     * Get widget data with caching
     */
    public function getCachedWidgetData(DashboardWidget $widget): array
    {
        $cacheKey = "widget_data_{$widget->id}_{$widget->updated_at->timestamp}";
        $cacheDuration = $widget->refresh_interval ?? 300; // Default 5 minutes

        return Cache::remember($cacheKey, $cacheDuration, function () use ($widget) {
            return $this->getWidgetData($widget);
        });
    }

    /**
     * Refresh widget cache
     */
    public function refreshWidgetCache(DashboardWidget $widget): void
    {
        $cacheKey = "widget_data_{$widget->id}_{$widget->updated_at->timestamp}";
        Cache::forget($cacheKey);
        
        // Pre-populate cache with fresh data
        $this->getCachedWidgetData($widget);
    }

    /**
     * Get widget performance metrics
     */
    public function getWidgetMetrics(DashboardWidget $widget): array
    {
        $startTime = microtime(true);
        $data = $this->getWidgetData($widget);
        $endTime = microtime(true);

        return [
            'render_time' => round(($endTime - $startTime) * 1000, 2), // milliseconds
            'data_size' => strlen(json_encode($data)),
            'cache_hit' => Cache::has("widget_data_{$widget->id}_{$widget->updated_at->timestamp}"),
            'last_updated' => $widget->updated_at,
            'refresh_interval' => $widget->refresh_interval ?? 300,
        ];
    }

    /**
     * Get financial summary widget data
     */
    protected function getFinancialSummaryData(int $organizationId, array $config): array
    {
        $summary = $this->dashboardService->getFinancialSummary($organizationId);

        return [
            'type' => 'financial_summary',
            'data' => [
                'current_month' => $summary['current_month'],
                'growth_rates' => $config['show_growth_rates'] ? $summary['growth_rates'] : null,
                'comparisons' => $config['show_comparisons'] ? $summary['previous_month'] : null,
                'year_to_date' => $summary['year_to_date'],
            ],
            'config' => $config,
            'last_updated' => Carbon::now()->toISOString(),
        ];
    }

    /**
     * Get revenue chart widget data
     */
    protected function getRevenueChartData(int $organizationId, array $config): array
    {
        $period = $config['period'] ?? 'last_12_months';
        $chartType = $config['chart_type'] ?? 'line';

        // Generate sample data based on period
        $data = $this->generateTimeSeriesData($organizationId, 'revenue', $period);

        $chartData = [
            'type' => 'chart',
            'chart_type' => $chartType,
            'data' => [
                'labels' => $data['labels'],
                'datasets' => [
                    [
                        'label' => 'Revenue',
                        'data' => $data['values'],
                        'borderColor' => '#10B981',
                        'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                        'fill' => $chartType === 'area',
                    ],
                ],
            ],
            'options' => [
                'responsive' => true,
                'scales' => [
                    'y' => [
                        'beginAtZero' => true,
                        'ticks' => [
                            'callback' => 'currency',
                        ],
                    ],
                ],
            ],
        ];

        // Add forecast data if enabled
        if ($config['show_forecast'] ?? false) {
            $forecastData = $this->generateForecastData($organizationId, 'revenue', 3);
            $chartData['data']['datasets'][] = [
                'label' => 'Forecast',
                'data' => $forecastData['values'],
                'borderColor' => '#6B7280',
                'backgroundColor' => 'rgba(107, 114, 128, 0.1)',
                'borderDash' => [5, 5],
                'fill' => false,
            ];
        }

        return $chartData;
    }

    /**
     * Generate time series data for charts
     */
    protected function generateTimeSeriesData(int $organizationId, string $type, string $period): array
    {
        // This would typically fetch real data from the database
        // For now, return sample data
        $labels = [];
        $values = [];

        $months = match ($period) {
            'last_3_months' => 3,
            'last_6_months' => 6,
            'last_12_months' => 12,
            'current_year' => 12,
            default => 6,
        };

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->format('M Y');
            $values[] = rand(10000, 50000); // Sample data
        }

        return [
            'labels' => $labels,
            'values' => $values,
        ];
    }

    /**
     * Generate forecast data
     */
    protected function generateForecastData(int $organizationId, string $type, int $months): array
    {
        // This would typically use the ForecastingService
        // For now, return sample forecast data
        $values = [];
        
        for ($i = 1; $i <= $months; $i++) {
            $values[] = rand(15000, 45000); // Sample forecast data
        }

        return [
            'values' => $values,
        ];
    }

    // Placeholder methods for other widget types
    protected function getExpenseChartData(int $organizationId, array $config): array
    {
        return ['type' => 'expense_chart', 'data' => []];
    }

    protected function getCashFlowData(int $organizationId, array $config): array
    {
        return ['type' => 'cash_flow', 'data' => []];
    }

    protected function getBudgetOverviewData(int $organizationId, array $config): array
    {
        return ['type' => 'budget_overview', 'data' => []];
    }

    protected function getForecastChartData(int $organizationId, array $config): array
    {
        return ['type' => 'forecast_chart', 'data' => []];
    }

    protected function getTaxSummaryData(int $organizationId, array $config): array
    {
        return ['type' => 'tax_summary', 'data' => []];
    }

    protected function getKpiMetricsData(int $organizationId, array $config): array
    {
        return ['type' => 'kpi_metrics', 'data' => []];
    }

    protected function getRecentActivityData(int $organizationId, array $config): array
    {
        return ['type' => 'recent_activity', 'data' => []];
    }

    protected function getAlertsData(int $organizationId, array $config): array
    {
        return ['type' => 'alerts', 'data' => []];
    }

    protected function getQuickStatsData(int $organizationId, array $config): array
    {
        return ['type' => 'quick_stats', 'data' => []];
    }

    protected function getBalanceSheetData(int $organizationId, array $config): array
    {
        return ['type' => 'balance_sheet', 'data' => []];
    }

    protected function getProfitLossData(int $organizationId, array $config): array
    {
        return ['type' => 'profit_loss', 'data' => []];
    }

    protected function getAccountsAgingData(int $organizationId, array $config): array
    {
        return ['type' => 'accounts_aging', 'data' => []];
    }

    protected function getInventoryStatusData(int $organizationId, array $config): array
    {
        return ['type' => 'inventory_status', 'data' => []];
    }
}

