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

class StockReserved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $stockLevel;
    public $reservedQuantity;

    /**
     * Create a new event instance.
     */
    public function __construct(StockLevel $stockLevel, float $reservedQuantity)
    {
        $this->stockLevel = $stockLevel;
        $this->reservedQuantity = $reservedQuantity;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("organization.{$this->stockLevel->organization_id}.inventory"),
            new PrivateChannel("organization.{$this->stockLevel->organization_id}.product.{$this->stockLevel->product_id}"),
            new PrivateChannel("organization.{$this->stockLevel->organization_id}.warehouse.{$this->stockLevel->warehouse_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'stock_level' => [
                'id' => $this->stockLevel->id,
                'product_id' => $this->stockLevel->product_id,
                'product_name' => $this->stockLevel->product->name,
                'product_sku' => $this->stockLevel->product->sku,
                'warehouse_id' => $this->stockLevel->warehouse_id,
                'warehouse_name' => $this->stockLevel->warehouse->name ?? null,
                'current_quantity' => $this->stockLevel->current_quantity,
                'reserved_quantity' => $this->stockLevel->reserved_quantity,
                'available_quantity' => $this->stockLevel->available_quantity,
                'stock_status' => $this->stockLevel->stock_status,
                'stock_status_color' => $this->stockLevel->stock_status_color,
            ],
            'reserved_quantity' => $this->reservedQuantity,
            'action' => 'reserved',
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'stock.reserved';
    }
}

