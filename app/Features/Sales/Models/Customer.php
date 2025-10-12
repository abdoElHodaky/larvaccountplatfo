<?php

namespace App\Features\Sales\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Customer extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'customer_code',
        'company_name',
        'contact_person',
        'email',
        'phone',
        'mobile',
        'website',
        'tax_number',
        'billing_address',
        'shipping_address',
        'city',
        'state',
        'country',
        'postal_code',
        'customer_type',
        'credit_limit',
        'payment_terms',
        'discount_percentage',
        'is_active',
        'notes',
        'tags',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'billing_address' => 'array',
        'shipping_address' => 'array',
        'tags' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime' => 'datetime',
        'updated_at' => 'datetime' => 'datetime',
        'deleted_at' => 'datetime' => 'datetime',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Customer types
     */
    public const TYPE_INDIVIDUAL = 'individual';

    public const TYPE_BUSINESS = 'business';

    public const TYPE_GOVERNMENT = 'government';

    /**
     * Payment terms
     */
    public const PAYMENT_TERMS_CASH = 'cash';

    public const PAYMENT_TERMS_NET_15 = 'net_15';

    public const PAYMENT_TERMS_NET_30 = 'net_30';

    public const PAYMENT_TERMS_NET_60 = 'net_60';

    public const PAYMENT_TERMS_NET_90 = 'net_90';

    /**
     * Get the sales orders for this customer
     */
    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    /**
     * Get the invoices for this customer
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get the quotes for this customer
     */
    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    /**
     * Scope for active customers
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for customers by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('customer_type', $type);
    }

    /**
     * Scope for customers with credit limit
     */
    public function scopeWithCreditLimit($query)
    {
        return $query->where('credit_limit', '>', 0);
    }

    /**
     * Get customer's full name or company name
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->company_name ?: $this->contact_person;
    }

    /**
     * Get formatted customer code
     */
    public function getFormattedCodeAttribute(): string
    {
        return $this->customer_code ?: 'CUST-'.str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Get total sales amount
     */
    public function getTotalSalesAmount(): float
    {
        return $this->invoices()->where('status', 'paid')->sum('total_amount');
    }

    /**
     * Get outstanding balance
     */
    public function getOutstandingBalance(): float
    {
        return $this->invoices()->whereIn('status', ['sent', 'overdue'])->sum('total_amount');
    }

    /**
     * Check if customer has exceeded credit limit
     */
    public function hasExceededCreditLimit(): bool
    {
        if ($this->credit_limit <= 0) {
            return false;
        }

        return $this->getOutstandingBalance() > $this->credit_limit;
    }

    /**
     * Get available credit
     */
    public function getAvailableCredit(): float
    {
        if ($this->credit_limit <= 0) {
            return 0;
        }

        return max(0, $this->credit_limit - $this->getOutstandingBalance());
    }

    /**
     * Get customer's primary address
     */
    public function getPrimaryAddress(): array
    {
        return $this->billing_address ?: [
            'street' => '',
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
        ];
    }

    /**
     * Get customer's shipping address or fallback to billing
     */
    public function getShippingAddress(): array
    {
        return $this->shipping_address ?: $this->getPrimaryAddress();
    }
}
