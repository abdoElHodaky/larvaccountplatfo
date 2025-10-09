<?php

namespace App\Features\Inventory\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'category_id',
        'sku',
        'name',
        'description',
        'type',
        'status',
        'unit_of_measure',
        'cost_price',
        'selling_price',
        'minimum_stock_level',
        'maximum_stock_level',
        'reorder_point',
        'reorder_quantity',
        'weight',
        'dimensions',
        'barcode',
        'tax_rate',
        'is_trackable',
        'is_serialized',
        'valuation_method',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'selling_price' => 'decimal:4',
        'minimum_stock_level' => 'decimal:2',
        'maximum_stock_level' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'reorder_quantity' => 'decimal:2',
        'weight' => 'decimal:3',
        'tax_rate' => 'decimal:4',
        'is_trackable' => 'boolean',
        'is_serialized' => 'boolean',
        'dimensions' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Product types
     */
    const TYPE_PHYSICAL = 'physical';
    const TYPE_DIGITAL = 'digital';
    const TYPE_SERVICE = 'service';

    /**
     * Product statuses
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_DISCONTINUED = 'discontinued';

    /**
     * Valuation methods
     */
    const VALUATION_FIFO = 'fifo';
    const VALUATION_LIFO = 'lifo';
    const VALUATION_AVERAGE = 'average';

    /**
     * Get the category that owns the product
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Get the stock levels for the product
     */
    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    /**
     * Get the stock movements for the product
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Get the suppliers for the product
     */
    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'product_suppliers')
                    ->withPivot(['supplier_sku', 'cost_price', 'lead_time', 'minimum_order_quantity'])
                    ->withTimestamps();
    }

    /**
     * Get the purchase order items for the product
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get the current stock level across all warehouses
     */
    public function getCurrentStockLevel(): float
    {
        return $this->stockLevels()->sum('quantity_on_hand');
    }

    /**
     * Get the available stock level (on hand - reserved)
     */
    public function getAvailableStockLevel(): float
    {
        return $this->stockLevels()->sum('quantity_available');
    }

    /**
     * Check if product is low stock
     */
    public function isLowStock(): bool
    {
        return $this->getCurrentStockLevel() <= $this->reorder_point;
    }

    /**
     * Check if product is out of stock
     */
    public function isOutOfStock(): bool
    {
        return $this->getCurrentStockLevel() <= 0;
    }

    /**
     * Get the total value of current stock
     */
    public function getStockValue(): float
    {
        return $this->getCurrentStockLevel() * $this->cost_price;
    }

    /**
     * Scope for active products
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for trackable products
     */
    public function scopeTrackable($query)
    {
        return $query->where('is_trackable', true);
    }

    /**
     * Scope for low stock products
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('(SELECT SUM(quantity_on_hand) FROM stock_levels WHERE product_id = products.id) <= reorder_point');
    }

    /**
     * Scope for out of stock products
     */
    public function scopeOutOfStock($query)
    {
        return $query->whereRaw('(SELECT SUM(quantity_on_hand) FROM stock_levels WHERE product_id = products.id) <= 0');
    }
}
