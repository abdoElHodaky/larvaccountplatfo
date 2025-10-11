<?php

namespace App\Features\Purchase\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'supplier_code',
        'company_name',
        'contact_person',
        'email',
        'phone',
        'mobile',
        'website',
        'tax_number',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'supplier_type',
        'payment_terms',
        'credit_limit',
        'is_active',
        'notes',
        'tags',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'address' => 'array',
        'tags' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    const TYPE_MANUFACTURER = 'manufacturer';

    const TYPE_DISTRIBUTOR = 'distributor';

    const TYPE_WHOLESALER = 'wholesaler';

    const TYPE_SERVICE_PROVIDER = 'service_provider';

    const PAYMENT_TERMS_CASH = 'cash';

    const PAYMENT_TERMS_NET_15 = 'net_15';

    const PAYMENT_TERMS_NET_30 = 'net_30';

    const PAYMENT_TERMS_NET_60 = 'net_60';

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('supplier_type', $type);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->company_name ?: $this->contact_person;
    }

    public function getFormattedCodeAttribute(): string
    {
        return $this->supplier_code ?: 'SUP-'.str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    public function getTotalPurchaseAmount(): float
    {
        return $this->purchaseOrders()->where('status', 'completed')->sum('total_amount');
    }

    public function getOutstandingAmount(): float
    {
        return $this->purchaseOrders()->whereIn('status', ['approved', 'received'])->sum('total_amount');
    }
}
