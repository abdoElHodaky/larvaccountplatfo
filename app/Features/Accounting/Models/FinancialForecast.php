<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class FinancialForecast extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'forecast_type',
        'period_type',
        'start_date',
        'end_date',
        'base_year',
        'methodology',
        'confidence_level',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'assumptions',
        'metadata',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'base_year' => 'integer',
        'confidence_level' => 'decimal:2',
        'approved_at' => 'datetime',
        'assumptions' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Forecast types
     */
    public const TYPE_REVENUE = 'revenue';

    public const TYPE_EXPENSE = 'expense';

    public const TYPE_CASH_FLOW = 'cash_flow';

    public const TYPE_PROFIT_LOSS = 'profit_loss';

    public const TYPE_BALANCE_SHEET = 'balance_sheet';

    public const TYPE_COMPREHENSIVE = 'comprehensive';

    /**
     * Period types
     */
    public const PERIOD_MONTHLY = 'monthly';

    public const PERIOD_QUARTERLY = 'quarterly';

    public const PERIOD_YEARLY = 'yearly';

    /**
     * Methodologies
     */
    public const METHOD_HISTORICAL_TREND = 'historical_trend';

    public const METHOD_REGRESSION_ANALYSIS = 'regression_analysis';

    public const METHOD_SEASONAL_ADJUSTMENT = 'seasonal_adjustment';

    public const METHOD_MARKET_BASED = 'market_based';

    public const METHOD_BOTTOM_UP = 'bottom_up';

    public const METHOD_TOP_DOWN = 'top_down';

    public const METHOD_SCENARIO_BASED = 'scenario_based';

    /**
     * Forecast statuses
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_IN_REVIEW = 'in_review';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_ARCHIVED = 'archived';

    /**
     * Get the forecast line items
     */
    public function lineItems(): HasMany
    {
        return $this->hasMany(ForecastLineItem::class);
    }

    /**
     * Get the user who created the forecast
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    /**
     * Get the user who approved the forecast
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for active forecasts
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    /**
     * Scope for filtering by forecast type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('forecast_type', $type);
    }

    /**
     * Scope for filtering by period
     */
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(function ($q2) use ($startDate, $endDate) {
                    $q2->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                });
        });
    }

    /**
     * Calculate forecast accuracy against actual results
     */
    public function calculateAccuracy(): array
    {
        $lineItems = $this->lineItems()->with('account')->get();
        $totalForecast = 0;
        $totalActual = 0;
        $accuracyByItem = [];

        foreach ($lineItems as $item) {
            $actual = $this->getActualAmount($item->account_id, $item->period_start, $item->period_end);
            $forecast = $item->forecasted_amount;

            $accuracy = $forecast > 0 ? (1 - abs($actual - $forecast) / $forecast) * 100 : 0;

            $accuracyByItem[] = [
                'account_id' => $item->account_id,
                'account_name' => $item->account->name ?? 'Unknown',
                'forecasted' => $forecast,
                'actual' => $actual,
                'variance' => $actual - $forecast,
                'accuracy' => max(0, $accuracy), // Ensure non-negative
            ];

            $totalForecast += $forecast;
            $totalActual += $actual;
        }

        $overallAccuracy = $totalForecast > 0 ? (1 - abs($totalActual - $totalForecast) / $totalForecast) * 100 : 0;

        return [
            'overall_accuracy' => max(0, $overallAccuracy),
            'total_forecasted' => $totalForecast,
            'total_actual' => $totalActual,
            'total_variance' => $totalActual - $totalForecast,
            'line_item_accuracy' => $accuracyByItem,
        ];
    }

    /**
     * Get actual amount for an account in a period
     */
    private function getActualAmount(int $accountId, $startDate, $endDate): float
    {
        return JournalEntry::where('account_id', $accountId)
            ->whereHas('transaction', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate])
                    ->where('status', Transaction::STATUS_POSTED);
            })
            ->sum('amount');
    }

    /**
     * Generate forecast scenarios
     */
    public function generateScenarios(): array
    {
        $baseCase = $this->lineItems()->sum('forecasted_amount');

        return [
            'optimistic' => [
                'name' => 'Optimistic Scenario',
                'multiplier' => 1.15,
                'amount' => $baseCase * 1.15,
                'description' => '15% above base case',
            ],
            'base' => [
                'name' => 'Base Case',
                'multiplier' => 1.0,
                'amount' => $baseCase,
                'description' => 'Most likely scenario',
            ],
            'pessimistic' => [
                'name' => 'Pessimistic Scenario',
                'multiplier' => 0.85,
                'amount' => $baseCase * 0.85,
                'description' => '15% below base case',
            ],
        ];
    }

    /**
     * Approve the forecast
     */
    public function approve(int $approvedBy): bool
    {
        $this->status = self::STATUS_APPROVED;
        $this->approved_by = $approvedBy;
        $this->approved_at = now();

        return $this->save();
    }

    /**
     * Activate the forecast
     */
    public function activate(): bool
    {
        if ($this->status !== self::STATUS_APPROVED) {
            return false;
        }

        $this->status = self::STATUS_ACTIVE;

        return $this->save();
    }

    /**
     * Archive the forecast
     */
    public function archive(): bool
    {
        $this->status = self::STATUS_ARCHIVED;

        return $this->save();
    }

    /**
     * Get forecast summary
     */
    public function getSummary(): array
    {
        $lineItems = $this->lineItems()->with('account')->get();
        $totalAmount = $lineItems->sum('forecasted_amount');

        $byAccount = $lineItems->groupBy('account.type')->map(function ($items) {
            return [
                'count' => $items->count(),
                'total' => $items->sum('forecasted_amount'),
                'average' => $items->avg('forecasted_amount'),
            ];
        });

        return [
            'total_amount' => $totalAmount,
            'line_item_count' => $lineItems->count(),
            'by_account_type' => $byAccount,
            'confidence_level' => $this->confidence_level,
            'methodology' => $this->methodology,
            'period_coverage' => $this->start_date->diffInDays($this->end_date) + 1,
        ];
    }

    /**
     * Get formatted forecast type
     */
    public function getFormattedTypeAttribute(): string
    {
        return match ($this->forecast_type) {
            self::TYPE_REVENUE => 'Revenue Forecast',
            self::TYPE_EXPENSE => 'Expense Forecast',
            self::TYPE_CASH_FLOW => 'Cash Flow Forecast',
            self::TYPE_PROFIT_LOSS => 'Profit & Loss Forecast',
            self::TYPE_BALANCE_SHEET => 'Balance Sheet Forecast',
            self::TYPE_COMPREHENSIVE => 'Comprehensive Financial Forecast',
            default => 'Unknown Forecast Type',
        };
    }

    /**
     * Get formatted methodology
     */
    public function getFormattedMethodologyAttribute(): string
    {
        return match ($this->methodology) {
            self::METHOD_HISTORICAL_TREND => 'Historical Trend Analysis',
            self::METHOD_REGRESSION_ANALYSIS => 'Regression Analysis',
            self::METHOD_SEASONAL_ADJUSTMENT => 'Seasonal Adjustment',
            self::METHOD_MARKET_BASED => 'Market-Based Forecasting',
            self::METHOD_BOTTOM_UP => 'Bottom-Up Approach',
            self::METHOD_TOP_DOWN => 'Top-Down Approach',
            self::METHOD_SCENARIO_BASED => 'Scenario-Based Forecasting',
            default => 'Unknown Methodology',
        };
    }

    /**
     * Get formatted status
     */
    public function getFormattedStatusAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_IN_REVIEW => 'In Review',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_ARCHIVED => 'Archived',
            default => 'Unknown Status',
        };
    }
}
