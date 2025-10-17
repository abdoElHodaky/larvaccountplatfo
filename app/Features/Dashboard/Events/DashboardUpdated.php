<?php

namespace App\Features\Dashboard\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $organizationId;
    public int $userId;
    public array $changes;
    public string $updateType;

    public function __construct(int $organizationId, int $userId, array $changes, string $updateType = 'layout')
    {
        $this->organizationId = $organizationId;
        $this->userId = $userId;
        $this->changes = $changes;
        $this->updateType = $updateType;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard.' . $this->organizationId)
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'dashboard_updated',
            'update_type' => $this->updateType,
            'changes' => $this->changes,
            'user_id' => $this->userId,
            'organization_id' => $this->organizationId,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }
}
