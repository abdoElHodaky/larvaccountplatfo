<?php

namespace App\Features\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'quantity',
        'previous_quantity',
        'movement_type',
        'reason',
        'reference',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'previous_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Movement types
     */
    const TYPE_IN = 'in';
    const TYPE_OUT = 'out';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_TRANSFER = 'transfer';

    /**
     * Get the product that owns the stock movement
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who created the stock movement
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Scope for filtering by movement type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('movement_type', $type);
    }

    /**
     * Scope for filtering by product
     */
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope for recent movements
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get the net quantity change (positive for in, negative for out)
     */
    public function getNetQuantityAttribute()
    {
        return match ($this->movement_type) {
            self::TYPE_IN => $this->quantity,
            self::TYPE_OUT => -$this->quantity,
            self::TYPE_ADJUSTMENT => $this->quantity - $this->previous_quantity,
            self::TYPE_TRANSFER => 0, // Handled separately for source/destination
            default => 0,
        };
    }

    /**
     * Get formatted movement type
     */
    public function getFormattedTypeAttribute()
    {
        return match ($this->movement_type) {
            self::TYPE_IN => 'Stock In',
            self::TYPE_OUT => 'Stock Out',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            self::TYPE_TRANSFER => 'Transfer',
            default => 'Unknown',
        };
    }
}
