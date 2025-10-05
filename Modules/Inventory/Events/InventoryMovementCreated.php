<?php

namespace Modules\Inventory\Events;

use Modules\Inventory\Models\StockMovement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryMovementCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $stockMovement;

    /**
     * Create a new event instance.
     */
    public function __construct(StockMovement $stockMovement)
    {
        $this->stockMovement = $stockMovement;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("organization.{$this->stockMovement->organization_id}.inventory"),
            new PrivateChannel("organization.{$this->stockMovement->organization_id}.product.{$this->stockMovement->product_id}"),
            new PrivateChannel("organization.{$this->stockMovement->organization_id}.warehouse.{$this->stockMovement->warehouse_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'movement' => [
                'id' => $this->stockMovement->id,
                'product_id' => $this->stockMovement->product_id,
                'product_name' => $this->stockMovement->product->name,
                'product_sku' => $this->stockMovement->product->sku,
                'warehouse_id' => $this->stockMovement->warehouse_id,
                'warehouse_name' => $this->stockMovement->warehouse->name ?? null,
                'movement_type' => $this->stockMovement->movement_type,
                'movement_type_display' => $this->stockMovement->movement_type_display,
                'quantity' => $this->stockMovement->quantity,
                'signed_quantity' => $this->stockMovement->signed_quantity,
                'unit_cost' => $this->stockMovement->unit_cost,
                'total_cost' => $this->stockMovement->total_cost,
                'reason' => $this->stockMovement->reason,
                'reason_display' => $this->stockMovement->reason_display,
                'movement_date' => $this->stockMovement->movement_date->toISOString(),
                'created_by' => $this->stockMovement->createdBy->name ?? null,
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'inventory.movement.created';
    }
}

