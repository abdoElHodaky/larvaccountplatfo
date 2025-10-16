<?php

namespace App\Features\Dashboard\Services\Application;

use App\Features\Dashboard\Contracts\WidgetConfigurationServiceInterface;
use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Support\Facades\Validator;

class WidgetConfigurationService implements WidgetConfigurationServiceInterface
{
    /**
     * Get widget configuration schema
     */
    public function getConfigurationSchema(string $widgetType): array
    {
        return match ($widgetType) {
            DashboardWidget::TYPE_FINANCIAL_SUMMARY => [
                'show_growth_rates' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Growth Rates',
                    'description' => 'Display month-over-month growth percentages',
                ],
                'show_comparisons' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Comparisons',
                    'description' => 'Compare with previous period',
                ],
                'period' => [
                    'type' => 'select',
                    'default' => 'current_month',
                    'options' => [
                        'current_month' => 'Current Month',
                        'current_quarter' => 'Current Quarter',
                        'current_year' => 'Current Year',
                    ],
                    'label' => 'Period',
                    'description' => 'Time period for financial summary',
                ],
            ],
            DashboardWidget::TYPE_REVENUE_CHART => [
                'period' => [
                    'type' => 'select',
                    'default' => 'last_12_months',
                    'options' => [
                        'last_3_months' => 'Last 3 Months',
                        'last_6_months' => 'Last 6 Months',
                        'last_12_months' => 'Last 12 Months',
                        'current_year' => 'Current Year',
                    ],
                    'label' => 'Time Period',
                ],
                'chart_type' => [
                    'type' => 'select',
                    'default' => 'line',
                    'options' => [
                        'line' => 'Line Chart',
                        'bar' => 'Bar Chart',
                        'area' => 'Area Chart',
                    ],
                    'label' => 'Chart Type',
                ],
                'show_forecast' => [
                    'type' => 'boolean',
                    'default' => false,
                    'label' => 'Show Forecast',
                    'description' => 'Include revenue forecast data',
                ],
            ],
            DashboardWidget::TYPE_EXPENSE_CHART => [
                'period' => [
                    'type' => 'select',
                    'default' => 'last_12_months',
                    'options' => [
                        'last_3_months' => 'Last 3 Months',
                        'last_6_months' => 'Last 6 Months',
                        'last_12_months' => 'Last 12 Months',
                        'current_year' => 'Current Year',
                    ],
                    'label' => 'Time Period',
                ],
                'chart_type' => [
                    'type' => 'select',
                    'default' => 'bar',
                    'options' => [
                        'line' => 'Line Chart',
                        'bar' => 'Bar Chart',
                        'pie' => 'Pie Chart',
                        'doughnut' => 'Doughnut Chart',
                    ],
                    'label' => 'Chart Type',
                ],
                'group_by' => [
                    'type' => 'select',
                    'default' => 'category',
                    'options' => [
                        'category' => 'By Category',
                        'month' => 'By Month',
                        'account' => 'By Account',
                    ],
                    'label' => 'Group By',
                ],
            ],
            DashboardWidget::TYPE_CASH_FLOW => [
                'period' => [
                    'type' => 'select',
                    'default' => 'last_6_months',
                    'options' => [
                        'last_3_months' => 'Last 3 Months',
                        'last_6_months' => 'Last 6 Months',
                        'last_12_months' => 'Last 12 Months',
                    ],
                    'label' => 'Time Period',
                ],
                'show_forecast' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Forecast',
                ],
                'include_projections' => [
                    'type' => 'boolean',
                    'default' => false,
                    'label' => 'Include Projections',
                    'description' => 'Include projected cash flow based on pending transactions',
                ],
            ],
            DashboardWidget::TYPE_BUDGET_OVERVIEW => [
                'show_utilization' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Utilization',
                    'description' => 'Display budget utilization percentages',
                ],
                'show_variance' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Variance',
                    'description' => 'Display variance from budget',
                ],
                'period' => [
                    'type' => 'select',
                    'default' => 'current_year',
                    'options' => [
                        'current_month' => 'Current Month',
                        'current_quarter' => 'Current Quarter',
                        'current_year' => 'Current Year',
                    ],
                    'label' => 'Budget Period',
                ],
            ],
            DashboardWidget::TYPE_KPI_METRICS => [
                'metrics' => [
                    'type' => 'multiselect',
                    'default' => ['gross_margin', 'net_profit_margin', 'current_ratio'],
                    'options' => [
                        'gross_margin' => 'Gross Margin',
                        'net_profit_margin' => 'Net Profit Margin',
                        'current_ratio' => 'Current Ratio',
                        'debt_to_equity' => 'Debt to Equity',
                        'return_on_assets' => 'Return on Assets',
                        'inventory_turnover' => 'Inventory Turnover',
                    ],
                    'label' => 'KPI Metrics',
                ],
                'show_trends' => [
                    'type' => 'boolean',
                    'default' => true,
                    'label' => 'Show Trends',
                    'description' => 'Display trend indicators for each metric',
                ],
            ],
            default => [],
        };
    }

    /**
     * Validate widget configuration
     */
    public function validateConfiguration(string $widgetType, array $configuration): bool
    {
        $schema = $this->getConfigurationSchema($widgetType);
        $rules = [];

        foreach ($schema as $field => $fieldSchema) {
            $fieldRules = [];

            // Add type validation
            switch ($fieldSchema['type']) {
                case 'boolean':
                    $fieldRules[] = 'boolean';
                    break;
                case 'select':
                    $fieldRules[] = 'in:' . implode(',', array_keys($fieldSchema['options']));
                    break;
                case 'multiselect':
                    $fieldRules[] = 'array';
                    $rules["{$field}.*"] = 'in:' . implode(',', array_keys($fieldSchema['options']));
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'string':
                    $fieldRules[] = 'string';
                    break;
            }

            if (!empty($fieldRules)) {
                $rules[$field] = implode('|', $fieldRules);
            }
        }

        $validator = Validator::make($configuration, $rules);

        return !$validator->fails();
    }

    /**
     * Apply default configuration
     */
    public function applyDefaultConfiguration(string $widgetType): array
    {
        $schema = $this->getConfigurationSchema($widgetType);
        $defaults = [];

        foreach ($schema as $field => $fieldSchema) {
            if (isset($fieldSchema['default'])) {
                $defaults[$field] = $fieldSchema['default'];
            }
        }

        return $defaults;
    }

    /**
     * Update widget configuration
     */
    public function updateConfiguration(DashboardWidget $widget, array $configuration): DashboardWidget
    {
        // Validate configuration
        if (!$this->validateConfiguration($widget->widget_type, $configuration)) {
            throw new \InvalidArgumentException('Invalid widget configuration');
        }

        // Merge with existing configuration
        $currentConfig = $widget->configuration ?? [];
        $newConfig = array_merge($currentConfig, $configuration);

        $widget->update(['configuration' => $newConfig]);

        return $widget->fresh();
    }

    /**
     * Get available widget types
     */
    public function getAvailableWidgetTypes(): array
    {
        return [
            DashboardWidget::TYPE_FINANCIAL_SUMMARY => [
                'name' => 'Financial Summary',
                'description' => 'Overview of key financial metrics',
                'category' => 'Financial',
                'icon' => 'chart-bar',
                'size_options' => ['small', 'medium', 'large'],
                'default_size' => 'medium',
            ],
            DashboardWidget::TYPE_REVENUE_CHART => [
                'name' => 'Revenue Chart',
                'description' => 'Revenue trends over time',
                'category' => 'Financial',
                'icon' => 'trending-up',
                'size_options' => ['medium', 'large'],
                'default_size' => 'large',
            ],
            DashboardWidget::TYPE_EXPENSE_CHART => [
                'name' => 'Expense Chart',
                'description' => 'Expense breakdown and trends',
                'category' => 'Financial',
                'icon' => 'trending-down',
                'size_options' => ['medium', 'large'],
                'default_size' => 'large',
            ],
            DashboardWidget::TYPE_CASH_FLOW => [
                'name' => 'Cash Flow',
                'description' => 'Cash flow analysis and projections',
                'category' => 'Financial',
                'icon' => 'currency-dollar',
                'size_options' => ['medium', 'large'],
                'default_size' => 'large',
            ],
            DashboardWidget::TYPE_BUDGET_OVERVIEW => [
                'name' => 'Budget Overview',
                'description' => 'Budget vs actual performance',
                'category' => 'Planning',
                'icon' => 'calculator',
                'size_options' => ['medium', 'large'],
                'default_size' => 'medium',
            ],
            DashboardWidget::TYPE_KPI_METRICS => [
                'name' => 'KPI Metrics',
                'description' => 'Key performance indicators',
                'category' => 'Analytics',
                'icon' => 'chart-pie',
                'size_options' => ['small', 'medium', 'large'],
                'default_size' => 'medium',
            ],
            DashboardWidget::TYPE_RECENT_ACTIVITY => [
                'name' => 'Recent Activity',
                'description' => 'Latest transactions and activities',
                'category' => 'Activity',
                'icon' => 'clock',
                'size_options' => ['small', 'medium'],
                'default_size' => 'small',
            ],
            DashboardWidget::TYPE_ALERTS => [
                'name' => 'Alerts',
                'description' => 'Important notifications and alerts',
                'category' => 'Notifications',
                'icon' => 'exclamation-triangle',
                'size_options' => ['small', 'medium'],
                'default_size' => 'small',
            ],
        ];
    }

    /**
     * Get widget type capabilities
     */
    public function getWidgetTypeCapabilities(string $widgetType): array
    {
        $capabilities = [
            'supports_refresh' => true,
            'supports_export' => false,
            'supports_drill_down' => false,
            'supports_real_time' => false,
            'min_refresh_interval' => 60, // seconds
            'max_refresh_interval' => 3600, // seconds
        ];

        return match ($widgetType) {
            DashboardWidget::TYPE_FINANCIAL_SUMMARY => array_merge($capabilities, [
                'supports_export' => true,
                'supports_drill_down' => true,
            ]),
            DashboardWidget::TYPE_REVENUE_CHART => array_merge($capabilities, [
                'supports_export' => true,
                'supports_drill_down' => true,
                'min_refresh_interval' => 300,
            ]),
            DashboardWidget::TYPE_EXPENSE_CHART => array_merge($capabilities, [
                'supports_export' => true,
                'supports_drill_down' => true,
                'min_refresh_interval' => 300,
            ]),
            DashboardWidget::TYPE_RECENT_ACTIVITY => array_merge($capabilities, [
                'supports_real_time' => true,
                'min_refresh_interval' => 30,
            ]),
            DashboardWidget::TYPE_ALERTS => array_merge($capabilities, [
                'supports_real_time' => true,
                'min_refresh_interval' => 30,
            ]),
            default => $capabilities,
        };
    }
}

