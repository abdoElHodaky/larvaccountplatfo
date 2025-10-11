<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JournalEntry extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'account_id',
        'transaction_id',
        'entry_date',
        'reference_number',
        'description',
        'debit_amount',
        'credit_amount',
        'balance_after',
        'entry_type',
        'source_type',
        'source_id',
        'is_adjusting',
        'is_closing',
        'fiscal_year',
        'fiscal_period',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'debit_amount' => 'decimal:2',
        'credit_amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'is_adjusting' => 'boolean',
        'is_closing' => 'boolean',
        'fiscal_year' => 'integer',
        'fiscal_period' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'entry_date',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Entry types
     */
    const TYPE_REGULAR = 'regular';

    const TYPE_ADJUSTING = 'adjusting';

    const TYPE_CLOSING = 'closing';

    const TYPE_OPENING = 'opening';

    const TYPE_REVERSING = 'reversing';

    /**
     * Source types
     */
    const SOURCE_MANUAL = 'manual';

    const SOURCE_INVOICE = 'invoice';

    const SOURCE_PAYMENT = 'payment';

    const SOURCE_PURCHASE = 'purchase';

    const SOURCE_PAYROLL = 'payroll';

    const SOURCE_INVENTORY = 'inventory';

    const SOURCE_DEPRECIATION = 'depreciation';

    const SOURCE_BANK_RECONCILIATION = 'bank_reconciliation';

    /**
     * Get the account that owns the journal entry
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the transaction that owns the journal entry
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Get the source model (polymorphic relationship)
     */
    public function source()
    {
        return $this->morphTo();
    }

    /**
     * Scope for debit entries
     */
    public function scopeDebits($query)
    {
        return $query->where('debit_amount', '>', 0);
    }

    /**
     * Scope for credit entries
     */
    public function scopeCredits($query)
    {
        return $query->where('credit_amount', '>', 0);
    }

    /**
     * Scope for entries by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('entry_date', [$startDate, $endDate]);
    }

    /**
     * Scope for entries by fiscal year
     */
    public function scopeFiscalYear($query, int $year)
    {
        return $query->where('fiscal_year', $year);
    }

    /**
     * Scope for entries by fiscal period
     */
    public function scopeFiscalPeriod($query, int $period)
    {
        return $query->where('fiscal_period', $period);
    }

    /**
     * Scope for adjusting entries
     */
    public function scopeAdjusting($query)
    {
        return $query->where('is_adjusting', true);
    }

    /**
     * Scope for closing entries
     */
    public function scopeClosing($query)
    {
        return $query->where('is_closing', true);
    }

    /**
     * Scope for regular entries (non-adjusting, non-closing)
     */
    public function scopeRegular($query)
    {
        return $query->where('is_adjusting', false)
            ->where('is_closing', false);
    }

    /**
     * Get the entry amount (debit or credit)
     */
    public function getAmount(): float
    {
        return $this->debit_amount > 0 ? $this->debit_amount : $this->credit_amount;
    }

    /**
     * Check if this is a debit entry
     */
    public function isDebit(): bool
    {
        return $this->debit_amount > 0;
    }

    /**
     * Check if this is a credit entry
     */
    public function isCredit(): bool
    {
        return $this->credit_amount > 0;
    }

    /**
     * Get the entry type (debit or credit)
     */
    public function getEntryType(): string
    {
        return $this->isDebit() ? 'debit' : 'credit';
    }

    /**
     * Get formatted reference number
     */
    public function getFormattedReference(): string
    {
        return $this->reference_number ?: 'JE-'.str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Update account balance after this entry
     */
    public function updateAccountBalance(): void
    {
        $account = $this->account;

        if ($account) {
            if ($this->isDebit()) {
                $account->updateBalance($this->debit_amount, 'debit');
            } else {
                $account->updateBalance($this->credit_amount, 'credit');
            }
        }
    }

    /**
     * Reverse this journal entry
     */
    public function reverse(?string $reason = null): JournalEntry
    {
        $reversalEntry = $this->replicate();
        $reversalEntry->debit_amount = $this->credit_amount;
        $reversalEntry->credit_amount = $this->debit_amount;
        $reversalEntry->description = 'Reversal: '.$this->description;
        $reversalEntry->entry_type = self::TYPE_REVERSING;
        $reversalEntry->metadata = array_merge($this->metadata ?? [], [
            'original_entry_id' => $this->id,
            'reversal_reason' => $reason,
        ]);
        $reversalEntry->save();

        return $reversalEntry;
    }
}
