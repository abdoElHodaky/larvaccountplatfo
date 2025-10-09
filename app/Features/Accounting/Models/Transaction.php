<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'transaction_date',
        'reference_number',
        'description',
        'total_amount',
        'status',
        'type',
        'source_type',
        'source_id',
        'currency',
        'exchange_rate',
        'fiscal_year',
        'fiscal_period',
        'is_recurring',
        'recurring_frequency',
        'next_occurrence',
        'tags',
        'metadata',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'total_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'fiscal_year' => 'integer',
        'fiscal_period' => 'integer',
        'is_recurring' => 'boolean',
        'next_occurrence' => 'date',
        'tags' => 'array',
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'transaction_date',
        'next_occurrence',
        'approved_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Transaction statuses
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_POSTED = 'posted';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REVERSED = 'reversed';

    /**
     * Transaction types
     */
    const TYPE_JOURNAL_ENTRY = 'journal_entry';
    const TYPE_PAYMENT = 'payment';
    const TYPE_RECEIPT = 'receipt';
    const TYPE_TRANSFER = 'transfer';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_ACCRUAL = 'accrual';
    const TYPE_DEPRECIATION = 'depreciation';
    const TYPE_PAYROLL = 'payroll';

    /**
     * Recurring frequencies
     */
    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    const FREQUENCY_QUARTERLY = 'quarterly';
    const FREQUENCY_ANNUALLY = 'annually';

    /**
     * Get the journal entries for this transaction
     */
    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    /**
     * Get the source model (polymorphic relationship)
     */
    public function source()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created this transaction
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    /**
     * Get the user who approved this transaction
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    /**
     * Scope for transactions by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for draft transactions
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for approved transactions
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope for posted transactions
     */
    public function scopePosted($query)
    {
        return $query->where('status', self::STATUS_POSTED);
    }

    /**
     * Scope for transactions by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    /**
     * Scope for transactions by fiscal year
     */
    public function scopeFiscalYear($query, int $year)
    {
        return $query->where('fiscal_year', $year);
    }

    /**
     * Scope for transactions by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for recurring transactions
     */
    public function scopeRecurring($query)
    {
        return $query->where('is_recurring', true);
    }

    /**
     * Check if transaction is balanced (debits = credits)
     */
    public function isBalanced(): bool
    {
        $totalDebits = $this->journalEntries()->sum('debit_amount');
        $totalCredits = $this->journalEntries()->sum('credit_amount');
        
        return abs($totalDebits - $totalCredits) < 0.01; // Allow for rounding differences
    }

    /**
     * Get total debit amount
     */
    public function getTotalDebits(): float
    {
        return $this->journalEntries()->sum('debit_amount');
    }

    /**
     * Get total credit amount
     */
    public function getTotalCredits(): float
    {
        return $this->journalEntries()->sum('credit_amount');
    }

    /**
     * Check if transaction can be edited
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING]);
    }

    /**
     * Check if transaction can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->isBalanced();
    }

    /**
     * Check if transaction can be posted
     */
    public function canBePosted(): bool
    {
        return $this->status === self::STATUS_APPROVED && $this->isBalanced();
    }

    /**
     * Approve the transaction
     */
    public function approve(int $approvedBy = null): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->status = self::STATUS_APPROVED;
        $this->approved_by = $approvedBy ?: auth()->id();
        $this->approved_at = now();
        
        return $this->save();
    }

    /**
     * Post the transaction
     */
    public function post(): bool
    {
        if (!$this->canBePosted()) {
            return false;
        }

        \DB::transaction(function () {
            // Update account balances
            foreach ($this->journalEntries as $entry) {
                $entry->updateAccountBalance();
            }

            // Update transaction status
            $this->status = self::STATUS_POSTED;
            $this->save();
        });

        return true;
    }

    /**
     * Reverse the transaction
     */
    public function reverse(string $reason = null): Transaction
    {
        $reversalTransaction = $this->replicate();
        $reversalTransaction->status = self::STATUS_DRAFT;
        $reversalTransaction->description = 'Reversal: ' . $this->description;
        $reversalTransaction->metadata = array_merge($this->metadata ?? [], [
            'original_transaction_id' => $this->id,
            'reversal_reason' => $reason,
        ]);
        $reversalTransaction->save();

        // Create reversal journal entries
        foreach ($this->journalEntries as $entry) {
            $reversalEntry = $entry->reverse($reason);
            $reversalEntry->transaction_id = $reversalTransaction->id;
            $reversalEntry->save();
        }

        // Update original transaction status
        $this->status = self::STATUS_REVERSED;
        $this->save();

        return $reversalTransaction;
    }

    /**
     * Get formatted reference number
     */
    public function getFormattedReference(): string
    {
        return $this->reference_number ?: 'TXN-' . str_pad($this->id, 8, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate next occurrence for recurring transactions
     */
    public function calculateNextOccurrence(): ?\Carbon\Carbon
    {
        if (!$this->is_recurring || !$this->recurring_frequency) {
            return null;
        }

        $baseDate = $this->next_occurrence ?: $this->transaction_date;

        switch ($this->recurring_frequency) {
            case self::FREQUENCY_DAILY:
                return $baseDate->addDay();
            case self::FREQUENCY_WEEKLY:
                return $baseDate->addWeek();
            case self::FREQUENCY_MONTHLY:
                return $baseDate->addMonth();
            case self::FREQUENCY_QUARTERLY:
                return $baseDate->addMonths(3);
            case self::FREQUENCY_ANNUALLY:
                return $baseDate->addYear();
            default:
                return null;
        }
    }
}
