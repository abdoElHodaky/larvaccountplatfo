<?php

namespace Modules\Accounting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'journal_entry_id',
        'account_id',
        'transaction_date',
        'description',
        'reference',
        'debit_amount',
        'credit_amount',
        'amount',
        'currency',
        'exchange_rate',
        'base_amount',
        'reconciled',
        'reconciled_at',
        'created_by',
        'metadata',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'debit_amount' => 'decimal:2',
        'credit_amount' => 'decimal:2',
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'base_amount' => 'decimal:2',
        'reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $dates = [
        'transaction_date',
        'reconciled_at',
        'deleted_at',
    ];

    /**
     * Get the organization this transaction belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the journal entry this transaction belongs to
     */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    /**
     * Get the account this transaction affects
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who created this transaction
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Scope for debit transactions
     */
    public function scopeDebits($query)
    {
        return $query->where('debit_amount', '>', 0);
    }

    /**
     * Scope for credit transactions
     */
    public function scopeCredits($query)
    {
        return $query->where('credit_amount', '>', 0);
    }

    /**
     * Scope for reconciled transactions
     */
    public function scopeReconciled($query)
    {
        return $query->where('reconciled', true);
    }

    /**
     * Scope for unreconciled transactions
     */
    public function scopeUnreconciled($query)
    {
        return $query->where('reconciled', false);
    }

    /**
     * Scope by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    /**
     * Scope by account
     */
    public function scopeForAccount($query, $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope by currency
     */
    public function scopeByCurrency($query, string $currency)
    {
        return $query->where('currency', $currency);
    }

    /**
     * Check if transaction is a debit
     */
    public function isDebit(): bool
    {
        return $this->debit_amount > 0;
    }

    /**
     * Check if transaction is a credit
     */
    public function isCredit(): bool
    {
        return $this->credit_amount > 0;
    }

    /**
     * Get the transaction amount (positive for debits, negative for credits)
     */
    public function getSignedAmountAttribute(): float
    {
        return $this->isDebit() ? $this->debit_amount : -$this->credit_amount;
    }

    /**
     * Get the absolute transaction amount
     */
    public function getAbsoluteAmountAttribute(): float
    {
        return $this->debit_amount ?: $this->credit_amount;
    }

    /**
     * Get transaction type (debit or credit)
     */
    public function getTypeAttribute(): string
    {
        return $this->isDebit() ? 'debit' : 'credit';
    }

    /**
     * Mark transaction as reconciled
     */
    public function markAsReconciled(): void
    {
        $this->update([
            'reconciled' => true,
            'reconciled_at' => now(),
        ]);
    }

    /**
     * Mark transaction as unreconciled
     */
    public function markAsUnreconciled(): void
    {
        $this->update([
            'reconciled' => false,
            'reconciled_at' => null,
        ]);
    }

    /**
     * Convert amount to base currency
     */
    public function convertToBaseCurrency(): float
    {
        if ($this->currency === $this->organization->currency) {
            return $this->absolute_amount;
        }

        return $this->absolute_amount * $this->exchange_rate;
    }

    /**
     * Get formatted amount for display
     */
    public function getFormattedAmountAttribute(): string
    {
        $amount = $this->absolute_amount;
        $currency = $this->currency ?: $this->organization->currency;
        
        return number_format($amount, 2) . ' ' . $currency;
    }

    /**
     * Get formatted signed amount for display
     */
    public function getFormattedSignedAmountAttribute(): string
    {
        $amount = $this->signed_amount;
        $currency = $this->currency ?: $this->organization->currency;
        $sign = $amount >= 0 ? '+' : '';
        
        return $sign . number_format($amount, 2) . ' ' . $currency;
    }

    /**
     * Validate transaction data
     */
    public function validateTransaction(): array
    {
        $errors = [];

        // Must have either debit or credit amount, but not both
        if ($this->debit_amount > 0 && $this->credit_amount > 0) {
            $errors[] = 'Transaction cannot have both debit and credit amounts';
        }

        if ($this->debit_amount <= 0 && $this->credit_amount <= 0) {
            $errors[] = 'Transaction must have either debit or credit amount';
        }

        // Amount must match debit or credit amount
        $expectedAmount = $this->debit_amount ?: $this->credit_amount;
        if (abs($this->amount - $expectedAmount) > 0.01) {
            $errors[] = 'Amount does not match debit/credit amount';
        }

        // Transaction date cannot be in the future
        if ($this->transaction_date > now()->toDateString()) {
            $errors[] = 'Transaction date cannot be in the future';
        }

        // Account must exist and be active
        if (!$this->account || !$this->account->is_active) {
            $errors[] = 'Account must exist and be active';
        }

        // Exchange rate required for foreign currency
        if ($this->currency !== $this->organization->currency && !$this->exchange_rate) {
            $errors[] = 'Exchange rate required for foreign currency transactions';
        }

        return $errors;
    }

    /**
     * Create a reversal transaction
     */
    public function createReversal(string $reason = null): self
    {
        $reversal = $this->replicate();
        
        // Swap debit and credit amounts
        $reversal->debit_amount = $this->credit_amount;
        $reversal->credit_amount = $this->debit_amount;
        $reversal->amount = -$this->amount;
        $reversal->base_amount = -$this->base_amount;
        
        // Update description
        $reversal->description = 'REVERSAL: ' . $this->description;
        if ($reason) {
            $reversal->description .= ' - ' . $reason;
        }
        
        // Add metadata
        $reversal->metadata = array_merge($this->metadata ?? [], [
            'reversal_of' => $this->id,
            'reversal_reason' => $reason,
            'reversed_at' => now()->toISOString(),
        ]);
        
        $reversal->save();
        
        return $reversal;
    }

    /**
     * Check if transaction can be edited
     */
    public function canBeEdited(): bool
    {
        // Reconciled transactions cannot be edited
        if ($this->reconciled) {
            return false;
        }

        // Check if journal entry is posted
        if ($this->journalEntry && $this->journalEntry->status === JournalEntry::STATUS_POSTED) {
            return false;
        }

        return true;
    }

    /**
     * Check if transaction can be deleted
     */
    public function canBeDeleted(): bool
    {
        // Use same rules as editing
        return $this->canBeEdited();
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            // Set amount based on debit/credit
            if (!$transaction->amount) {
                $transaction->amount = $transaction->debit_amount ?: $transaction->credit_amount;
            }

            // Set base amount if not provided
            if (!$transaction->base_amount) {
                $transaction->base_amount = $transaction->convertToBaseCurrency();
            }

            // Set currency from organization if not provided
            if (!$transaction->currency) {
                $transaction->currency = $transaction->organization->currency;
            }

            // Set exchange rate to 1 for base currency
            if (!$transaction->exchange_rate && $transaction->currency === $transaction->organization->currency) {
                $transaction->exchange_rate = 1.0;
            }
        });

        static::updating(function ($transaction) {
            // Validate that transaction can be edited
            if (!$transaction->canBeEdited()) {
                throw new \Exception('Transaction cannot be edited: it is reconciled or part of a posted journal entry.');
            }

            // Update base amount if amount or exchange rate changed
            if ($transaction->isDirty(['amount', 'exchange_rate'])) {
                $transaction->base_amount = $transaction->convertToBaseCurrency();
            }
        });

        static::deleting(function ($transaction) {
            if (!$transaction->canBeDeleted()) {
                throw new \Exception('Transaction cannot be deleted: it is reconciled or part of a posted journal entry.');
            }
        });

        static::saved(function ($transaction) {
            // Update account balance when transaction is saved
            if ($transaction->account) {
                $transaction->account->updateCurrentBalance();
            }
        });

        static::deleted(function ($transaction) {
            // Update account balance when transaction is deleted
            if ($transaction->account) {
                $transaction->account->updateCurrentBalance();
            }
        });
    }
}

