<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class StockMovement extends HybridModel implements ShouldBroadcast
{
    use InteractsWithSockets;

    protected $fillable = [
        'organization_id',
        'product_id',
        'warehouse_id',
        'movement_type',
        'reference_type',
        'reference_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'reason',
        'notes',
        'movement_date',
        'created_by',
        'batch_number',
        'serial_number',
        'expiry_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
        'movement_date' => 'datetime',
        'expiry_date' => 'date',
    ];

    protected $dates = [
        'movement_date',
        'expiry_date',
    ];

    /**
     * Movement types
     */
    const TYPE_IN = 'in';
    const TYPE_OUT = 'out';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_TRANSFER = 'transfer';

    /**
     * Movement reasons
     */
    const REASON_PURCHASE = 'purchase';
    const REASON_SALE = 'sale';
    const REASON_RETURN = 'return';
    const REASON_ADJUSTMENT = 'adjustment';
    const REASON_TRANSFER = 'transfer';
    const REASON_PRODUCTION = 'production';
    const REASON_DAMAGE = 'damage';
    const REASON_THEFT = 'theft';
    const REASON_EXPIRED = 'expired';
    const REASON_INITIAL_STOCK = 'initial_stock';

    /**
     * Reference types
     */
    const REFERENCE_PURCHASE_ORDER = 'purchase_order';
    const REFERENCE_SALES_ORDER = 'sales_order';
    const REFERENCE_STOCK_ADJUSTMENT = 'stock_adjustment';
    const REFERENCE_STOCK_TRANSFER = 'stock_transfer';
    const REFERENCE_PRODUCTION_ORDER = 'production_order';

    /**
     * Get the organization this movement belongs to
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
     * Get the user who created this movement
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get the reference model (polymorphic)
     */
    public function reference()
    {
        return $this->morphTo('reference', 'reference_type', 'reference_id');
    }

    /**
     * Scope for stock in movements
     */
    public function scopeStockIn($query)
    {
        return $query->where('movement_type', self::TYPE_IN);
    }

    /**
     * Scope for stock out movements
     */
    public function scopeStockOut($query)
    {
        return $query->where('movement_type', self::TYPE_OUT);
    }

    /**
     * Scope for adjustments
     */
    public function scopeAdjustments($query)
    {
        return $query->where('movement_type', self::TYPE_ADJUSTMENT);
    }

    /**
     * Scope for transfers
     */
    public function scopeTransfers($query)
    {
        return $query->where('movement_type', self::TYPE_TRANSFER);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('movement_date', [$startDate, $endDate]);
    }

    /**
     * Check if movement increases stock
     */
    public function increasesStock(): bool
    {
        return in_array($this->movement_type, [self::TYPE_IN]) || 
               ($this->movement_type === self::TYPE_ADJUSTMENT && $this->quantity > 0);
    }

    /**
     * Check if movement decreases stock
     */
    public function decreasesStock(): bool
    {
        return in_array($this->movement_type, [self::TYPE_OUT]) || 
               ($this->movement_type === self::TYPE_ADJUSTMENT && $this->quantity < 0);
    }

    /**
     * Get signed quantity (positive for in, negative for out)
     */
    public function getSignedQuantityAttribute(): float
    {
        if ($this->movement_type === self::TYPE_OUT) {
            return -abs($this->quantity);
        }
        
        return $this->quantity;
    }

    /**
     * Get movement type display name
     */
    public function getMovementTypeDisplayAttribute(): string
    {
        $types = [
            self::TYPE_IN => 'Stock In',
            self::TYPE_OUT => 'Stock Out',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            self::TYPE_TRANSFER => 'Transfer',
        ];

        return $types[$this->movement_type] ?? $this->movement_type;
    }

    /**
     * Get reason display name
     */
    public function getReasonDisplayAttribute(): string
    {
        $reasons = [
            self::REASON_PURCHASE => 'Purchase',
            self::REASON_SALE => 'Sale',
            self::REASON_RETURN => 'Return',
            self::REASON_ADJUSTMENT => 'Adjustment',
            self::REASON_TRANSFER => 'Transfer',
            self::REASON_PRODUCTION => 'Production',
            self::REASON_DAMAGE => 'Damage',
            self::REASON_THEFT => 'Theft',
            self::REASON_EXPIRED => 'Expired',
            self::REASON_INITIAL_STOCK => 'Initial Stock',
        ];

        return $reasons[$this->reason] ?? $this->reason;
    }

    /**
     * Get available movement types
     */
    public static function getMovementTypes(): array
    {
        return [
            self::TYPE_IN => 'Stock In',
            self::TYPE_OUT => 'Stock Out',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            self::TYPE_TRANSFER => 'Transfer',
        ];
    }

    /**
     * Get available reasons
     */
    public static function getReasons(): array
    {
        return [
            self::REASON_PURCHASE => 'Purchase',
            self::REASON_SALE => 'Sale',
            self::REASON_RETURN => 'Return',
            self::REASON_ADJUSTMENT => 'Adjustment',
            self::REASON_TRANSFER => 'Transfer',
            self::REASON_PRODUCTION => 'Production',
            self::REASON_DAMAGE => 'Damage',
            self::REASON_THEFT => 'Theft',
            self::REASON_EXPIRED => 'Expired',
            self::REASON_INITIAL_STOCK => 'Initial Stock',
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new \Illuminate\Broadcasting\PrivateChannel("organization.{$this->organization_id}.inventory"),
            new \Illuminate\Broadcasting\PrivateChannel("organization.{$this->organization_id}.product.{$this->product_id}"),
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
            'movement_type' => $this->movement_type,
            'movement_type_display' => $this->movement_type_display,
            'quantity' => $this->quantity,
            'signed_quantity' => $this->signed_quantity,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $this->total_cost,
            'reason' => $this->reason,
            'reason_display' => $this->reason_display,
            'movement_date' => $this->movement_date->toISOString(),
            'created_by' => $this->createdBy->name ?? null,
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'stock.movement.created';
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($movement) {
            if (!$movement->movement_date) {
                $movement->movement_date = now();
            }

            if (!$movement->total_cost && $movement->quantity && $movement->unit_cost) {
                $movement->total_cost = $movement->quantity * $movement->unit_cost;
            }
        });

        static::created(function ($movement) {
            // Update stock levels
            $movement->updateStockLevels();
            
            // Create accounting entries if needed
            $movement->createAccountingEntries();
        });
    }

    /**
     * Update stock levels based on this movement
     */
    public function updateStockLevels(): void
    {
        $stockLevel = StockLevel::firstOrCreate([
            'organization_id' => $this->organization_id,
            'product_id' => $this->product_id,
            'warehouse_id' => $this->warehouse_id,
        ], [
            'current_quantity' => 0,
            'reserved_quantity' => 0,
            'unit_cost' => $this->unit_cost ?? 0,
        ]);

        // Update quantity based on movement type
        if ($this->increasesStock()) {
            $stockLevel->current_quantity += abs($this->quantity);
            
            // Update unit cost using weighted average
            if ($this->unit_cost > 0) {
                $totalValue = ($stockLevel->current_quantity * $stockLevel->unit_cost) + $this->total_cost;
                $totalQuantity = $stockLevel->current_quantity;
                $stockLevel->unit_cost = $totalQuantity > 0 ? $totalValue / $totalQuantity : 0;
            }
        } elseif ($this->decreasesStock()) {
            $stockLevel->current_quantity -= abs($this->quantity);
            $stockLevel->current_quantity = max(0, $stockLevel->current_quantity);
        }

        $stockLevel->last_movement_date = $this->movement_date;
        $stockLevel->save();

        // Broadcast stock level update
        broadcast(new \Modules\Inventory\Events\StockLevelUpdated($stockLevel));
    }

    /**
     * Create accounting entries for this movement
     */
    public function createAccountingEntries(): void
    {
        if (!$this->total_cost || $this->total_cost <= 0) {
            return;
        }

        // This would integrate with the accounting module
        // For now, we'll dispatch an event that the accounting module can listen to
        event(new \Modules\Inventory\Events\InventoryMovementCreated($this));
    }
}

