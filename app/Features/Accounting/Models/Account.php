<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Account extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'parent_id',
        'code',
        'name',
        'description',
        'type',
        'subtype',
        'normal_balance',
        'is_active',
        'is_system',
        'level',
        'currency',
        'tax_type_id',
        'opening_balance',
        'current_balance',
        'settings',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'level' => 'integer',
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Account types
     */
    const TYPE_ASSET = 'asset';
    const TYPE_LIABILITY = 'liability';
    const TYPE_EQUITY = 'equity';
    const TYPE_REVENUE = 'revenue';
    const TYPE_EXPENSE = 'expense';

    /**
     * Account subtypes
     */
    const SUBTYPE_CURRENT_ASSET = 'current_asset';
    const SUBTYPE_FIXED_ASSET = 'fixed_asset';
    const SUBTYPE_CURRENT_LIABILITY = 'current_liability';
    const SUBTYPE_LONG_TERM_LIABILITY = 'long_term_liability';
    const SUBTYPE_OWNERS_EQUITY = 'owners_equity';
    const SUBTYPE_OPERATING_REVENUE = 'operating_revenue';
    const SUBTYPE_OTHER_REVENUE = 'other_revenue';
    const SUBTYPE_OPERATING_EXPENSE = 'operating_expense';
    const SUBTYPE_OTHER_EXPENSE = 'other_expense';

    /**
     * Normal balance types
     */
    const NORMAL_BALANCE_DEBIT = 'debit';
    const NORMAL_BALANCE_CREDIT = 'credit';

    /**
     * Get the parent account
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    /**
     * Get the child accounts
     */
    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    /**
     * Get all descendants (recursive)
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get the account balances
     */
    public function balances(): HasMany
    {
        return $this->hasMany(AccountBalance::class);
    }

    /**
     * Get the journal entries for this account
     */
    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    /**
     * Get the transactions for this account
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Scope for active accounts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for system accounts
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope for user-created accounts
     */
    public function scopeUserCreated($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope for accounts by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for root accounts (no parent)
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Get the full account path
     */
    public function getFullPath(): string
    {
        $path = [$this->name];
        $parent = $this->parent;

        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }

        return implode(' > ', $path);
    }

    /**
     * Get the full account code path
     */
    public function getFullCodePath(): string
    {
        $path = [$this->code];
        $parent = $this->parent;

        while ($parent) {
            array_unshift($path, $parent->code);
            $parent = $parent->parent;
        }

        return implode('.', $path);
    }

    /**
     * Check if account is a debit account
     */
    public function isDebitAccount(): bool
    {
        return $this->normal_balance === self::NORMAL_BALANCE_DEBIT;
    }

    /**
     * Check if account is a credit account
     */
    public function isCreditAccount(): bool
    {
        return $this->normal_balance === self::NORMAL_BALANCE_CREDIT;
    }

    /**
     * Get the current balance for a specific date
     */
    public function getBalanceAsOf(\DateTime $date): float
    {
        $balance = $this->balances()
                       ->where('balance_date', '<=', $date)
                       ->orderBy('balance_date', 'desc')
                       ->first();

        return $balance ? $balance->balance : $this->opening_balance;
    }

    /**
     * Update the current balance
     */
    public function updateBalance(float $amount, string $type = 'debit'): void
    {
        if ($this->isDebitAccount()) {
            $this->current_balance += ($type === 'debit') ? $amount : -$amount;
        } else {
            $this->current_balance += ($type === 'credit') ? $amount : -$amount;
        }

        $this->save();
    }

    /**
     * Get account hierarchy level
     */
    public function getHierarchyLevel(): int
    {
        $level = 0;
        $parent = $this->parent;

        while ($parent) {
            $level++;
            $parent = $parent->parent;
        }

        return $level;
    }
}
