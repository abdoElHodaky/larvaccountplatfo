<?php

namespace App\Features\Dashboard\Services;

use App\Features\Accounting\Services\AccountingService;
use App\Features\Accounting\Services\BudgetService;
use App\Features\Accounting\Services\ForecastingService;
use App\Features\Accounting\Services\TaxService;
use App\Features\Dashboard\Models\DashboardWidget;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class WidgetService
{
    protected AdvancedDashboardService $dashboardService;

    protected AccountingService $accountingService;

    protected BudgetService $budgetService;

    protected ForecastingService $forecastingService;

    protected TaxService $taxService;

    public function __construct(
        AdvancedDashboardService $dashboardService,
        AccountingService $accountingService,
        BudgetService $budgetService,
        ForecastingService $forecastingService,
        TaxService $taxService
    ) {
        $this->dashboardService = $dashboardService;
        $this->accountingService = $accountingService;
        $this->budgetService = $budgetService;
        $this->forecastingService = $forecastingService;
        $this->taxService = $taxService;
    }

    /**
     * Get widget data based on widget type and configuration
     */
    public function getWidgetData(DashboardWidget $widget): array
    {
        $cacheKey = "widget_data_{$widget->id}_{$widget->updated_at->timestamp}";
        $cacheDuration = $widget->refresh_interval ?? 300; // Default 5 minutes

        return Cache::remember($cacheKey, $cacheDuration, function () use ($widget) {
            return $this->generateWidgetData($widget);
        });
    }

    /**
     * Generate widget data based on type
     */
    protected function generateWidgetData(DashboardWidget $widget): array
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

        // Add budget data if enabled
        if ($config['show_budget'] ?? false) {
            $budgetData = $this->generateBudgetData($organizationId, 'revenue', $period);
            $chartData['data']['datasets'][] = [
                'label' => 'Budget',
                'data' => $budgetData['values'],
                'borderColor' => '#F59E0B',
                'backgroundColor' => 'rgba(245, 158, 11, 0.1)',
                'fill' => false,
            ];
        }

        return $chartData;
    }

    /**
     * Get expense chart widget data
     */
    protected function getExpenseChartData(int $organizationId, array $config): array
    {
        $period = $config['period'] ?? 'last_12_months';
        $chartType = $config['chart_type'] ?? 'bar';
        $groupBy = $config['group_by'] ?? 'category';

        if ($groupBy === 'category') {
            return $this->getExpensesByCategoryData($organizationId, $config);
        }

        // Time series expense data
        $data = $this->generateTimeSeriesData($organizationId, 'expenses', $period);

        return [
            'type' => 'chart',
            'chart_type' => $chartType,
            'data' => [
                'labels' => $data['labels'],
                'datasets' => [
                    [
                        'label' => 'Expenses',
                        'data' => $data['values'],
                        'borderColor' => '#EF4444',
                        'backgroundColor' => 'rgba(239, 68, 68, 0.8)',
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
    }

    /**
     * Get expenses by category data
     */
    protected function getExpensesByCategoryData(int $organizationId, array $config): array
    {
        // Sample expense categories
        $categories = [
            'Salaries & Wages' => 45000,
            'Rent & Utilities' => 12000,
            'Marketing' => 8500,
            'Office Supplies' => 3200,
            'Professional Services' => 6800,
            'Travel & Entertainment' => 4200,
            'Insurance' => 2800,
            'Other' => 5400,
        ];

        return [
            'type' => 'chart',
            'chart_type' => 'doughnut',
            'data' => [
                'labels' => array_keys($categories),
                'datasets' => [
                    [
                        'data' => array_values($categories),
                        'backgroundColor' => [
                            '#EF4444', '#F97316', '#F59E0B', '#EAB308',
                            '#84CC16', '#22C55E', '#10B981', '#14B8A6',
                        ],
                    ],
                ],
            ],
            'options' => [
                'responsive' => true,
                'plugins' => [
                    'legend' => [
                        'position' => 'right',
                    ],
                ],
            ],
        ];
    }

    /**
     * Get cash flow widget data
     */
    protected function getCashFlowData(int $organizationId, array $config): array
    {
        $period = $config['period'] ?? 'last_6_months';

        // Generate cash flow data
        $data = $this->generateCashFlowData($organizationId, $period);

        return [
            'type' => 'chart',
            'chart_type' => 'area',
            'data' => [
                'labels' => $data['labels'],
                'datasets' => [
                    [
                        'label' => 'Operating Cash Flow',
                        'data' => $data['operating'],
                        'borderColor' => '#10B981',
                        'backgroundColor' => 'rgba(16, 185, 129, 0.3)',
                        'fill' => true,
                    ],
                    [
                        'label' => 'Investing Cash Flow',
                        'data' => $data['investing'],
                        'borderColor' => '#3B82F6',
                        'backgroundColor' => 'rgba(59, 130, 246, 0.3)',
                        'fill' => true,
                    ],
                    [
                        'label' => 'Financing Cash Flow',
                        'data' => $data['financing'],
                        'borderColor' => '#8B5CF6',
                        'backgroundColor' => 'rgba(139, 92, 246, 0.3)',
                        'fill' => true,
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
                'plugins' => [
                    'legend' => [
                        'position' => 'top',
                    ],
                ],
            ],
        ];
    }

    /**
     * Get budget overview widget data
     */
    protected function getBudgetOverviewData(int $organizationId, array $config): array
    {
        $budgetOverview = $this->dashboardService->getBudgetOverview($organizationId);

        return [
            'type' => 'budget_overview',
            'data' => [
                'summary' => $budgetOverview['summary'],
                'active_budgets' => $budgetOverview['active_budgets'],
                'utilization_chart' => $this->generateBudgetUtilizationChart($budgetOverview['active_budgets']),
                'alerts' => $config['show_variances'] ? $budgetOverview['alerts'] : [],
            ],
            'config' => $config,
        ];
    }

    /**
     * Get KPI metrics widget data
     */
    protected function getKpiMetricsData(int $organizationId, array $config): array
    {
        $metrics = $config['metrics'] ?? ['revenue', 'expenses', 'profit_margin', 'cash_flow'];
        $performanceMetrics = $this->dashboardService->getPerformanceMetrics($organizationId);

        $kpiData = [];
        foreach ($metrics as $metric) {
            $kpiData[] = $this->getKpiMetric($metric, $performanceMetrics, $config);
        }

        return [
            'type' => 'kpi_metrics',
            'data' => $kpiData,
            'config' => $config,
        ];
    }

    /**
     * Get recent activity widget data
     */
    protected function getRecentActivityData(int $organizationId, array $config): array
    {
        $limit = $config['limit'] ?? 10;
        $activities = $this->dashboardService->getRecentActivity($organizationId, $limit);

        return [
            'type' => 'recent_activity',
            'data' => $activities,
            'config' => $config,
        ];
    }

    /**
     * Get alerts widget data
     */
    protected function getAlertsData(int $organizationId, array $config): array
    {
        $alerts = $this->dashboardService->getAlertsAndNotifications($organizationId);

        return [
            'type' => 'alerts',
            'data' => $alerts,
            'config' => $config,
        ];
    }

    /**
     * Get quick stats widget data
     */
    protected function getQuickStatsData(int $organizationId, array $config): array
    {
        $stats = $this->dashboardService->getQuickStats($organizationId);

        return [
            'type' => 'quick_stats',
            'data' => $stats,
            'config' => $config,
        ];
    }

    /**
     * Generate time series data for charts
     */
    protected function generateTimeSeriesData(int $organizationId, string $type, string $period): array
    {
        $months = match ($period) {
            'last_3_months' => 3,
            'last_6_months' => 6,
            'last_12_months' => 12,
            default => 12,
        };

        $labels = [];
        $values = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->format('M Y');

            // Generate realistic sample data
            $baseValue = match ($type) {
                'revenue' => 45000,
                'expenses' => 32000,
                default => 25000,
            };

            $seasonalFactor = 1 + (sin(($date->month - 1) * pi() / 6) * 0.2);
            $randomFactor = 1 + ((rand(-15, 15) / 100));

            $values[] = round($baseValue * $seasonalFactor * $randomFactor, 2);
        }

        return ['labels' => $labels, 'values' => $values];
    }

    /**
     * Generate cash flow data
     */
    protected function generateCashFlowData(int $organizationId, string $period): array
    {
        $months = match ($period) {
            'last_3_months' => 3,
            'last_6_months' => 6,
            'last_12_months' => 12,
            default => 6,
        };

        $labels = [];
        $operating = [];
        $investing = [];
        $financing = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->format('M Y');

            $operating[] = rand(15000, 35000);
            $investing[] = rand(-8000, 5000);
            $financing[] = rand(-5000, 10000);
        }

        return [
            'labels' => $labels,
            'operating' => $operating,
            'investing' => $investing,
            'financing' => $financing,
        ];
    }

    /**
     * Generate budget utilization chart
     */
    protected function generateBudgetUtilizationChart(array $budgets): array
    {
        $labels = [];
        $utilized = [];
        $remaining = [];

        foreach ($budgets as $budget) {
            $labels[] = $budget['budget_name'];
            $utilization = $budget['utilization'];
            $utilized[] = $utilization;
            $remaining[] = 100 - $utilization;
        }

        return [
            'type' => 'bar',
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Utilized',
                        'data' => $utilized,
                        'backgroundColor' => '#10B981',
                    ],
                    [
                        'label' => 'Remaining',
                        'data' => $remaining,
                        'backgroundColor' => '#E5E7EB',
                    ],
                ],
            ],
            'options' => [
                'responsive' => true,
                'scales' => [
                    'x' => ['stacked' => true],
                    'y' => ['stacked' => true, 'max' => 100],
                ],
            ],
        ];
    }

    /**
     * Get individual KPI metric
     */
    protected function getKpiMetric(string $metric, array $performanceMetrics, array $config): array
    {
        return match ($metric) {
            'revenue' => [
                'name' => 'Revenue',
                'value' => 125000,
                'change' => 12.5,
                'trend' => 'up',
                'icon' => 'trending-up',
                'color' => 'green',
            ],
            'expenses' => [
                'name' => 'Expenses',
                'value' => 87500,
                'change' => -3.2,
                'trend' => 'down',
                'icon' => 'trending-down',
                'color' => 'red',
            ],
            'profit_margin' => [
                'name' => 'Profit Margin',
                'value' => 30.0,
                'change' => 2.1,
                'trend' => 'up',
                'icon' => 'percent',
                'color' => 'blue',
                'format' => 'percentage',
            ],
            'cash_flow' => [
                'name' => 'Cash Flow',
                'value' => 37500,
                'change' => 8.7,
                'trend' => 'up',
                'icon' => 'dollar-sign',
                'color' => 'green',
            ],
            default => [
                'name' => ucfirst($metric),
                'value' => 0,
                'change' => 0,
                'trend' => 'stable',
                'icon' => 'bar-chart',
                'color' => 'gray',
            ],
        };
    }

    // Placeholder methods for additional widget types
    protected function getForecastChartData(int $organizationId, array $config): array
    {
        return ['type' => 'forecast_chart', 'data' => []];
    }

    protected function getTaxSummaryData(int $organizationId, array $config): array
    {
        return ['type' => 'tax_summary', 'data' => []];
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

    protected function generateForecastData(int $organizationId, string $type, int $months): array
    {
        return ['values' => []];
    }

    protected function generateBudgetData(int $organizationId, string $type, string $period): array
    {
        return ['values' => []];
    }
}
