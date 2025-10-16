<?php

namespace App\Features\Inventory\Listeners;

<<<<<<< HEAD
use App\Features\Dashboard\Events\MetricsUpdated;
use App\Features\Inventory\Events\StockUpdated;
use Illuminate\Events\Dispatcher;

=======
use Illuminate\Events\Dispatcher;

/**
 * Event subscriber for broadcasting inventory events
 */
>>>>>>> codegen-bot/structure-simplification-split-1760284918
class BroadcastInventoryEvents
{
    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
<<<<<<< HEAD
        $events->listen(
            'eloquent.updated: App\Features\Inventory\Models\Product',
            [BroadcastInventoryEvents::class, 'handleProductUpdated']
        );

        $events->listen(
            'eloquent.created: App\Features\Inventory\Models\StockMovement',
            [BroadcastInventoryEvents::class, 'handleStockMovement']
        );
    }

    /**
     * Handle product updated event.
     */
    public function handleProductUpdated($event, $data): void
    {
        $product = $data[0];
        $changes = $product->getChanges();

        // Check if stock quantity changed
        if (isset($changes['stock_quantity'])) {
            $previousQuantity = $product->getOriginal('stock_quantity') ?? 0;
            $newQuantity = $product->stock_quantity ?? 0;

            // Determine movement type based on change
            $movementType = $newQuantity > $previousQuantity ? 'in' : 'out';

            // Broadcast stock updated event
            StockUpdated::dispatch(
                product: $product,
                previousQuantity: $previousQuantity,
                newQuantity: $newQuantity,
                movementType: $movementType,
                reason: 'Stock level updated'
            );

            // Update dashboard metrics
            $this->updateDashboardMetrics($product);
        }
    }

    /**
     * Handle stock movement created event.
     */
    public function handleStockMovement($event, $data): void
    {
        $stockMovement = $data[0];
        $product = $stockMovement->product;

        if ($product) {
            // Broadcast stock updated event
            StockUpdated::dispatch(
                product: $product,
                previousQuantity: $stockMovement->previous_quantity,
                newQuantity: $stockMovement->quantity,
                movementType: $stockMovement->movement_type,
                reason: $stockMovement->reason
            );

            // Update dashboard metrics
            $this->updateDashboardMetrics($product);
        }
    }

    /**
     * Update dashboard metrics when inventory changes.
     */
    private function updateDashboardMetrics($product): void
    {
        try {
            // Calculate updated metrics
            $organizationId = $product->organization_id ?? 1; // Default to 1 if not set
            $metrics = $this->calculateInventoryMetrics($organizationId);

            // Broadcast metrics update
            MetricsUpdated::dispatch(
                metrics: $metrics,
                organizationId: $organizationId,
                metricType: 'inventory'
            );
        } catch (\Exception $e) {
            // Log error but don't fail the operation
            logger()->error('Failed to update dashboard metrics after inventory change', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Calculate inventory metrics for an organization.
     */
    private function calculateInventoryMetrics(int $organizationId): array
    {
        // Total products count
        $totalProducts = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->count();

        // Low stock items (stock <= min_stock_level)
        $lowStockItems = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->whereColumn('stock_quantity', '<=', 'min_stock_level')
            ->where('min_stock_level', '>', 0)
            ->count();

        // Out of stock items
        $outOfStockItems = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->where('stock_quantity', '<=', 0)
            ->count();

        // Total inventory value
        $totalValue = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->sum(\DB::raw('stock_quantity * cost_price'));

        // Products needing reorder
        $reorderItems = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->whereColumn('stock_quantity', '<=', 'reorder_point')
            ->where('reorder_point', '>', 0)
            ->count();

        // Average stock level
        $averageStockLevel = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->avg('stock_quantity');

        // Stock turnover rate (simplified calculation)
        $stockTurnoverRate = $this->calculateStockTurnoverRate($organizationId);

        // Top products by value
        $topProductsByValue = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->select('id', 'name', 'sku', 'stock_quantity', 'cost_price',
                \DB::raw('stock_quantity * cost_price as total_value'))
            ->orderByDesc('total_value')
            ->limit(5)
            ->get()
            ->toArray();

        return [
            'total_products' => (int) $totalProducts,
            'low_stock_items' => (int) $lowStockItems,
            'out_of_stock_items' => (int) $outOfStockItems,
            'reorder_items' => (int) $reorderItems,
            'total_value' => (float) $totalValue,
            'average_stock_level' => (float) $averageStockLevel,
            'stock_turnover_rate' => (float) $stockTurnoverRate,
            'top_products_by_value' => $topProductsByValue,
            'stock_health' => [
                'healthy' => $totalProducts - $lowStockItems - $outOfStockItems,
                'low_stock' => $lowStockItems,
                'out_of_stock' => $outOfStockItems,
                'needs_reorder' => $reorderItems,
            ],
            'updated_at' => now()->toISOString(),
        ];
    }

    /**
     * Calculate stock turnover rate.
     */
    private function calculateStockTurnoverRate(int $organizationId): float
    {
        // Get stock movements for the last 30 days
        $thirtyDaysAgo = now()->subDays(30);

        $totalMovements = \DB::table('stock_movements')
            ->join('products', 'stock_movements.product_id', '=', 'products.id')
            ->where('products.organization_id', $organizationId)
            ->where('stock_movements.created_at', '>=', $thirtyDaysAgo)
            ->where('stock_movements.movement_type', 'out')
            ->sum('stock_movements.quantity');

        $averageInventory = \DB::table('products')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->avg('stock_quantity');

        if ($averageInventory > 0) {
            // Annualized turnover rate
            return ($totalMovements / $averageInventory) * (365 / 30);
        }

        return 0.0;
=======
        // Register event listeners here when needed
        // Example:
        // $events->listen(
        //     InventoryUpdated::class,
        //     [BroadcastInventoryEvents::class, 'handleInventoryUpdated']
        // );
    }

    /**
     * Handle inventory updated events.
     */
    public function handleInventoryUpdated($event): void
    {
        // Handle the event
    }

    /**
     * Handle stock level changed events.
     */
    public function handleStockLevelChanged($event): void
    {
        // Handle the event
    }

    /**
     * Handle product created events.
     */
    public function handleProductCreated($event): void
    {
        // Handle the event
>>>>>>> codegen-bot/structure-simplification-split-1760284918
    }
}
