<?php

namespace Modules\Inventory\Services;

use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Events\StockLevelUpdated;
use Modules\Inventory\Events\LowStockAlert;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

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
                                       ->sum(DB::raw('current_quantity * unit_cost'));

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
            $stockTurnover = $this->calculateStockTurnover($organizationId);

            return [
                'total_products' => $totalProducts,
                'total_stock_value' => $totalStockValue,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
                'total_warehouses' => $totalWarehouses,
                'recent_movements' => $recentMovements,
                'top_products' => $topProducts,
                'stock_turnover_rate' => $stockTurnover,
                'stock_health' => $this->calculateStockHealth($organizationId),
            ];
        });
    }

    /**
     * Get stock levels for a product across all warehouses
     */
    public function getProductStockLevels(int $productId): Collection
    {
        return StockLevel::where('product_id', $productId)
                        ->with(['warehouse'])
                        ->get();
    }

    /**
     * Get available stock for a product in a specific warehouse
     */
    public function getAvailableStock(int $productId, int $warehouseId): float
    {
        $stockLevel = StockLevel::where('product_id', $productId)
                               ->where('warehouse_id', $warehouseId)
                               ->first();

        return $stockLevel ? $stockLevel->available_quantity : 0;
    }

    /**
     * Reserve stock for a product
     */
    public function reserveStock(int $productId, int $warehouseId, float $quantity, string $reason = null): bool
    {
        $stockLevel = StockLevel::where('product_id', $productId)
                               ->where('warehouse_id', $warehouseId)
                               ->first();

        if (!$stockLevel || !$stockLevel->canReserve($quantity)) {
            return false;
        }

        return $stockLevel->reserve($quantity);
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(int $productId, int $warehouseId, float $quantity): bool
    {
        $stockLevel = StockLevel::where('product_id', $productId)
                               ->where('warehouse_id', $warehouseId)
                               ->first();

        if (!$stockLevel) {
            return false;
        }

        return $stockLevel->releaseReservation($quantity);
    }

    /**
     * Create stock movement
     */
    public function createStockMovement(array $data): StockMovement
    {
        $movement = StockMovement::create($data);

        // Clear cache
        $this->clearInventoryCache($data['organization_id']);

        return $movement;
    }

    /**
     * Adjust stock levels
     */
    public function adjustStock(int $productId, int $warehouseId, float $quantity, string $reason, array $additionalData = []): StockMovement
    {
        $product = Product::findOrFail($productId);
        $warehouse = Warehouse::findOrFail($warehouseId);

        $movementData = array_merge([
            'organization_id' => $product->organization_id,
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'movement_type' => StockMovement::TYPE_ADJUSTMENT,
            'quantity' => $quantity,
            'reason' => $reason,
            'movement_date' => now(),
            'created_by' => auth()->id(),
        ], $additionalData);

        return $this->createStockMovement($movementData);
    }

    /**
     * Transfer stock between warehouses
     */
    public function transferStock(int $productId, int $fromWarehouseId, int $toWarehouseId, float $quantity, string $notes = null): array
    {
        $product = Product::findOrFail($productId);

        // Check if source warehouse has enough stock
        $availableStock = $this->getAvailableStock($productId, $fromWarehouseId);
        if ($availableStock < $quantity) {
            throw new \Exception('Insufficient stock for transfer');
        }

        DB::beginTransaction();

        try {
            // Create outbound movement
            $outboundMovement = $this->createStockMovement([
                'organization_id' => $product->organization_id,
                'product_id' => $productId,
                'warehouse_id' => $fromWarehouseId,
                'movement_type' => StockMovement::TYPE_OUT,
                'quantity' => $quantity,
                'reason' => StockMovement::REASON_TRANSFER,
                'notes' => $notes,
                'movement_date' => now(),
                'created_by' => auth()->id(),
            ]);

            // Create inbound movement
            $inboundMovement = $this->createStockMovement([
                'organization_id' => $product->organization_id,
                'product_id' => $productId,
                'warehouse_id' => $toWarehouseId,
                'movement_type' => StockMovement::TYPE_IN,
                'quantity' => $quantity,
                'reason' => StockMovement::REASON_TRANSFER,
                'notes' => $notes,
                'movement_date' => now(),
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return [
                'outbound_movement' => $outboundMovement,
                'inbound_movement' => $inboundMovement,
            ];
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Get low stock products
     */
    public function getLowStockProducts(int $organizationId): Collection
    {
        return Product::where('organization_id', $organizationId)
                     ->active()
                     ->lowStock()
                     ->with(['stockLevels.warehouse'])
                     ->get();
    }

    /**
     * Get products that need reordering
     */
    public function getProductsNeedingReorder(int $organizationId): Collection
    {
        return Product::where('organization_id', $organizationId)
                     ->active()
                     ->whereHas('stockLevels', function ($query) {
                         $query->whereRaw('current_quantity <= products.reorder_point');
                     })
                     ->with(['stockLevels.warehouse', 'suppliers'])
                     ->get();
    }

    /**
     * Calculate inventory valuation using different methods
     */
    public function calculateInventoryValuation(int $organizationId, string $method = 'weighted_average'): array
    {
        $products = Product::where('organization_id', $organizationId)
                          ->inventoryType()
                          ->with(['stockLevels'])
                          ->get();

        $totalValue = 0;
        $productValuations = [];

        foreach ($products as $product) {
            $productValue = 0;
            
            foreach ($product->stockLevels as $stockLevel) {
                switch ($method) {
                    case Product::VALUATION_WEIGHTED_AVERAGE:
                        $productValue += $stockLevel->current_quantity * $stockLevel->unit_cost;
                        break;
                    
                    case Product::VALUATION_FIFO:
                        $productValue += $this->calculateFifoValue($product->id, $stockLevel->warehouse_id);
                        break;
                    
                    case Product::VALUATION_LIFO:
                        $productValue += $this->calculateLifoValue($product->id, $stockLevel->warehouse_id);
                        break;
                }
            }

            $productValuations[] = [
                'product' => $product,
                'total_quantity' => $product->getCurrentStockQuantity(),
                'total_value' => $productValue,
                'average_cost' => $product->getCurrentStockQuantity() > 0 ? 
                                $productValue / $product->getCurrentStockQuantity() : 0,
            ];

            $totalValue += $productValue;
        }

        return [
            'total_value' => $totalValue,
            'method' => $method,
            'products' => $productValuations,
            'calculated_at' => now(),
        ];
    }

    /**
     * Get inventory aging report
     */
    public function getInventoryAging(int $organizationId): array
    {
        $stockLevels = StockLevel::where('organization_id', $organizationId)
                                ->with(['product'])
                                ->get();

        $agingBuckets = [
            '0-30' => [],
            '31-60' => [],
            '61-90' => [],
            '91-180' => [],
            '180+' => [],
        ];

        foreach ($stockLevels as $stockLevel) {
            if (!$stockLevel->last_movement_date) {
                continue;
            }

            $daysOld = now()->diffInDays($stockLevel->last_movement_date);
            $value = $stockLevel->total_value;

            if ($daysOld <= 30) {
                $agingBuckets['0-30'][] = ['stock_level' => $stockLevel, 'days_old' => $daysOld, 'value' => $value];
            } elseif ($daysOld <= 60) {
                $agingBuckets['31-60'][] = ['stock_level' => $stockLevel, 'days_old' => $daysOld, 'value' => $value];
            } elseif ($daysOld <= 90) {
                $agingBuckets['61-90'][] = ['stock_level' => $stockLevel, 'days_old' => $daysOld, 'value' => $value];
            } elseif ($daysOld <= 180) {
                $agingBuckets['91-180'][] = ['stock_level' => $stockLevel, 'days_old' => $daysOld, 'value' => $value];
            } else {
                $agingBuckets['180+'][] = ['stock_level' => $stockLevel, 'days_old' => $daysOld, 'value' => $value];
            }
        }

        return [
            'aging_buckets' => $agingBuckets,
            'summary' => [
                '0-30' => ['count' => count($agingBuckets['0-30']), 'value' => array_sum(array_column($agingBuckets['0-30'], 'value'))],
                '31-60' => ['count' => count($agingBuckets['31-60']), 'value' => array_sum(array_column($agingBuckets['31-60'], 'value'))],
                '61-90' => ['count' => count($agingBuckets['61-90']), 'value' => array_sum(array_column($agingBuckets['61-90'], 'value'))],
                '91-180' => ['count' => count($agingBuckets['91-180']), 'value' => array_sum(array_column($agingBuckets['91-180'], 'value'))],
                '180+' => ['count' => count($agingBuckets['180+']), 'value' => array_sum(array_column($agingBuckets['180+'], 'value'))],
            ],
        ];
    }

    /**
     * Get top products by value
     */
    protected function getTopProductsByValue(int $organizationId, int $limit = 10): Collection
    {
        return StockLevel::where('organization_id', $organizationId)
                        ->with(['product'])
                        ->orderByRaw('current_quantity * unit_cost DESC')
                        ->limit($limit)
                        ->get();
    }

    /**
     * Calculate stock turnover rate
     */
    protected function calculateStockTurnover(int $organizationId, int $days = 30): float
    {
        $totalStockValue = StockLevel::where('organization_id', $organizationId)
                                   ->sum(DB::raw('current_quantity * unit_cost'));

        $totalMovementValue = StockMovement::where('organization_id', $organizationId)
                                         ->where('movement_type', StockMovement::TYPE_OUT)
                                         ->where('movement_date', '>=', now()->subDays($days))
                                         ->sum('total_cost');

        return $totalStockValue > 0 ? $totalMovementValue / $totalStockValue : 0;
    }

    /**
     * Calculate stock health score
     */
    protected function calculateStockHealth(int $organizationId): array
    {
        $totalProducts = Product::where('organization_id', $organizationId)->active()->count();
        $lowStockProducts = StockLevel::where('organization_id', $organizationId)->lowStock()->count();
        $outOfStockProducts = StockLevel::where('organization_id', $organizationId)->outOfStock()->count();

        $healthScore = 100;
        
        if ($totalProducts > 0) {
            $lowStockPercentage = ($lowStockProducts / $totalProducts) * 100;
            $outOfStockPercentage = ($outOfStockProducts / $totalProducts) * 100;
            
            $healthScore -= ($lowStockPercentage * 0.5); // Reduce by 0.5 for each % of low stock
            $healthScore -= ($outOfStockPercentage * 1.0); // Reduce by 1.0 for each % of out of stock
        }

        $healthScore = max(0, min(100, $healthScore));

        return [
            'score' => round($healthScore, 1),
            'status' => $healthScore >= 80 ? 'excellent' : ($healthScore >= 60 ? 'good' : ($healthScore >= 40 ? 'fair' : 'poor')),
            'color' => $healthScore >= 80 ? 'green' : ($healthScore >= 60 ? 'blue' : ($healthScore >= 40 ? 'yellow' : 'red')),
        ];
    }

    /**
     * Calculate FIFO value for a product in a warehouse
     */
    protected function calculateFifoValue(int $productId, int $warehouseId): float
    {
        // This would implement FIFO calculation based on stock movements
        // For now, return weighted average as placeholder
        $stockLevel = StockLevel::where('product_id', $productId)
                               ->where('warehouse_id', $warehouseId)
                               ->first();

        return $stockLevel ? $stockLevel->current_quantity * $stockLevel->unit_cost : 0;
    }

    /**
     * Calculate LIFO value for a product in a warehouse
     */
    protected function calculateLifoValue(int $productId, int $warehouseId): float
    {
        // This would implement LIFO calculation based on stock movements
        // For now, return weighted average as placeholder
        $stockLevel = StockLevel::where('product_id', $productId)
                               ->where('warehouse_id', $warehouseId)
                               ->first();

        return $stockLevel ? $stockLevel->current_quantity * $stockLevel->unit_cost : 0;
    }

    /**
     * Clear inventory cache
     */
    protected function clearInventoryCache(int $organizationId): void
    {
        Cache::forget("inventory_overview_{$organizationId}");
        Cache::tags(['inventory', "org_{$organizationId}"])->flush();
    }
}

