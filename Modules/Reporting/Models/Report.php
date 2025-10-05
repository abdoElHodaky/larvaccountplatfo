<?php

namespace Modules\Reporting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'category',
        'query_config',
        'filters',
        'columns',
        'sorting',
        'grouping',
        'aggregations',
        'chart_config',
        'is_public',
        'is_scheduled',
        'schedule_config',
        'last_generated_at',
        'cache_duration',
        'created_by',
        'metadata',
    ];

    protected $casts = [
        'query_config' => 'array',
        'filters' => 'array',
        'columns' => 'array',
        'sorting' => 'array',
        'grouping' => 'array',
        'aggregations' => 'array',
        'chart_config' => 'array',
        'schedule_config' => 'array',
        'is_public' => 'boolean',
        'is_scheduled' => 'boolean',
        'last_generated_at' => 'datetime',
        'cache_duration' => 'integer',
        'metadata' => 'array',
    ];

    protected $dates = [
        'last_generated_at',
        'deleted_at',
    ];

    /**
     * Report types
     */
    const TYPE_FINANCIAL = 'financial';
    const TYPE_OPERATIONAL = 'operational';
    const TYPE_ANALYTICAL = 'analytical';
    const TYPE_COMPLIANCE = 'compliance';
    const TYPE_CUSTOM = 'custom';

    /**
     * Report categories
     */
    const CATEGORY_PROFIT_LOSS = 'profit_loss';
    const CATEGORY_BALANCE_SHEET = 'balance_sheet';
    const CATEGORY_CASH_FLOW = 'cash_flow';
    const CATEGORY_TRIAL_BALANCE = 'trial_balance';
    const CATEGORY_GENERAL_LEDGER = 'general_ledger';
    const CATEGORY_ACCOUNTS_RECEIVABLE = 'accounts_receivable';
    const CATEGORY_ACCOUNTS_PAYABLE = 'accounts_payable';
    const CATEGORY_INVENTORY = 'inventory';
    const CATEGORY_SALES = 'sales';
    const CATEGORY_EXPENSES = 'expenses';
    const CATEGORY_TAX = 'tax';
    const CATEGORY_BUDGET = 'budget';
    const CATEGORY_KPI = 'kpi';
    const CATEGORY_DASHBOARD = 'dashboard';

    /**
     * Chart types
     */
    const CHART_LINE = 'line';
    const CHART_BAR = 'bar';
    const CHART_PIE = 'pie';
    const CHART_DOUGHNUT = 'doughnut';
    const CHART_AREA = 'area';
    const CHART_SCATTER = 'scatter';
    const CHART_TABLE = 'table';

    /**
     * Get the organization this report belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the user who created this report
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get report executions
     */
    public function executions(): HasMany
    {
        return $this->hasMany(ReportExecution::class);
    }

    /**
     * Get report schedules
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(ReportSchedule::class);
    }

    /**
     * Scope for public reports
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope for scheduled reports
     */
    public function scopeScheduled($query)
    {
        return $query->where('is_scheduled', true);
    }

    /**
     * Scope by report type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Check if report needs regeneration
     */
    public function needsRegeneration(): bool
    {
        if (!$this->last_generated_at || !$this->cache_duration) {
            return true;
        }

        return $this->last_generated_at->addMinutes($this->cache_duration)->isPast();
    }

    /**
     * Get type display name
     */
    public function getTypeDisplayAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_FINANCIAL => 'Financial',
            self::TYPE_OPERATIONAL => 'Operational',
            self::TYPE_ANALYTICAL => 'Analytical',
            self::TYPE_COMPLIANCE => 'Compliance',
            self::TYPE_CUSTOM => 'Custom',
            default => 'Unknown',
        };
    }

    /**
     * Get category display name
     */
    public function getCategoryDisplayAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_PROFIT_LOSS => 'Profit & Loss',
            self::CATEGORY_BALANCE_SHEET => 'Balance Sheet',
            self::CATEGORY_CASH_FLOW => 'Cash Flow',
            self::CATEGORY_TRIAL_BALANCE => 'Trial Balance',
            self::CATEGORY_GENERAL_LEDGER => 'General Ledger',
            self::CATEGORY_ACCOUNTS_RECEIVABLE => 'Accounts Receivable',
            self::CATEGORY_ACCOUNTS_PAYABLE => 'Accounts Payable',
            self::CATEGORY_INVENTORY => 'Inventory',
            self::CATEGORY_SALES => 'Sales',
            self::CATEGORY_EXPENSES => 'Expenses',
            self::CATEGORY_TAX => 'Tax',
            self::CATEGORY_BUDGET => 'Budget',
            self::CATEGORY_KPI => 'KPI',
            self::CATEGORY_DASHBOARD => 'Dashboard',
            default => 'Unknown',
        ];
    }

    /**
     * Get available report types
     */
    public static function getReportTypes(): array
    {
        return [
            self::TYPE_FINANCIAL => 'Financial',
            self::TYPE_OPERATIONAL => 'Operational',
            self::TYPE_ANALYTICAL => 'Analytical',
            self::TYPE_COMPLIANCE => 'Compliance',
            self::TYPE_CUSTOM => 'Custom',
        ];
    }

    /**
     * Get available categories
     */
    public static function getCategories(): array
    {
        return [
            self::CATEGORY_PROFIT_LOSS => 'Profit & Loss',
            self::CATEGORY_BALANCE_SHEET => 'Balance Sheet',
            self::CATEGORY_CASH_FLOW => 'Cash Flow',
            self::CATEGORY_TRIAL_BALANCE => 'Trial Balance',
            self::CATEGORY_GENERAL_LEDGER => 'General Ledger',
            self::CATEGORY_ACCOUNTS_RECEIVABLE => 'Accounts Receivable',
            self::CATEGORY_ACCOUNTS_PAYABLE => 'Accounts Payable',
            self::CATEGORY_INVENTORY => 'Inventory',
            self::CATEGORY_SALES => 'Sales',
            self::CATEGORY_EXPENSES => 'Expenses',
            self::CATEGORY_TAX => 'Tax',
            self::CATEGORY_BUDGET => 'Budget',
            self::CATEGORY_KPI => 'KPI',
            self::CATEGORY_DASHBOARD => 'Dashboard',
        ];
    }

    /**
     * Get available chart types
     */
    public static function getChartTypes(): array
    {
        return [
            self::CHART_LINE => 'Line Chart',
            self::CHART_BAR => 'Bar Chart',
            self::CHART_PIE => 'Pie Chart',
            self::CHART_DOUGHNUT => 'Doughnut Chart',
            self::CHART_AREA => 'Area Chart',
            self::CHART_SCATTER => 'Scatter Plot',
            self::CHART_TABLE => 'Table',
        ];
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($report) {
            if (!isset($report->is_public)) {
                $report->is_public = false;
            }

            if (!isset($report->is_scheduled)) {
                $report->is_scheduled = false;
            }

            if (!$report->cache_duration) {
                $report->cache_duration = 60; // 1 hour default
            }
        });
    }
}

