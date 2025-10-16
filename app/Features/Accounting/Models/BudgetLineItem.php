<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class BudgetLineItem extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'budget_id',
        'account_id',
        'category',
        'description',
        'budgeted_amount',
        'actual_amount',
        'period_start',
        'period_end',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'budgeted_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Budget categories
     */
    public const CATEGORY_REVENUE = 'revenue';

    public const CATEGORY_EXPENSE = 'expense';

    public const CATEGORY_CAPITAL = 'capital';

    public const CATEGORY_OTHER = 'other';

    /**
     * Get the budget that owns the line item
     */
    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    /**
     * Get the account associated with the line item
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope for filtering by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope for filtering by period
     */
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('period_start', [$startDate, $endDate])
                ->orWhereBetween('period_end', [$startDate, $endDate])
                ->orWhere(function ($q2) use ($startDate, $endDate) {
                    $q2->where('period_start', '<=', $startDate)
                        ->where('period_end', '>=', $endDate);
                });
        });
    }

    /**
     * Calculate variance for this line item
     */
    public function calculateVariance(): array
    {
        $variance = $this->actual_amount - $this->budgeted_amount;
        $variancePercent = $this->budgeted_amount > 0 ? ($variance / $this->budgeted_amount) * 100 : 0;

        return [
            'budgeted' => $this->budgeted_amount,
            'actual' => $this->actual_amount,
            'variance' => $variance,
            'variance_percent' => $variancePercent,
            'status' => $variance > 0 ? 'over_budget' : ($variance < 0 ? 'under_budget' : 'on_budget'),
        ];
    }

    /**
     * Check if this line item is over budget
     */
    public function isOverBudget(): bool
    {
        return $this->actual_amount > $this->budgeted_amount;
    }

    /**
     * Get utilization percentage
     */
    public function getUtilizationPercentage(): float
    {
        return $this->budgeted_amount > 0 ? ($this->actual_amount / $this->budgeted_amount) * 100 : 0;
    }

    /**
     * Update actual amount
     */
    public function updateActualAmount(float $amount): bool
    {
        $this->actual_amount = $amount;

        return $this->save();
    }

    /**
     * Get formatted category
     */
    public function getFormattedCategoryAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_REVENUE => 'Revenue',
            self::CATEGORY_EXPENSE => 'Expense',
            self::CATEGORY_CAPITAL => 'Capital',
            self::CATEGORY_OTHER => 'Other',
            default => 'Unknown Category',
        };
    }

    /**
     * Get variance status color
     */
    public function getVarianceStatusColorAttribute(): string
    {
        $variance = $this->calculateVariance();

        return match ($variance['status']) {
            'over_budget' => 'red',
            'under_budget' => 'green',
            'on_budget' => 'blue',
            default => 'gray',
        };
    }
}
