<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'description',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'phone',
        'email',
        'manager_name',
        'is_active',
        'is_default',
        'capacity',
        'current_utilization',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'capacity' => 'decimal:2',
        'current_utilization' => 'decimal:2',
        'metadata' => 'array',
    ];

    protected $dates = [
        'deleted_at',
    ];

    /**
     * Get the organization this warehouse belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get stock levels for this warehouse
     */
    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    /**
     * Get stock movements for this warehouse
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Scope for active warehouses
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for default warehouse
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get total stock value in this warehouse
     */
    public function getTotalStockValue(): float
    {
        return $this->stockLevels()
                   ->sum(\DB::raw('current_quantity * unit_cost'));
    }

    /**
     * Get total products count in this warehouse
     */
    public function getTotalProductsCount(): int
    {
        return $this->stockLevels()
                   ->where('current_quantity', '>', 0)
                   ->count();
    }

    /**
     * Get capacity utilization percentage
     */
    public function getCapacityUtilizationPercentage(): float
    {
        if (!$this->capacity || $this->capacity <= 0) {
            return 0;
        }

        return ($this->current_utilization / $this->capacity) * 100;
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
     * Check if warehouse is over capacity
     */
    public function isOverCapacity(): bool
    {
        return $this->capacity > 0 && $this->current_utilization > $this->capacity;
    }

    /**
     * Check if warehouse is near capacity
     */
    public function isNearCapacity(float $threshold = 90): bool
    {
        return $this->getCapacityUtilizationPercentage() >= $threshold;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($warehouse) {
            if (!isset($warehouse->is_active)) {
                $warehouse->is_active = true;
            }

            // Auto-generate code if not provided
            if (!$warehouse->code) {
                $warehouse->code = strtoupper(substr($warehouse->name, 0, 3)) . 
                                  str_pad(static::count() + 1, 3, '0', STR_PAD_LEFT);
            }
        });

        static::saving(function ($warehouse) {
            // Ensure only one default warehouse per organization
            if ($warehouse->is_default) {
                static::where('organization_id', $warehouse->organization_id)
                      ->where('id', '!=', $warehouse->id)
                      ->update(['is_default' => false]);
            }
        });
    }
}

