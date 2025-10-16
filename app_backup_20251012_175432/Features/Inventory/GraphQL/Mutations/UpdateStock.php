<?php

namespace App\Features\Inventory\GraphQL\Mutations;

use App\Features\Inventory\Models\StockMovement;
use App\Features\Inventory\Services\InventoryService;

class UpdateStock
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Update stock level for a product
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        $result = $this->inventoryService->updateStock(
            $args['product_id'],
            $args['quantity'],
            $args['reason'] ?? null,
            $args['movement_type']
        );

        // Create a StockMovement object from the result
        $stockMovement = new StockMovement;
        $stockMovement->product_id = $result['product_id'];
        $stockMovement->quantity = $result['quantity'];
        $stockMovement->previous_quantity = $result['previous_quantity'];
        $stockMovement->movement_type = $result['movement_type'];
        $stockMovement->reason = $result['reason'];
        $stockMovement->reference = $args['reference'] ?? null;
        $stockMovement->created_at = now();

        return $stockMovement;
    }
}
