<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class StockLevel extends HybridModel implements ShouldBroadcast
{
    use InteractsWithSockets;

    protected $fillable = [
        'organization_id',
        'product_id',
        'warehouse_id',
        'current_quantity',
        'reserved_quantity',
        'available_quantity',
        'unit_cost',
        'total_value',
        'last_movement_date',
        'last_counted_date',
        'last_counted_quantity',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'total_value' => 'decimal:4',
        'last_counted_quantity' => 'decimal:2',
        'last_movement_date' => 'datetime',
        'last_counted_date' => 'datetime',
    ];

    protected $dates = [
        'last_movement_date',
        'last_counted_date',
    ];

    /**
     * Get the organization this stock level belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Scope for products with stock
     */
    public function scopeWithStock($query)
    {
        return $query->where('current_quantity', '>', 0);
    }

    /**
     * Scope for products without stock
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('current_quantity', '<=', 0);
    }

    /**
     * Scope for low stock products
     */
    public function scopeLowStock($query)
    {
        return $query->whereHas('product', function ($q) {
            $q->whereRaw('stock_levels.current_quantity <= products.reorder_point');
        });
    }

    /**
     * Check if stock is available
     */
    public function hasStock(): bool
    {
        return $this->current_quantity > 0;
    }

    /**
     * Check if stock is low
     */
    public function isLowStock(): bool
    {
        return $this->current_quantity <= $this->product->reorder_point;
    }

    /**
     * Check if stock is available for reservation
     */
    public function canReserve(float $quantity): bool
    {
        return $this->available_quantity >= $quantity;
    }

    /**
     * Reserve stock
     */
    public function reserve(float $quantity): bool
    {
        if (!$this->canReserve($quantity)) {
            return false;
        }

        $this->reserved_quantity += $quantity;
        $this->available_quantity -= $quantity;
        $this->save();

        // Broadcast stock level update
        broadcast(new \Modules\Inventory\Events\StockReserved($this, $quantity));

        return true;
    }

    /**
     * Release reserved stock
     */
    public function releaseReservation(float $quantity): bool
    {
        if ($this->reserved_quantity < $quantity) {
            return false;
        }

        $this->reserved_quantity -= $quantity;
        $this->available_quantity += $quantity;
        $this->save();

        // Broadcast stock level update
        broadcast(new \Modules\Inventory\Events\StockReservationReleased($this, $quantity));

        return true;
    }

    /**
     * Get stock status
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->current_quantity <= 0) {
            return 'Out of Stock';
        } elseif ($this->isLowStock()) {
            return 'Low Stock';
        } elseif ($this->current_quantity >= $this->product->maximum_stock_level) {
            return 'Overstock';
        } else {
            return 'In Stock';
        }
    }

    /**
     * Get stock status color
     */
    public function getStockStatusColorAttribute(): string
    {
        switch ($this->stock_status) {
            case 'Out of Stock':
                return 'red';
            case 'Low Stock':
                return 'orange';
            case 'Overstock':
                return 'blue';
            default:
                return 'green';
        }
    }

    /**
     * Get turnover rate (if we have historical data)
     */
    public function getTurnoverRate(int $days = 30): float
    {
        $movements = StockMovement::where('product_id', $this->product_id)
            ->where('warehouse_id', $this->warehouse_id)
            ->where('movement_type', StockMovement::TYPE_OUT)
            ->where('movement_date', '>=', now()->subDays($days))
            ->sum('quantity');

        $averageStock = $this->current_quantity; // Simplified - could calculate actual average
        
        return $averageStock > 0 ? $movements / $averageStock : 0;
    }

    /**
     * Get days of stock remaining
     */
    public function getDaysOfStockRemaining(int $baseDays = 30): float
    {
        $turnoverRate = $this->getTurnoverRate($baseDays);
        
        return $turnoverRate > 0 ? $this->available_quantity / ($turnoverRate / $baseDays) : 999;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new \Illuminate\Broadcasting\PrivateChannel("organization.{$this->organization_id}.inventory"),
            new \Illuminate\Broadcasting\PrivateChannel("organization.{$this->organization_id}.product.{$this->product_id}"),
            new \Illuminate\Broadcasting\PrivateChannel("organization.{$this->organization_id}.warehouse.{$this->warehouse_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse->name ?? null,
            'current_quantity' => $this->current_quantity,
            'reserved_quantity' => $this->reserved_quantity,
            'available_quantity' => $this->available_quantity,
            'unit_cost' => $this->unit_cost,
            'total_value' => $this->total_value,
            'stock_status' => $this->stock_status,
            'stock_status_color' => $this->stock_status_color,
            'is_low_stock' => $this->isLowStock(),
            'last_movement_date' => $this->last_movement_date?->toISOString(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'stock.level.updated';
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($stockLevel) {
            // Calculate available quantity
            $stockLevel->available_quantity = $stockLevel->current_quantity - $stockLevel->reserved_quantity;
            
            // Calculate total value
            $stockLevel->total_value = $stockLevel->current_quantity * $stockLevel->unit_cost;
        });

        static::saved(function ($stockLevel) {
            // Check for low stock alerts
            if ($stockLevel->isLowStock() && $stockLevel->product->status === Product::STATUS_ACTIVE) {
                event(new \Modules\Inventory\Events\LowStockAlert($stockLevel));
            }
        });
    }
}

