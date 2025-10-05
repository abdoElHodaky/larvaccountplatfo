<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
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
        'total_cost',
        'received_quantity',
        'remaining_quantity',
        'tax_rate',
        'discount_percentage',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
        'received_quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
        'tax_rate' => 'decimal:4',
        'discount_percentage' => 'decimal:2',
    ];

    /**
     * Get the organization this item belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the purchase order
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Check if item is fully received
     */
    public function isFullyReceived(): bool
    {
        return $this->received_quantity >= $this->quantity;
    }

    /**
     * Check if item is partially received
     */
    public function isPartiallyReceived(): bool
    {
        return $this->received_quantity > 0 && $this->received_quantity < $this->quantity;
    }

    /**
     * Get received percentage
     */
    public function getReceivedPercentageAttribute(): float
    {
        return $this->quantity > 0 ? ($this->received_quantity / $this->quantity) * 100 : 0;
    }

    /**
     * Get net unit cost (after discount)
     */
    public function getNetUnitCostAttribute(): float
    {
        $discount = $this->unit_cost * ($this->discount_percentage / 100);
        return $this->unit_cost - $discount;
    }

    /**
     * Get tax amount
     */
    public function getTaxAmountAttribute(): float
    {
        return $this->total_cost * ($this->tax_rate / 100);
    }

    /**
     * Receive quantity
     */
    public function receive(float $quantity): bool
    {
        if ($quantity <= 0 || $this->received_quantity + $quantity > $this->quantity) {
            return false;
        }

        $this->received_quantity += $quantity;
        $this->remaining_quantity = $this->quantity - $this->received_quantity;
        $this->save();

        // Create stock movement
        StockMovement::create([
            'organization_id' => $this->organization_id,
            'product_id' => $this->product_id,
            'warehouse_id' => $this->purchaseOrder->warehouse_id,
            'movement_type' => StockMovement::TYPE_IN,
            'reference_type' => StockMovement::REFERENCE_PURCHASE_ORDER,
            'reference_id' => $this->purchase_order_id,
            'quantity' => $quantity,
            'unit_cost' => $this->net_unit_cost,
            'total_cost' => $quantity * $this->net_unit_cost,
            'reason' => StockMovement::REASON_PURCHASE,
            'movement_date' => now(),
            'created_by' => auth()->id(),
        ]);

        // Update purchase order status
        $this->purchaseOrder->updateStatusBasedOnReceipts();

        return true;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (!$item->total_cost && $item->quantity && $item->unit_cost) {
                $item->total_cost = $item->quantity * $item->unit_cost;
            }

            if (!isset($item->remaining_quantity)) {
                $item->remaining_quantity = $item->quantity;
            }

            if (!isset($item->received_quantity)) {
                $item->received_quantity = 0;
            }
        });

        static::saving(function ($item) {
            // Recalculate total cost
            if ($item->quantity && $item->unit_cost) {
                $discount = $item->unit_cost * ($item->discount_percentage / 100);
                $netUnitCost = $item->unit_cost - $discount;
                $item->total_cost = $item->quantity * $netUnitCost;
            }

            // Update remaining quantity
            $item->remaining_quantity = $item->quantity - $item->received_quantity;
        });

        static::saved(function ($item) {
            // Update purchase order totals
            $item->purchaseOrder->calculateTotals();
        });
    }
}

