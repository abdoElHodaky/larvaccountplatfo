<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountBalance extends HybridModel
{
    protected $fillable = [
        'organization_id',
        'account_id',
        'balance_date',
        'balance',
        'debit_balance',
        'credit_balance',
        'period_type',
        'fiscal_year',
        'fiscal_period',
        'is_closing_balance',
        'metadata',
    ];

    protected $casts = [
        'balance_date' => 'date',
        'balance' => 'decimal:2',
        'debit_balance' => 'decimal:2',
        'credit_balance' => 'decimal:2',
        'fiscal_year' => 'integer',
        'fiscal_period' => 'integer',
        'is_closing_balance' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = [
        'balance_date',
        'created_at',
        'updated_at',
    ];

    /**
     * Period types
     */
    const PERIOD_DAILY = 'daily';
    const PERIOD_WEEKLY = 'weekly';
    const PERIOD_MONTHLY = 'monthly';
    const PERIOD_QUARTERLY = 'quarterly';
    const PERIOD_YEARLY = 'yearly';

    /**
     * Get the account that owns the balance
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope for balances by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('balance_date', [$startDate, $endDate]);
    }

    /**
     * Scope for balances by fiscal year
     */
    public function scopeFiscalYear($query, int $year)
    {
        return $query->where('fiscal_year', $year);
    }

    /**
     * Scope for balances by fiscal period
     */
    public function scopeFiscalPeriod($query, int $period)
    {
        return $query->where('fiscal_period', $period);
    }

    /**
     * Scope for closing balances
     */
    public function scopeClosing($query)
    {
        return $query->where('is_closing_balance', true);
    }

    /**
     * Scope for period balances
     */
    public function scopeByPeriodType($query, string $periodType)
    {
        return $query->where('period_type', $periodType);
    }

    /**
     * Get the net balance (considering account type)
     */
    public function getNetBalance(): float
    {
        $account = $this->account;
        
        if (!$account) {
            return $this->balance;
        }

        if ($account->isDebitAccount()) {
            return $this->debit_balance - $this->credit_balance;
        } else {
            return $this->credit_balance - $this->debit_balance;
        }
    }

    /**
     * Check if balance is positive
     */
    public function isPositive(): bool
    {
        return $this->getNetBalance() > 0;
    }

    /**
     * Check if balance is negative
     */
    public function isNegative(): bool
    {
        return $this->getNetBalance() < 0;
    }

    /**
     * Get absolute balance value
     */
    public function getAbsoluteBalance(): float
    {
        return abs($this->getNetBalance());
    }
}
