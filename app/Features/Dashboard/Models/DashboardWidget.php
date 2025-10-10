<?php

namespace App\Features\Dashboard\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DashboardWidget extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'user_id',
        'widget_type',
        'title',
        'description',
        'position_x',
        'position_y',
        'width',
        'height',
        'configuration',
        'is_active',
        'refresh_interval',
        'data_source',
        'filters',
        'display_options',
        'permissions',
        'metadata',
    ];

    protected $casts = [
        'position_x' => 'integer',
        'position_y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'is_active' => 'boolean',
        'refresh_interval' => 'integer',
        'configuration' => 'array',
        'filters' => 'array',
        'display_options' => 'array',
        'permissions' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Widget types
     */
    const TYPE_FINANCIAL_SUMMARY = 'financial_summary';
    const TYPE_REVENUE_CHART = 'revenue_chart';
    const TYPE_EXPENSE_CHART = 'expense_chart';
    const TYPE_CASH_FLOW = 'cash_flow';
    const TYPE_BUDGET_OVERVIEW = 'budget_overview';
    const TYPE_FORECAST_CHART = 'forecast_chart';
    const TYPE_TAX_SUMMARY = 'tax_summary';
    const TYPE_KPI_METRICS = 'kpi_metrics';
    const TYPE_RECENT_ACTIVITY = 'recent_activity';
    const TYPE_ALERTS = 'alerts';
    const TYPE_QUICK_STATS = 'quick_stats';
    const TYPE_BALANCE_SHEET = 'balance_sheet';
    const TYPE_PROFIT_LOSS = 'profit_loss';
    const TYPE_ACCOUNTS_AGING = 'accounts_aging';
    const TYPE_INVENTORY_STATUS = 'inventory_status';

    /**
     * Data sources
     */
    const SOURCE_ACCOUNTING = 'accounting';
    const SOURCE_BUDGET = 'budget';
    const SOURCE_FORECAST = 'forecast';
    const SOURCE_TAX = 'tax';
    const SOURCE_INVENTORY = 'inventory';
    const SOURCE_SALES = 'sales';
    const SOURCE_PURCHASE = 'purchase';

    /**
     * Get the user that owns the widget
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Scope for active widgets
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for filtering by widget type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('widget_type', $type);
    }

    /**
     * Scope for filtering by data source
     */
    public function scopeByDataSource($query, $source)
    {
        return $query->where('data_source', $source);
    }

    /**
     * Scope for user's widgets
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Get widget configuration with defaults
     */
    public function getConfigurationWithDefaults(): array
    {
        $defaults = $this->getDefaultConfiguration();
        return array_merge($defaults, $this->configuration ?? []);
    }

    /**
     * Get default configuration based on widget type
     */
    public function getDefaultConfiguration(): array
    {
        return match ($this->widget_type) {
            self::TYPE_FINANCIAL_SUMMARY => [
                'show_growth_rates' => true,
                'show_comparisons' => true,
                'period' => 'current_month',
                'currency_format' => true,
            ],
            self::TYPE_REVENUE_CHART => [
                'chart_type' => 'line',
                'period' => 'last_12_months',
                'show_forecast' => false,
                'show_budget' => false,
            ],
            self::TYPE_EXPENSE_CHART => [
                'chart_type' => 'bar',
                'period' => 'last_12_months',
                'group_by' => 'category',
                'show_budget' => true,
            ],
            self::TYPE_CASH_FLOW => [
                'chart_type' => 'area',
                'period' => 'last_6_months',
                'show_projections' => true,
                'breakdown' => 'monthly',
            ],
            self::TYPE_BUDGET_OVERVIEW => [
                'show_variances' => true,
                'show_utilization' => true,
                'alert_threshold' => 90,
                'period' => 'current_budget',
            ],
            self::TYPE_KPI_METRICS => [
                'metrics' => ['revenue', 'expenses', 'profit_margin', 'cash_flow'],
                'show_trends' => true,
                'comparison_period' => 'previous_month',
            ],
            self::TYPE_RECENT_ACTIVITY => [
                'limit' => 10,
                'show_amounts' => true,
                'filter_types' => [],
                'auto_refresh' => true,
            ],
            default => [],
        };
    }

    /**
     * Get display options with defaults
     */
    public function getDisplayOptionsWithDefaults(): array
    {
        $defaults = [
            'show_title' => true,
            'show_border' => true,
            'background_color' => 'white',
            'text_color' => 'dark',
            'font_size' => 'medium',
            'padding' => 'normal',
        ];

        return array_merge($defaults, $this->display_options ?? []);
    }

    /**
     * Check if user can view this widget
     */
    public function canView($user): bool
    {
        // Widget owner can always view
        if ($this->user_id === $user->id) {
            return true;
        }

        // Check organization access
        if ($this->organization_id !== $user->organization_id) {
            return false;
        }

        // Check permissions
        $permissions = $this->permissions ?? [];
        
        if (empty($permissions)) {
            return true; // No restrictions
        }

        // Check role-based permissions
        if (isset($permissions['roles']) && !empty($permissions['roles'])) {
            $userRoles = $user->roles->pluck('name')->toArray();
            if (!array_intersect($userRoles, $permissions['roles'])) {
                return false;
            }
        }

        // Check user-specific permissions
        if (isset($permissions['users']) && !empty($permissions['users'])) {
            if (!in_array($user->id, $permissions['users'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user can edit this widget
     */
    public function canEdit($user): bool
    {
        // Only widget owner can edit by default
        return $this->user_id === $user->id;
    }

    /**
     * Update widget position
     */
    public function updatePosition(int $x, int $y): bool
    {
        $this->position_x = $x;
        $this->position_y = $y;
        return $this->save();
    }

    /**
     * Update widget size
     */
    public function updateSize(int $width, int $height): bool
    {
        $this->width = $width;
        $this->height = $height;
        return $this->save();
    }

    /**
     * Toggle widget active status
     */
    public function toggleActive(): bool
    {
        $this->is_active = !$this->is_active;
        return $this->save();
    }

    /**
     * Update widget configuration
     */
    public function updateConfiguration(array $configuration): bool
    {
        $this->configuration = array_merge($this->configuration ?? [], $configuration);
        return $this->save();
    }

    /**
     * Get formatted widget type
     */
    public function getFormattedTypeAttribute(): string
    {
        return match ($this->widget_type) {
            self::TYPE_FINANCIAL_SUMMARY => 'Financial Summary',
            self::TYPE_REVENUE_CHART => 'Revenue Chart',
            self::TYPE_EXPENSE_CHART => 'Expense Chart',
            self::TYPE_CASH_FLOW => 'Cash Flow',
            self::TYPE_BUDGET_OVERVIEW => 'Budget Overview',
            self::TYPE_FORECAST_CHART => 'Forecast Chart',
            self::TYPE_TAX_SUMMARY => 'Tax Summary',
            self::TYPE_KPI_METRICS => 'KPI Metrics',
            self::TYPE_RECENT_ACTIVITY => 'Recent Activity',
            self::TYPE_ALERTS => 'Alerts & Notifications',
            self::TYPE_QUICK_STATS => 'Quick Statistics',
            self::TYPE_BALANCE_SHEET => 'Balance Sheet',
            self::TYPE_PROFIT_LOSS => 'Profit & Loss',
            self::TYPE_ACCOUNTS_AGING => 'Accounts Aging',
            self::TYPE_INVENTORY_STATUS => 'Inventory Status',
            default => 'Unknown Widget',
        };
    }

    /**
     * Get widget icon
     */
    public function getIconAttribute(): string
    {
        return match ($this->widget_type) {
            self::TYPE_FINANCIAL_SUMMARY => 'chart-line',
            self::TYPE_REVENUE_CHART => 'trending-up',
            self::TYPE_EXPENSE_CHART => 'trending-down',
            self::TYPE_CASH_FLOW => 'dollar-sign',
            self::TYPE_BUDGET_OVERVIEW => 'target',
            self::TYPE_FORECAST_CHART => 'activity',
            self::TYPE_TAX_SUMMARY => 'file-text',
            self::TYPE_KPI_METRICS => 'bar-chart',
            self::TYPE_RECENT_ACTIVITY => 'clock',
            self::TYPE_ALERTS => 'bell',
            self::TYPE_QUICK_STATS => 'grid',
            self::TYPE_BALANCE_SHEET => 'balance-scale',
            self::TYPE_PROFIT_LOSS => 'pie-chart',
            self::TYPE_ACCOUNTS_AGING => 'calendar',
            self::TYPE_INVENTORY_STATUS => 'package',
            default => 'square',
        };
    }

    /**
     * Get refresh interval in seconds
     */
    public function getRefreshIntervalSeconds(): int
    {
        return ($this->refresh_interval ?? 300) * 1000; // Convert to milliseconds for frontend
    }

    /**
     * Check if widget should auto-refresh
     */
    public function shouldAutoRefresh(): bool
    {
        return $this->is_active && ($this->refresh_interval ?? 0) > 0;
    }
}
