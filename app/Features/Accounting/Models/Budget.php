<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'budget_type',
        'period_type',
        'start_date',
        'end_date',
        'total_amount',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'metadata',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Budget types
     */
    const TYPE_OPERATIONAL = 'operational';

    const TYPE_CAPITAL = 'capital';

    const TYPE_PROJECT = 'project';

    const TYPE_DEPARTMENT = 'department';

    /**
     * Period types
     */
    const PERIOD_MONTHLY = 'monthly';

    const PERIOD_QUARTERLY = 'quarterly';

    const PERIOD_YEARLY = 'yearly';

    const PERIOD_CUSTOM = 'custom';

    /**
     * Budget statuses
     */
    const STATUS_DRAFT = 'draft';

    const STATUS_PENDING_APPROVAL = 'pending_approval';

    const STATUS_APPROVED = 'approved';

    const STATUS_ACTIVE = 'active';

    const STATUS_COMPLETED = 'completed';

    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the budget line items
     */
    public function lineItems(): HasMany
    {
        return $this->hasMany(BudgetLineItem::class);
    }

    /**
     * Get the user who created the budget
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    /**
     * Get the user who approved the budget
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
     * Scope for active budgets
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
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
     * Calculate total budgeted amount from line items
     */
    public function calculateTotalAmount(): float
    {
        return $this->lineItems()->sum('budgeted_amount');
    }

    /**
     * Calculate total actual amount from line items
     */
    public function calculateActualAmount(): float
    {
        return $this->lineItems()->sum('actual_amount');
    }

    /**
     * Calculate budget variance
     */
    public function calculateVariance(): array
    {
        $budgeted = $this->calculateTotalAmount();
        $actual = $this->calculateActualAmount();
        $variance = $actual - $budgeted;
        $variancePercent = $budgeted > 0 ? ($variance / $budgeted) * 100 : 0;

        return [
            'budgeted' => $budgeted,
            'actual' => $actual,
            'variance' => $variance,
            'variance_percent' => $variancePercent,
            'status' => $variance > 0 ? 'over_budget' : ($variance < 0 ? 'under_budget' : 'on_budget'),
        ];
    }

    /**
     * Check if budget is over budget
     */
    public function isOverBudget(): bool
    {
        return $this->calculateActualAmount() > $this->calculateTotalAmount();
    }

    /**
     * Get budget utilization percentage
     */
    public function getUtilizationPercentage(): float
    {
        $budgeted = $this->calculateTotalAmount();
        $actual = $this->calculateActualAmount();

        return $budgeted > 0 ? ($actual / $budgeted) * 100 : 0;
    }

    /**
     * Approve the budget
     */
    public function approve(int $approvedBy): bool
    {
        $this->status = self::STATUS_APPROVED;
        $this->approved_by = $approvedBy;
        $this->approved_at = now();

        return $this->save();
    }

    /**
     * Activate the budget
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
     * Get formatted budget type
     */
    public function getFormattedTypeAttribute(): string
    {
        return match ($this->budget_type) {
            self::TYPE_OPERATIONAL => 'Operational Budget',
            self::TYPE_CAPITAL => 'Capital Budget',
            self::TYPE_PROJECT => 'Project Budget',
            self::TYPE_DEPARTMENT => 'Department Budget',
            default => 'Unknown Budget Type',
        };
    }

    /**
     * Get formatted period type
     */
    public function getFormattedPeriodAttribute(): string
    {
        return match ($this->period_type) {
            self::PERIOD_MONTHLY => 'Monthly',
            self::PERIOD_QUARTERLY => 'Quarterly',
            self::PERIOD_YEARLY => 'Yearly',
            self::PERIOD_CUSTOM => 'Custom Period',
            default => 'Unknown Period',
        };
    }

    /**
     * Get formatted status
     */
    public function getFormattedStatusAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => 'Unknown Status',
        };
    }
}
