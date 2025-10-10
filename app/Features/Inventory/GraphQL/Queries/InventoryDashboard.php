<?php

namespace App\Features\Inventory\GraphQL\Queries;

use App\Features\Inventory\Services\InventoryService;

class InventoryDashboard
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get inventory dashboard data
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        return $this->inventoryService->getDashboardData();
    }
}
