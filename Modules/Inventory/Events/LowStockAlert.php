<?php

namespace Modules\Inventory\Events;

use Modules\Inventory\Models\StockLevel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $stockLevel;

    /**
     * Create a new event instance.
     */
    public function __construct(StockLevel $stockLevel)
    {
        $this->stockLevel = $stockLevel;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("organization.{$this->stockLevel->organization_id}.alerts"),
            new PrivateChannel("organization.{$this->stockLevel->organization_id}.inventory.alerts"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'alert' => [
                'type' => 'low_stock',
                'severity' => 'warning',
                'title' => 'Low Stock Alert',
                'message' => "Product '{$this->stockLevel->product->name}' is running low on stock",
                'product' => [
                    'id' => $this->stockLevel->product_id,
                    'name' => $this->stockLevel->product->name,
                    'sku' => $this->stockLevel->product->sku,
                    'current_quantity' => $this->stockLevel->current_quantity,
                    'reorder_point' => $this->stockLevel->product->reorder_point,
                    'reorder_quantity' => $this->stockLevel->product->reorder_quantity,
                ],
                'warehouse' => [
                    'id' => $this->stockLevel->warehouse_id,
                    'name' => $this->stockLevel->warehouse->name ?? null,
                ],
                'stock_level' => [
                    'current_quantity' => $this->stockLevel->current_quantity,
                    'available_quantity' => $this->stockLevel->available_quantity,
                    'stock_status' => $this->stockLevel->stock_status,
                    'stock_status_color' => $this->stockLevel->stock_status_color,
                ],
                'actions' => [
                    [
                        'label' => 'Create Purchase Order',
                        'action' => 'create_purchase_order',
                        'url' => "/inventory/purchase-orders/create?product_id={$this->stockLevel->product_id}",
                    ],
                    [
                        'label' => 'View Product',
                        'action' => 'view_product',
                        'url' => "/inventory/products/{$this->stockLevel->product_id}",
                    ],
                ],
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'inventory.low_stock_alert';
    }
}

