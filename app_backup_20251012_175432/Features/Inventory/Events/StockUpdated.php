<?php

namespace App\Features\Inventory\Events;

use App\Features\Inventory\Models\Product;
use App\Shared\Events\BroadcastableDomainEvent;

class StockUpdated extends BroadcastableDomainEvent
{
    public function __construct(
        public readonly Product $product,
        public readonly int $previousQuantity,
        public readonly int $newQuantity,
        public readonly string $movementType,
        public readonly ?string $reason = null
    ) {
        parent::__construct(
            aggregateId: $product->id,
            aggregateType: 'product',
            eventType: 'stock.updated',
            payload: [
                'product_id' => $product->id,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $newQuantity,
                'movement_type' => $movementType,
                'reason' => $reason,
                'organization_id' => $product->organization_id ?? null,
            ],
            metadata: [
                'tenant_id' => $product->organization_id ?? 'default',
                'user_id' => auth()->id(),
            ]
        );
    }

    /**
     * Get the channels the event should broadcast on.
     */
    protected function getChannelNames(): array
    {
        $organizationId = $this->product->organization_id ?? 'default';

        return [
            'inventory',
            'dashboard',
            "organization.{$organizationId}",
        ];
    }

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        return [
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'stock_quantity' => $this->newQuantity,
                'previous_quantity' => $this->previousQuantity,
                'min_stock_level' => $this->product->min_stock_level,
                'max_stock_level' => $this->product->max_stock_level,
                'reorder_point' => $this->product->reorder_point,
                'category_id' => $this->product->category_id,
                'updated_at' => $this->product->updated_at,
            ],
            'stock_movement' => [
                'product_id' => $this->product->id,
                'quantity_change' => $this->newQuantity - $this->previousQuantity,
                'movement_type' => $this->movementType,
                'reason' => $this->reason,
                'timestamp' => now(),
            ],
            'alerts' => $this->generateStockAlerts(),
        ];
    }

    /**
     * Get private channel names.
     */
    protected function getPrivateChannels(): array
    {
        $organizationId = $this->product->organization_id ?? 'default';

        return [
            'inventory',
            "organization.{$organizationId}",
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'inventory:stock_updated';
    }

    /**
     * Generate stock level alerts.
     */
    private function generateStockAlerts(): array
    {
        $alerts = [];

        // Low stock alert
        if ($this->product->min_stock_level && $this->newQuantity <= $this->product->min_stock_level) {
            $alerts[] = [
                'type' => 'low_stock',
                'message' => "Low stock alert: {$this->product->name} ({$this->product->sku}) has {$this->newQuantity} units remaining",
                'severity' => 'warning',
                'product_id' => $this->product->id,
                'current_stock' => $this->newQuantity,
                'min_stock_level' => $this->product->min_stock_level,
            ];
        }

        // Out of stock alert
        if ($this->newQuantity <= 0) {
            $alerts[] = [
                'type' => 'out_of_stock',
                'message' => "Out of stock: {$this->product->name} ({$this->product->sku}) is now out of stock",
                'severity' => 'error',
                'product_id' => $this->product->id,
                'current_stock' => $this->newQuantity,
            ];
        }

        // Reorder point alert
        if ($this->product->reorder_point && $this->newQuantity <= $this->product->reorder_point) {
            $alerts[] = [
                'type' => 'reorder_point',
                'message' => "Reorder point reached: {$this->product->name} ({$this->product->sku}) needs to be reordered",
                'severity' => 'info',
                'product_id' => $this->product->id,
                'current_stock' => $this->newQuantity,
                'reorder_point' => $this->product->reorder_point,
            ];
        }

        return $alerts;
    }
}
