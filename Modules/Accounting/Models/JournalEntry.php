<?php

namespace Modules\Accounting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'entry_number',
        'entry_date',
        'description',
        'reference',
        'status',
        'total_debits',
        'total_credits',
        'currency',
        'exchange_rate',
        'posted_at',
        'posted_by',
        'created_by',
        'source_type',
        'source_id',
        'metadata',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'total_debits' => 'decimal:2',
        'total_credits' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'posted_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $dates = [
        'entry_date',
        'posted_at',
        'deleted_at',
    ];

    /**
     * Journal entry statuses
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_POSTED = 'posted';
    const STATUS_REVERSED = 'reversed';

    /**
     * Get the organization this journal entry belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the transactions for this journal entry
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the user who created this journal entry
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get the user who posted this journal entry
     */
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'posted_by');
    }

    /**
     * Get the source model (polymorphic relationship)
     */
    public function source()
    {
        return $this->morphTo();
    }

    /**
     * Scope for draft entries
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope for posted entries
     */
    public function scopePosted($query)
    {
        return $query->where('status', self::STATUS_POSTED);
    }

    /**
     * Scope for reversed entries
     */
    public function scopeReversed($query)
    {
        return $query->where('status', self::STATUS_REVERSED);
    }

    /**
     * Scope by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('entry_date', [$startDate, $endDate]);
    }

    /**
     * Scope by currency
     */
    public function scopeByCurrency($query, string $currency)
    {
        return $query->where('currency', $currency);
    }

    /**
     * Check if journal entry is balanced
     */
    public function isBalanced(): bool
    {
        $this->calculateTotals();
        return abs($this->total_debits - $this->total_credits) < 0.01;
    }

    /**
     * Check if journal entry is posted
     */
    public function isPosted(): bool
    {
        return $this->status === self::STATUS_POSTED;
    }

    /**
     * Check if journal entry is draft
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if journal entry is reversed
     */
    public function isReversed(): bool
    {
        return $this->status === self::STATUS_REVERSED;
    }

    /**
     * Calculate totals from transactions
     */
    public function calculateTotals(): void
    {
        $this->total_debits = $this->transactions()->sum('debit_amount');
        $this->total_credits = $this->transactions()->sum('credit_amount');
    }

    /**
     * Post the journal entry
     */
    public function post(int $userId = null): bool
    {
        if ($this->isPosted()) {
            throw new \Exception('Journal entry is already posted.');
        }

        if (!$this->isBalanced()) {
            throw new \Exception('Journal entry is not balanced. Debits must equal credits.');
        }

        if ($this->transactions()->count() < 2) {
            throw new \Exception('Journal entry must have at least 2 transactions.');
        }

        // Validate all transactions
        foreach ($this->transactions as $transaction) {
            $errors = $transaction->validateTransaction();
            if (!empty($errors)) {
                throw new \Exception('Transaction validation failed: ' . implode(', ', $errors));
            }
        }

        $this->update([
            'status' => self::STATUS_POSTED,
            'posted_at' => now(),
            'posted_by' => $userId ?: auth()->id(),
        ]);

        // Update account balances
        foreach ($this->transactions as $transaction) {
            $transaction->account->updateCurrentBalance();
        }

        return true;
    }

    /**
     * Reverse the journal entry
     */
    public function reverse(string $reason = null, int $userId = null): self
    {
        if (!$this->isPosted()) {
            throw new \Exception('Only posted journal entries can be reversed.');
        }

        if ($this->isReversed()) {
            throw new \Exception('Journal entry is already reversed.');
        }

        // Create reversal journal entry
        $reversal = $this->replicate();
        $reversal->entry_number = $this->generateNextEntryNumber();
        $reversal->description = 'REVERSAL: ' . $this->description;
        if ($reason) {
            $reversal->description .= ' - ' . $reason;
        }
        $reversal->status = self::STATUS_DRAFT;
        $reversal->posted_at = null;
        $reversal->posted_by = null;
        $reversal->metadata = array_merge($this->metadata ?? [], [
            'reversal_of' => $this->id,
            'reversal_reason' => $reason,
        ]);
        $reversal->save();

        // Create reversal transactions
        foreach ($this->transactions as $transaction) {
            $reversalTransaction = $transaction->replicate();
            $reversalTransaction->journal_entry_id = $reversal->id;
            
            // Swap debit and credit amounts
            $reversalTransaction->debit_amount = $transaction->credit_amount;
            $reversalTransaction->credit_amount = $transaction->debit_amount;
            $reversalTransaction->amount = -$transaction->amount;
            $reversalTransaction->base_amount = -$transaction->base_amount;
            
            $reversalTransaction->description = 'REVERSAL: ' . $transaction->description;
            $reversalTransaction->metadata = array_merge($transaction->metadata ?? [], [
                'reversal_of' => $transaction->id,
                'reversal_reason' => $reason,
            ]);
            
            $reversalTransaction->save();
        }

        // Post the reversal
        $reversal->post($userId);

        // Mark original as reversed
        $this->update(['status' => self::STATUS_REVERSED]);

        return $reversal;
    }

    /**
     * Add a transaction to this journal entry
     */
    public function addTransaction(array $transactionData): Transaction
    {
        if ($this->isPosted()) {
            throw new \Exception('Cannot add transactions to posted journal entry.');
        }

        $transactionData['journal_entry_id'] = $this->id;
        $transactionData['organization_id'] = $this->organization_id;
        $transactionData['transaction_date'] = $this->entry_date;
        $transactionData['currency'] = $transactionData['currency'] ?? $this->currency;

        $transaction = Transaction::create($transactionData);

        // Recalculate totals
        $this->calculateTotals();
        $this->save();

        return $transaction;
    }

    /**
     * Remove a transaction from this journal entry
     */
    public function removeTransaction(int $transactionId): bool
    {
        if ($this->isPosted()) {
            throw new \Exception('Cannot remove transactions from posted journal entry.');
        }

        $transaction = $this->transactions()->find($transactionId);
        if (!$transaction) {
            return false;
        }

        $transaction->delete();

        // Recalculate totals
        $this->calculateTotals();
        $this->save();

        return true;
    }

    /**
     * Get debit transactions
     */
    public function getDebitTransactions()
    {
        return $this->transactions()->where('debit_amount', '>', 0)->get();
    }

    /**
     * Get credit transactions
     */
    public function getCreditTransactions()
    {
        return $this->transactions()->where('credit_amount', '>', 0)->get();
    }

    /**
     * Get formatted total debits
     */
    public function getFormattedTotalDebitsAttribute(): string
    {
        return number_format($this->total_debits, 2) . ' ' . $this->currency;
    }

    /**
     * Get formatted total credits
     */
    public function getFormattedTotalCreditsAttribute(): string
    {
        return number_format($this->total_credits, 2) . ' ' . $this->currency;
    }

    /**
     * Get balance difference (should be 0 for balanced entries)
     */
    public function getBalanceDifferenceAttribute(): float
    {
        return $this->total_debits - $this->total_credits;
    }

    /**
     * Check if journal entry can be edited
     */
    public function canBeEdited(): bool
    {
        return $this->isDraft();
    }

    /**
     * Check if journal entry can be deleted
     */
    public function canBeDeleted(): bool
    {
        return $this->isDraft();
    }

    /**
     * Generate next entry number
     */
    public function generateNextEntryNumber(): string
    {
        $year = $this->entry_date->year;
        $prefix = 'JE' . $year . '-';
        
        $lastEntry = self::where('organization_id', $this->organization_id)
            ->where('entry_number', 'like', $prefix . '%')
            ->orderBy('entry_number', 'desc')
            ->first();

        if (!$lastEntry) {
            return $prefix . '0001';
        }

        $lastNumber = (int) substr($lastEntry->entry_number, strlen($prefix));
        $nextNumber = $lastNumber + 1;

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_POSTED => 'Posted',
            self::STATUS_REVERSED => 'Reversed',
        ];
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($journalEntry) {
            // Generate entry number if not provided
            if (!$journalEntry->entry_number) {
                $journalEntry->entry_number = $journalEntry->generateNextEntryNumber();
            }

            // Set default status
            if (!$journalEntry->status) {
                $journalEntry->status = self::STATUS_DRAFT;
            }

            // Set currency from organization if not provided
            if (!$journalEntry->currency) {
                $journalEntry->currency = $journalEntry->organization->currency;
            }

            // Set exchange rate to 1 for base currency
            if (!$journalEntry->exchange_rate && $journalEntry->currency === $journalEntry->organization->currency) {
                $journalEntry->exchange_rate = 1.0;
            }
        });

        static::updating(function ($journalEntry) {
            // Validate that journal entry can be edited
            if ($journalEntry->isDirty() && !$journalEntry->canBeEdited()) {
                throw new \Exception('Journal entry cannot be edited: it is already posted.');
            }
        });

        static::deleting(function ($journalEntry) {
            if (!$journalEntry->canBeDeleted()) {
                throw new \Exception('Journal entry cannot be deleted: it is already posted.');
            }

            // Delete associated transactions
            $journalEntry->transactions()->delete();
        });

        static::saved(function ($journalEntry) {
            // Recalculate totals when saved
            if ($journalEntry->wasRecentlyCreated || $journalEntry->isDirty(['entry_date'])) {
                $journalEntry->calculateTotals();
                if ($journalEntry->isDirty(['total_debits', 'total_credits'])) {
                    $journalEntry->saveQuietly();
                }
            }
        });
    }
}

