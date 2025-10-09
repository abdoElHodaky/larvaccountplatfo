<?php

namespace App\Features\Inventory\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLevel extends HybridModel
{
    protected $fillable = [
        'organization_id',
        'product_id',
        'warehouse_id',
        'quantity_on_hand',
        'quantity_available',
        'quantity_reserved',
        'quantity_on_order',
        'last_counted_at',
        'last_movement_at',
        'cost_per_unit',
        'metadata',
    ];

    protected $casts = [
        'quantity_on_hand' => 'decimal:2',
        'quantity_available' => 'decimal:2',
        'quantity_reserved' => 'decimal:2',
        'quantity_on_order' => 'decimal:2',
        'cost_per_unit' => 'decimal:4',
        'last_counted_at' => 'datetime',
        'last_movement_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = [
        'last_counted_at',
        'last_movement_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the product that owns the stock level
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse that owns the stock level
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the total stock value
     */
    public function getStockValue(): float
    {
        return $this->quantity_on_hand * $this->cost_per_unit;
    }

    /**
     * Check if stock is available for the given quantity
     */
    public function isAvailable(float $quantity): bool
    {
        return $this->quantity_available >= $quantity;
    }

    /**
     * Reserve stock for the given quantity
     */
    public function reserveStock(float $quantity): bool
    {
        if (!$this->isAvailable($quantity)) {
            return false;
        }

        $this->quantity_available -= $quantity;
        $this->quantity_reserved += $quantity;
        
        return $this->save();
    }

    /**
     * Release reserved stock
     */
    public function releaseStock(float $quantity): bool
    {
        if ($this->quantity_reserved < $quantity) {
            return false;
        }

        $this->quantity_reserved -= $quantity;
        $this->quantity_available += $quantity;
        
        return $this->save();
    }

    /**
     * Adjust stock levels
     */
    public function adjustStock(float $quantity, string $reason = null): bool
    {
        $this->quantity_on_hand += $quantity;
        $this->quantity_available += $quantity;
        $this->last_movement_at = now();
        
        return $this->save();
    }

    /**
     * Scope for products with low stock
     */
    public function scopeLowStock($query)
    {
        return $query->whereHas('product', function ($q) {
            $q->whereRaw('stock_levels.quantity_on_hand <= products.reorder_point');
        });
    }

    /**
     * Scope for products out of stock
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity_on_hand', '<=', 0);
    }
}
