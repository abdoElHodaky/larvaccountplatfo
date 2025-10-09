<?php

namespace App\Features\Sales\Models;

use App\Shared\Models\HybridModel;
use App\Features\Inventory\Models\Product;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOrderItem extends HybridModel
{
    protected $fillable = [
        'organization_id',
        'sales_order_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'discount_percentage',
        'tax_percentage',
        'line_total',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'line_total' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function calculateLineTotal(): void
    {
        $subtotal = $this->quantity * $this->unit_price;
        $discount = $subtotal * ($this->discount_percentage / 100);
        $taxable = $subtotal - $discount;
        $tax = $taxable * ($this->tax_percentage / 100);
        
        $this->line_total = $taxable + $tax;
        $this->save();
    }
}
