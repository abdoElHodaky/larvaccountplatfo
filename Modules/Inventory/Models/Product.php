<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
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
    ];

    protected $dates = [
        'deleted_at',
    ];

    /**
     * Product types
     */
    const TYPE_INVENTORY = 'inventory';
    const TYPE_NON_INVENTORY = 'non_inventory';
    const TYPE_SERVICE = 'service';
    const TYPE_BUNDLE = 'bundle';

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
    const VALUATION_WEIGHTED_AVERAGE = 'weighted_average';
    const VALUATION_SPECIFIC_IDENTIFICATION = 'specific_identification';

    /**
     * Units of measure
     */
    const UOM_PIECE = 'piece';
    const UOM_KILOGRAM = 'kg';
    const UOM_GRAM = 'g';
    const UOM_LITER = 'l';
    const UOM_METER = 'm';
    const UOM_CENTIMETER = 'cm';
    const UOM_SQUARE_METER = 'sqm';
    const UOM_CUBIC_METER = 'cbm';

    /**
     * Get the organization this product belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the product category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Get the user who created this product
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get stock movements for this product
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Get stock levels for this product
     */
    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    /**
     * Get purchase order items for this product
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get suppliers for this product
     */
    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'product_suppliers')
                    ->withPivot(['supplier_sku', 'cost_price', 'lead_time_days', 'minimum_order_quantity'])
                    ->withTimestamps();
    }

    /**
     * Get inventory valuations for this product
     */
    public function inventoryValuations(): HasMany
    {
        return $this->hasMany(InventoryValuation::class);
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
     * Scope for inventory products
     */
    public function scopeInventoryType($query)
    {
        return $query->where('type', self::TYPE_INVENTORY);
    }

    /**
     * Scope for low stock products
     */
    public function scopeLowStock($query)
    {
        return $query->whereHas('stockLevels', function ($q) {
            $q->whereRaw('current_quantity <= reorder_point');
        });
    }

    /**
     * Get current stock quantity
     */
    public function getCurrentStockQuantity(): float
    {
        return $this->stockLevels()
                   ->sum('current_quantity');
    }

    /**
     * Get available stock quantity (excluding reserved)
     */
    public function getAvailableStockQuantity(): float
    {
        return $this->stockLevels()
                   ->sum(\DB::raw('current_quantity - reserved_quantity'));
    }

    /**
     * Get current stock value
     */
    public function getCurrentStockValue(): float
    {
        return $this->stockLevels()
                   ->sum(\DB::raw('current_quantity * unit_cost'));
    }

    /**
     * Check if product is in stock
     */
    public function isInStock(): bool
    {
        return $this->getCurrentStockQuantity() > 0;
    }

    /**
     * Check if product is low stock
     */
    public function isLowStock(): bool
    {
        return $this->getCurrentStockQuantity() <= $this->reorder_point;
    }

    /**
     * Check if product needs reordering
     */
    public function needsReordering(): bool
    {
        return $this->isLowStock() && $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Get formatted SKU
     */
    public function getFormattedSkuAttribute(): string
    {
        return strtoupper($this->sku);
    }

    /**
     * Get stock status
     */
    public function getStockStatusAttribute(): string
    {
        $quantity = $this->getCurrentStockQuantity();
        
        if ($quantity <= 0) {
            return 'Out of Stock';
        } elseif ($quantity <= $this->reorder_point) {
            return 'Low Stock';
        } elseif ($quantity >= $this->maximum_stock_level) {
            return 'Overstock';
        } else {
            return 'In Stock';
        }
    }

    /**
     * Get profit margin
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->cost_price <= 0) {
            return 0;
        }

        return (($this->selling_price - $this->cost_price) / $this->cost_price) * 100;
    }

    /**
     * Get available product types
     */
    public static function getProductTypes(): array
    {
        return [
            self::TYPE_INVENTORY => 'Inventory Item',
            self::TYPE_NON_INVENTORY => 'Non-Inventory Item',
            self::TYPE_SERVICE => 'Service',
            self::TYPE_BUNDLE => 'Bundle',
        ];
    }

    /**
     * Get available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_DISCONTINUED => 'Discontinued',
        ];
    }

    /**
     * Get available valuation methods
     */
    public static function getValuationMethods(): array
    {
        return [
            self::VALUATION_FIFO => 'First In, First Out (FIFO)',
            self::VALUATION_LIFO => 'Last In, First Out (LIFO)',
            self::VALUATION_WEIGHTED_AVERAGE => 'Weighted Average',
            self::VALUATION_SPECIFIC_IDENTIFICATION => 'Specific Identification',
        ];
    }

    /**
     * Get available units of measure
     */
    public static function getUnitsOfMeasure(): array
    {
        return [
            self::UOM_PIECE => 'Piece',
            self::UOM_KILOGRAM => 'Kilogram',
            self::UOM_GRAM => 'Gram',
            self::UOM_LITER => 'Liter',
            self::UOM_METER => 'Meter',
            self::UOM_CENTIMETER => 'Centimeter',
            self::UOM_SQUARE_METER => 'Square Meter',
            self::UOM_CUBIC_METER => 'Cubic Meter',
        ];
    }

    /**
     * Generate SKU
     */
    public static function generateSku(string $prefix = 'PRD'): string
    {
        $lastProduct = static::where('sku', 'LIKE', $prefix . '%')
                            ->orderBy('sku', 'desc')
                            ->first();

        if (!$lastProduct) {
            return $prefix . '001';
        }

        $lastNumber = (int) substr($lastProduct->sku, strlen($prefix));
        $nextNumber = $lastNumber + 1;

        return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (!$product->sku) {
                $product->sku = static::generateSku();
            }

            if (!$product->status) {
                $product->status = self::STATUS_ACTIVE;
            }

            if (!$product->type) {
                $product->type = self::TYPE_INVENTORY;
            }

            if (!$product->valuation_method) {
                $product->valuation_method = self::VALUATION_WEIGHTED_AVERAGE;
            }

            if (!$product->unit_of_measure) {
                $product->unit_of_measure = self::UOM_PIECE;
            }

            if (!isset($product->is_trackable)) {
                $product->is_trackable = $product->type === self::TYPE_INVENTORY;
            }
        });
    }
}

