<?php

namespace Modules\Accounting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountBalance extends HybridModel
{
    protected $fillable = [
        'tenant_id',
        'account_id',
        'period_date',
        'period_type',
        'opening_balance',
        'debit_total',
        'credit_total',
        'closing_balance',
        'currency',
        'opening_balance_base',
        'debit_total_base',
        'credit_total_base',
        'closing_balance_base',
        'is_reconciled',
        'reconciled_at',
        'reconciled_by',
        'calculated_at',
        'calculated_by',
        'metadata',
    ];

    protected $casts = [
        'period_date' => 'date',
        'opening_balance' => 'decimal:2',
        'debit_total' => 'decimal:2',
        'credit_total' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'opening_balance_base' => 'decimal:2',
        'debit_total_base' => 'decimal:2',
        'credit_total_base' => 'decimal:2',
        'closing_balance_base' => 'decimal:2',
        'is_reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
        'calculated_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $dates = [
        'period_date',
        'reconciled_at',
        'calculated_at',
    ];

    /**
     * Period types
     */
    const PERIOD_DAILY = 'daily';
    const PERIOD_MONTHLY = 'monthly';
    const PERIOD_QUARTERLY = 'quarterly';
    const PERIOD_YEARLY = 'yearly';

    /**
     * Get the account this balance belongs to
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who reconciled this balance
     */
    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'reconciled_by');
    }

    /**
     * Get the user who calculated this balance
     */
    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'calculated_by');
    }

    /**
     * Scope for reconciled balances
     */
    public function scopeReconciled($query)
    {
        return $query->where('is_reconciled', true);
    }

    /**
     * Scope for unreconciled balances
     */
    public function scopeUnreconciled($query)
    {
        return $query->where('is_reconciled', false);
    }

    /**
     * Scope by period type
     */
    public function scopeByPeriodType($query, string $periodType)
    {
        return $query->where('period_type', $periodType);
    }

    /**
     * Scope by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('period_date', [$startDate, $endDate]);
    }

    /**
     * Scope for specific period
     */
    public function scopeForPeriod($query, $date, string $periodType)
    {
        return $query->where('period_date', $date)->where('period_type', $periodType);
    }

    /**
     * Calculate net change for the period
     */
    public function getNetChangeAttribute(): float
    {
        return $this->closing_balance - $this->opening_balance;
    }

    /**
     * Calculate net change in base currency
     */
    public function getNetChangeBaseAttribute(): float
    {
        return $this->closing_balance_base - $this->opening_balance_base;
    }

    /**
     * Get formatted opening balance
     */
    public function getFormattedOpeningBalanceAttribute(): string
    {
        return number_format($this->opening_balance, 2) . ' ' . $this->currency;
    }

    /**
     * Get formatted closing balance
     */
    public function getFormattedClosingBalanceAttribute(): string
    {
        return number_format($this->closing_balance, 2) . ' ' . $this->currency;
    }

    /**
     * Get formatted net change
     */
    public function getFormattedNetChangeAttribute(): string
    {
        $change = $this->net_change;
        $sign = $change >= 0 ? '+' : '';
        return $sign . number_format($change, 2) . ' ' . $this->currency;
    }

    /**
     * Check if balance is in credit (negative for asset/expense accounts)
     */
    public function isCredit(): bool
    {
        return $this->closing_balance < 0;
    }

    /**
     * Check if balance is in debit (positive for asset/expense accounts)
     */
    public function isDebit(): bool
    {
        return $this->closing_balance >= 0;
    }

    /**
     * Mark balance as reconciled
     */
    public function markAsReconciled(int $userId = null): void
    {
        $this->update([
            'is_reconciled' => true,
            'reconciled_at' => now(),
            'reconciled_by' => $userId ?: auth()->id(),
        ]);
    }

    /**
     * Mark balance as unreconciled
     */
    public function markAsUnreconciled(): void
    {
        $this->update([
            'is_reconciled' => false,
            'reconciled_at' => null,
            'reconciled_by' => null,
        ]);
    }

    /**
     * Calculate balance from transactions
     */
    public function calculateFromTransactions(): void
    {
        $account = $this->account;
        $periodStart = $this->getPeriodStartDate();
        $periodEnd = $this->period_date;

        // Get opening balance (closing balance of previous period)
        $previousBalance = self::where('account_id', $this->account_id)
            ->where('period_type', $this->period_type)
            ->where('period_date', '<', $this->period_date)
            ->orderBy('period_date', 'desc')
            ->first();

        $this->opening_balance = $previousBalance ? $previousBalance->closing_balance : 0;

        // Calculate period totals
        $periodTransactions = Transaction::where('account_id', $this->account_id)
            ->whereBetween('transaction_date', [$periodStart, $periodEnd])
            ->get();

        $this->debit_total = $periodTransactions->sum('debit_amount');
        $this->credit_total = $periodTransactions->sum('credit_amount');

        // Calculate closing balance based on account normal balance
        if ($account->normal_balance === Account::BALANCE_DEBIT) {
            $this->closing_balance = $this->opening_balance + $this->debit_total - $this->credit_total;
        } else {
            $this->closing_balance = $this->opening_balance + $this->credit_total - $this->debit_total;
        }

        // Calculate base currency amounts (simplified - assumes 1:1 for now)
        $this->opening_balance_base = $this->opening_balance;
        $this->debit_total_base = $this->debit_total;
        $this->credit_total_base = $this->credit_total;
        $this->closing_balance_base = $this->closing_balance;

        // Mark as calculated
        $this->calculated_at = now();
        $this->calculated_by = auth()->id();

        $this->save();
    }

    /**
     * Get period start date based on period type
     */
    public function getPeriodStartDate(): \Carbon\Carbon
    {
        $periodDate = $this->period_date;

        return match ($this->period_type) {
            self::PERIOD_DAILY => $periodDate->copy(),
            self::PERIOD_MONTHLY => $periodDate->copy()->startOfMonth(),
            self::PERIOD_QUARTERLY => $periodDate->copy()->startOfQuarter(),
            self::PERIOD_YEARLY => $periodDate->copy()->startOfYear(),
            default => $periodDate->copy(),
        };
    }

    /**
     * Get available period types
     */
    public static function getPeriodTypes(): array
    {
        return [
            self::PERIOD_DAILY => 'Daily',
            self::PERIOD_MONTHLY => 'Monthly',
            self::PERIOD_QUARTERLY => 'Quarterly',
            self::PERIOD_YEARLY => 'Yearly',
        ];
    }

    /**
     * Create or update balance for account and period
     */
    public static function createOrUpdateForPeriod(
        int $accountId,
        \Carbon\Carbon $periodDate,
        string $periodType
    ): self {
        $balance = self::firstOrNew([
            'account_id' => $accountId,
            'period_date' => $periodDate,
            'period_type' => $periodType,
        ]);

        $balance->tenant_id = tenant()->id;
        $balance->currency = $balance->account->currency ?? 'USD';
        $balance->calculateFromTransactions();

        return $balance;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($balance) {
            // Set tenant ID if not provided
            if (!$balance->tenant_id) {
                $balance->tenant_id = tenant()->id;
            }

            // Set currency from account if not provided
            if (!$balance->currency && $balance->account) {
                $balance->currency = $balance->account->currency ?? 'USD';
            }
        });
    }
}
