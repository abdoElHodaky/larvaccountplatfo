<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Supplier extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'contact_person',
        'contact_email',
        'contact_phone',
        'tax_number',
        'payment_terms',
        'credit_limit',
        'currency',
        'is_active',
        'rating',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'rating' => 'integer',
        'metadata' => 'array',
    ];

    protected $dates = [
        'deleted_at',
    ];

    /**
     * Get the organization this supplier belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get products supplied by this supplier
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_suppliers')
                    ->withPivot(['supplier_sku', 'cost_price', 'lead_time_days', 'minimum_order_quantity'])
                    ->withTimestamps();
    }

    /**
     * Get purchase orders from this supplier
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * Scope for active suppliers
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for suppliers with high rating
     */
    public function scopeHighRated($query, int $minRating = 4)
    {
        return $query->where('rating', '>=', $minRating);
    }

    /**
     * Get full address
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get rating stars
     */
    public function getRatingStarsAttribute(): string
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating);
    }

    /**
     * Get total purchase orders value
     */
    public function getTotalPurchaseValue(): float
    {
        return $this->purchaseOrders()
                   ->where('status', PurchaseOrder::STATUS_COMPLETED)
                   ->sum('total_amount');
    }

    /**
     * Get average lead time
     */
    public function getAverageLeadTime(): float
    {
        return $this->products()
                   ->avg('product_suppliers.lead_time_days') ?? 0;
    }

    /**
     * Get products count
     */
    public function getProductsCount(): int
    {
        return $this->products()->count();
    }

    /**
     * Check if supplier is reliable (based on rating and history)
     */
    public function isReliable(): bool
    {
        return $this->rating >= 4 && $this->is_active;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($supplier) {
            if (!isset($supplier->is_active)) {
                $supplier->is_active = true;
            }

            if (!$supplier->rating) {
                $supplier->rating = 3; // Default neutral rating
            }

            // Auto-generate code if not provided
            if (!$supplier->code) {
                $supplier->code = 'SUP' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }

            if (!$supplier->currency) {
                $supplier->currency = 'USD'; // Default currency
            }
        });
    }
}

