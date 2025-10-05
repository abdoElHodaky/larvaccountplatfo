<?php

namespace Modules\Accounting\Models;

use Modules\Shared\Models\HybridModel;
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
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'level' => 'integer',
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'settings' => 'array',
    ];

    protected $dates = [
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
    const SUBTYPE_NON_CURRENT_ASSET = 'non_current_asset';
    const SUBTYPE_CURRENT_LIABILITY = 'current_liability';
    const SUBTYPE_NON_CURRENT_LIABILITY = 'non_current_liability';
    const SUBTYPE_OWNERS_EQUITY = 'owners_equity';
    const SUBTYPE_OPERATING_REVENUE = 'operating_revenue';
    const SUBTYPE_NON_OPERATING_REVENUE = 'non_operating_revenue';
    const SUBTYPE_OPERATING_EXPENSE = 'operating_expense';
    const SUBTYPE_NON_OPERATING_EXPENSE = 'non_operating_expense';

    /**
     * Normal balance types
     */
    const BALANCE_DEBIT = 'debit';
    const BALANCE_CREDIT = 'credit';

    /**
     * Get the parent account
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    /**
     * Get child accounts
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
     * Get journal entries for this account
     */
    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    /**
     * Get transactions for this account
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the organization this account belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
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
     * Scope by account type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope by account subtype
     */
    public function scopeOfSubtype($query, string $subtype)
    {
        return $query->where('subtype', $subtype);
    }

    /**
     * Scope for root accounts (no parent)
     */
    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope for leaf accounts (no children)
     */
    public function scopeLeaves($query)
    {
        return $query->whereDoesntHave('children');
    }

    /**
     * Get account hierarchy path
     */
    public function getHierarchyPathAttribute(): string
    {
        $path = [];
        $account = $this;
        
        while ($account) {
            array_unshift($path, $account->name);
            $account = $account->parent;
        }
        
        return implode(' > ', $path);
    }

    /**
     * Get full account code with hierarchy
     */
    public function getFullCodeAttribute(): string
    {
        $codes = [];
        $account = $this;
        
        while ($account) {
            array_unshift($codes, $account->code);
            $account = $account->parent;
        }
        
        return implode('.', $codes);
    }

    /**
     * Check if account is a parent account
     */
    public function isParent(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Check if account is a leaf account
     */
    public function isLeaf(): bool
    {
        return !$this->isParent();
    }

    /**
     * Check if account is a root account
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Check if account can be deleted
     */
    public function canBeDeleted(): bool
    {
        // System accounts cannot be deleted
        if ($this->is_system) {
            return false;
        }

        // Accounts with children cannot be deleted
        if ($this->isParent()) {
            return false;
        }

        // Accounts with transactions cannot be deleted
        if ($this->transactions()->exists()) {
            return false;
        }

        return true;
    }

    /**
     * Get account balance as of a specific date
     */
    public function getBalanceAsOf(\DateTime $date = null): float
    {
        $date = $date ?: now();
        
        $balance = $this->transactions()
            ->where('transaction_date', '<=', $date)
            ->sum('amount');

        // Adjust for normal balance type
        if ($this->normal_balance === self::BALANCE_CREDIT) {
            $balance = -$balance;
        }

        return (float) $balance;
    }

    /**
     * Update current balance
     */
    public function updateCurrentBalance(): void
    {
        $this->current_balance = $this->getBalanceAsOf();
        $this->save();
    }

    /**
     * Get available account types
     */
    public static function getAccountTypes(): array
    {
        return [
            self::TYPE_ASSET => 'Asset',
            self::TYPE_LIABILITY => 'Liability',
            self::TYPE_EQUITY => 'Equity',
            self::TYPE_REVENUE => 'Revenue',
            self::TYPE_EXPENSE => 'Expense',
        ];
    }

    /**
     * Get available account subtypes
     */
    public static function getAccountSubtypes(): array
    {
        return [
            self::SUBTYPE_CURRENT_ASSET => 'Current Asset',
            self::SUBTYPE_NON_CURRENT_ASSET => 'Non-Current Asset',
            self::SUBTYPE_CURRENT_LIABILITY => 'Current Liability',
            self::SUBTYPE_NON_CURRENT_LIABILITY => 'Non-Current Liability',
            self::SUBTYPE_OWNERS_EQUITY => 'Owner\'s Equity',
            self::SUBTYPE_OPERATING_REVENUE => 'Operating Revenue',
            self::SUBTYPE_NON_OPERATING_REVENUE => 'Non-Operating Revenue',
            self::SUBTYPE_OPERATING_EXPENSE => 'Operating Expense',
            self::SUBTYPE_NON_OPERATING_EXPENSE => 'Non-Operating Expense',
        ];
    }

    /**
     * Get subtypes for a specific account type
     */
    public static function getSubtypesForType(string $type): array
    {
        $subtypes = [
            self::TYPE_ASSET => [
                self::SUBTYPE_CURRENT_ASSET,
                self::SUBTYPE_NON_CURRENT_ASSET,
            ],
            self::TYPE_LIABILITY => [
                self::SUBTYPE_CURRENT_LIABILITY,
                self::SUBTYPE_NON_CURRENT_LIABILITY,
            ],
            self::TYPE_EQUITY => [
                self::SUBTYPE_OWNERS_EQUITY,
            ],
            self::TYPE_REVENUE => [
                self::SUBTYPE_OPERATING_REVENUE,
                self::SUBTYPE_NON_OPERATING_REVENUE,
            ],
            self::TYPE_EXPENSE => [
                self::SUBTYPE_OPERATING_EXPENSE,
                self::SUBTYPE_NON_OPERATING_EXPENSE,
            ],
        ];

        return $subtypes[$type] ?? [];
    }

    /**
     * Get normal balance for account type
     */
    public static function getNormalBalanceForType(string $type): string
    {
        $normalBalances = [
            self::TYPE_ASSET => self::BALANCE_DEBIT,
            self::TYPE_LIABILITY => self::BALANCE_CREDIT,
            self::TYPE_EQUITY => self::BALANCE_CREDIT,
            self::TYPE_REVENUE => self::BALANCE_CREDIT,
            self::TYPE_EXPENSE => self::BALANCE_DEBIT,
        ];

        return $normalBalances[$type] ?? self::BALANCE_DEBIT;
    }

    /**
     * Generate next account code for a parent
     */
    public static function generateNextCode(?int $parentId = null, string $type = null): string
    {
        if ($parentId) {
            $parent = self::find($parentId);
            $siblings = self::where('parent_id', $parentId)->get();
            $nextNumber = $siblings->count() + 1;
            
            return $parent->code . str_pad($nextNumber, 2, '0', STR_PAD_LEFT);
        }

        // Root account codes based on type
        $typeCodes = [
            self::TYPE_ASSET => '1000',
            self::TYPE_LIABILITY => '2000',
            self::TYPE_EQUITY => '3000',
            self::TYPE_REVENUE => '4000',
            self::TYPE_EXPENSE => '5000',
        ];

        $baseCode = $typeCodes[$type] ?? '9000';
        $existingRoots = self::whereNull('parent_id')
            ->where('type', $type)
            ->orderBy('code')
            ->get();

        if ($existingRoots->isEmpty()) {
            return $baseCode;
        }

        $lastCode = $existingRoots->last()->code;
        return (string) ((int) $lastCode + 100);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($account) {
            // Set normal balance based on type if not provided
            if (empty($account->normal_balance)) {
                $account->normal_balance = self::getNormalBalanceForType($account->type);
            }

            // Set level based on parent
            if ($account->parent_id) {
                $parent = self::find($account->parent_id);
                $account->level = $parent ? $parent->level + 1 : 1;
            } else {
                $account->level = 1;
            }

            // Generate code if not provided
            if (empty($account->code)) {
                $account->code = self::generateNextCode($account->parent_id, $account->type);
            }
        });

        static::deleting(function ($account) {
            if (!$account->canBeDeleted()) {
                throw new \Exception('Account cannot be deleted: it has children or transactions.');
            }
        });
    }
}

