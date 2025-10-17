<?php

namespace App\Features\Dashboard\Events;

use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WidgetCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DashboardWidget $widget;

    public function __construct(DashboardWidget $widget)
    {
        $this->widget = $widget;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard.' . $this->widget->organization_id)
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'widget_created',
            'widget' => [
                'id' => $this->widget->id,
                'title' => $this->widget->title,
                'type' => $this->widget->type,
                'position' => $this->widget->position,
                'size' => $this->widget->size,
                'configuration' => $this->widget->configuration,
                'is_active' => $this->widget->is_active,
                'created_at' => $this->widget->created_at->toISOString(),
                'updated_at' => $this->widget->updated_at->toISOString(),
            ],
            'user' => [
                'id' => $this->widget->user_id,
                'name' => $this->widget->user->name ?? 'Unknown User',
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'widget.created';
    }
}
