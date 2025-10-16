<?php

namespace App\Features\Inventory\GraphQL\Queries;

use App\Features\Inventory\Services\InventoryService;

class OutOfStockProducts
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get out of stock products
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        return $this->inventoryService->getOutOfStockProducts();
    }
}
