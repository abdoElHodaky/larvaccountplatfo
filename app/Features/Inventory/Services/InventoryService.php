<?php

namespace App\Features\Inventory\Services;

use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\StockLevel;
use App\Features\Inventory\Models\StockMovement;
use App\Features\Inventory\Models\Warehouse;
use App\Features\Inventory\Models\ProductCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Get inventory overview for organization
     */
    public function getInventoryOverview(int $organizationId): array
    {
        $cacheKey = "inventory_overview_{$organizationId}";
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $totalProducts = Product::where('organization_id', $organizationId)
                                   ->active()
                                   ->count();

            $totalStockValue = StockLevel::where('organization_id', $organizationId)
                                       ->sum(DB::raw('quantity_on_hand * cost_per_unit'));

            $lowStockProducts = StockLevel::where('organization_id', $organizationId)
                                        ->lowStock()
                                        ->count();

            $outOfStockProducts = StockLevel::where('organization_id', $organizationId)
                                          ->outOfStock()
                                          ->count();

            $totalWarehouses = Warehouse::where('organization_id', $organizationId)
                                      ->active()
                                      ->count();

            $recentMovements = StockMovement::where('organization_id', $organizationId)
                                          ->with(['product', 'warehouse'])
                                          ->orderBy('movement_date', 'desc')
                                          ->limit(10)
                                          ->get();

            $topProducts = $this->getTopProductsByValue($organizationId, 10);

            return [
                'total_products' => $totalProducts,
                'total_stock_value' => $totalStockValue,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
                'total_warehouses' => $totalWarehouses,
                'recent_movements' => $recentMovements,
                'top_products' => $topProducts,
                'stock_alerts' => $this->getStockAlerts($organizationId),
            ];
        });
    }

    /**
     * Get all products with filtering and pagination
     */
    public function getProducts(int $organizationId, array $filters = [], int $perPage = 15): Collection
    {
        $query = Product::where('organization_id', $organizationId)
                       ->with(['category', 'stockLevels.warehouse']);

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('sku', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['low_stock'])) {
            $query->lowStock();
        }

        if (!empty($filters['out_of_stock'])) {
            $query->outOfStock();
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Create a new product
     */
    public function createProduct(int $organizationId, array $data): Product
    {
        DB::beginTransaction();

        try {
            $data['organization_id'] = $organizationId;
            $data['created_by'] = auth()->id();

            // Generate SKU if not provided
            if (empty($data['sku'])) {
                $data['sku'] = $this->generateSKU($organizationId);
            }

            $product = Product::create($data);

            // Create initial stock levels for all warehouses if trackable
            if ($product->is_trackable) {
                $warehouses = Warehouse::where('organization_id', $organizationId)
                                     ->active()
                                     ->get();

                foreach ($warehouses as $warehouse) {
                    StockLevel::create([
                        'organization_id' => $organizationId,
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'quantity_on_hand' => 0,
                        'quantity_available' => 0,
                        'quantity_reserved' => 0,
                        'quantity_on_order' => 0,
                        'cost_per_unit' => $product->cost_price,
                    ]);
                }
            }

            DB::commit();

            // Clear cache
            $this->clearInventoryCache($organizationId);

            Log::info('Product created', ['product_id' => $product->id, 'organization_id' => $organizationId]);

            return $product;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    /**
     * Update a product
     */
    public function updateProduct(Product|int $product, array $data): Product
    {
        DB::beginTransaction();

        try {
            // If an ID is passed, find the product
            if (is_int($product)) {
                $product = Product::findOrFail($product);
            }

            $product->update($data);

            // Update cost per unit in stock levels if cost price changed
            if (isset($data['cost_price']) && $product->is_trackable) {
                StockLevel::where('product_id', $product->id)
                         ->update(['cost_per_unit' => $data['cost_price']]);
            }

            DB::commit();

            // Clear cache
            $this->clearInventoryCache($product->organization_id);

            Log::info('Product updated', ['product_id' => $product->id]);

            return $product->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update product', ['error' => $e->getMessage(), 'product_id' => is_int($product) ? $product : $product->id]);
            throw $e;
        }
    }

    /**
     * Delete a product
     */
    public function deleteProduct(Product $product): bool
    {
        DB::beginTransaction();

        try {
            // Check if product has stock movements
            $hasMovements = StockMovement::where('product_id', $product->id)->exists();
            
            if ($hasMovements) {
                // Soft delete if has movements
                $product->delete();
            } else {
                // Hard delete if no movements
                StockLevel::where('product_id', $product->id)->delete();
                $product->forceDelete();
            }

            DB::commit();

            // Clear cache
            $this->clearInventoryCache($product->organization_id);

            Log::info('Product deleted', ['product_id' => $product->id]);

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete product', ['error' => $e->getMessage(), 'product_id' => $product->id]);
            throw $e;
        }
    }

    /**
     * Adjust stock level
     */
    public function adjustStock(int $productId, int $warehouseId, float $quantity, string $reason, string $type = 'adjustment'): bool
    {
        DB::beginTransaction();

        try {
            $stockLevel = StockLevel::where('product_id', $productId)
                                  ->where('warehouse_id', $warehouseId)
                                  ->first();

            if (!$stockLevel) {
                throw new \Exception('Stock level not found');
            }

            $oldQuantity = $stockLevel->quantity_on_hand;
            $stockLevel->adjustStock($quantity, $reason);

            // Create stock movement record
            StockMovement::create([
                'organization_id' => $stockLevel->organization_id,
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'movement_type' => $type,
                'quantity' => $quantity,
                'unit_cost' => $stockLevel->cost_per_unit,
                'total_cost' => $quantity * $stockLevel->cost_per_unit,
                'movement_date' => now(),
                'reference_number' => $this->generateMovementReference(),
                'notes' => $reason,
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            // Clear cache
            $this->clearInventoryCache($stockLevel->organization_id);

            // Check for low stock alerts
            $this->checkLowStockAlert($stockLevel);

            Log::info('Stock adjusted', [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'old_quantity' => $oldQuantity,
                'adjustment' => $quantity,
                'new_quantity' => $stockLevel->quantity_on_hand,
            ]);

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to adjust stock', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Get stock alerts for organization
     */
    public function getStockAlerts(int $organizationId): array
    {
        $lowStockProducts = Product::where('organization_id', $organizationId)
                                 ->lowStock()
                                 ->with(['category', 'stockLevels'])
                                 ->get();

        $outOfStockProducts = Product::where('organization_id', $organizationId)
                                   ->outOfStock()
                                   ->with(['category', 'stockLevels'])
                                   ->get();

        return [
            'low_stock' => $lowStockProducts,
            'out_of_stock' => $outOfStockProducts,
        ];
    }

    /**
     * Get top products by stock value
     */
    public function getTopProductsByValue(int $organizationId, int $limit = 10): Collection
    {
        return Product::where('organization_id', $organizationId)
                     ->active()
                     ->with(['stockLevels'])
                     ->get()
                     ->map(function ($product) {
                         $product->total_stock_value = $product->getStockValue();
                         return $product;
                     })
                     ->sortByDesc('total_stock_value')
                     ->take($limit)
                     ->values();
    }

    /**
     * Generate unique SKU
     */
    private function generateSKU(int $organizationId): string
    {
        $prefix = 'PRD';
        $timestamp = now()->format('ymd');
        
        do {
            $random = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $sku = "{$prefix}-{$timestamp}-{$random}";
        } while (Product::where('organization_id', $organizationId)->where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * Generate movement reference number
     */
    private function generateMovementReference(): string
    {
        $prefix = 'MOV';
        $timestamp = now()->format('ymdHis');
        $random = str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$timestamp}-{$random}";
    }

    /**
     * Check for low stock alert
     */
    private function checkLowStockAlert(StockLevel $stockLevel): void
    {
        $product = $stockLevel->product;
        
        if ($product->isLowStock() && !$product->isOutOfStock()) {
            // Trigger low stock alert event
            Log::warning('Low stock alert', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_stock' => $stockLevel->quantity_on_hand,
                'reorder_point' => $product->reorder_point,
            ]);
        }
    }

    /**
     * Create a new product category
     */
    public function createCategory(array $data): ProductCategory
    {
        DB::beginTransaction();

        try {
            $category = ProductCategory::create($data);

            DB::commit();

            Log::info('Product category created', ['category_id' => $category->id]);

            return $category;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product category', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Clear inventory cache
     */
    private function clearInventoryCache(int $organizationId): void
    {
        Cache::forget("inventory_overview_{$organizationId}");
        Cache::tags(['inventory', "org_{$organizationId}"])->flush();
    }
}
