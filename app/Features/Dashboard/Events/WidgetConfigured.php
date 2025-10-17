<?php

namespace App\Features\Dashboard\Events;

use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WidgetConfigured implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DashboardWidget $widget;
    public array $oldConfiguration;
    public array $newConfiguration;

    public function __construct(DashboardWidget $widget, array $oldConfiguration, array $newConfiguration)
    {
        $this->widget = $widget;
        $this->oldConfiguration = $oldConfiguration;
        $this->newConfiguration = $newConfiguration;
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
            'type' => 'widget_configured',
            'widget' => [
                'id' => $this->widget->id,
                'title' => $this->widget->title,
                'type' => $this->widget->type,
                'position' => $this->widget->position,
                'size' => $this->widget->size,
                'configuration' => $this->newConfiguration,
                'is_active' => $this->widget->is_active,
                'updated_at' => $this->widget->updated_at->toISOString(),
            ],
            'configuration_changes' => [
                'old' => $this->oldConfiguration,
                'new' => $this->newConfiguration,
                'changed_keys' => array_keys(array_diff_assoc($this->newConfiguration, $this->oldConfiguration)),
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
        return 'widget.configured';
    }
}
