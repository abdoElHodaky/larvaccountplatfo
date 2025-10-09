<?php

namespace App\Features\Purchase\Models;

use App\Shared\Models\HybridModel;
use App\Features\Inventory\Models\Product;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends HybridModel
{
    protected $fillable = [
        'organization_id',
        'purchase_order_id',
        'product_id',
        'description',
        'quantity',
        'unit_cost',
        'discount_percentage',
        'tax_percentage',
        'line_total',
        'received_quantity',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'line_total' => 'decimal:2',
        'received_quantity' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function calculateLineTotal(): void
    {
        $subtotal = $this->quantity * $this->unit_cost;
        $discount = $subtotal * ($this->discount_percentage / 100);
        $taxable = $subtotal - $discount;
        $tax = $taxable * ($this->tax_percentage / 100);
        
        $this->line_total = $taxable + $tax;
        $this->save();
    }

    public function getRemainingQuantityAttribute(): float
    {
        return $this->quantity - $this->received_quantity;
    }

    public function isFullyReceived(): bool
    {
        return $this->received_quantity >= $this->quantity;
    }
}
