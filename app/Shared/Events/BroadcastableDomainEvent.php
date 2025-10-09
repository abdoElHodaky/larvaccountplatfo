<?php

namespace App\Shared\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class BroadcastableDomainEvent extends DomainEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];
        $tenantId = $this->getTenantId();
        
        // Add tenant-specific channels
        foreach ($this->getChannelNames() as $channelName) {
            $fullChannelName = $this->formatChannelName($channelName, $tenantId);
            
            if ($this->isPrivateChannel($channelName)) {
                $channels[] = new PrivateChannel($fullChannelName);
            } elseif ($this->isPresenceChannel($channelName)) {
                $channels[] = new PresenceChannel($fullChannelName);
            } else {
                $channels[] = new Channel($fullChannelName);
            }
        }
        
        return $channels;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'event_type' => $this->getEventType(),
            'aggregate_id' => $this->getAggregateId(),
            'aggregate_type' => $this->getAggregateType(),
            'version' => $this->getVersion(),
            'occurred_at' => $this->getOccurredAt()->toISOString(),
            'payload' => $this->getPayload(),
            'metadata' => $this->getMetadata(),
            'tenant_id' => $this->getTenantId(),
            'broadcast_data' => $this->getBroadcastData(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return $this->getEventType();
    }

    /**
     * Determine if the event should broadcast.
     */
    public function shouldBroadcast(): bool
    {
        return $this->isBroadcastEnabled() && $this->shouldBroadcastForTenant();
    }

    /**
     * Get the queue connection that should be used to broadcast the event.
     */
    public function broadcastQueue(): string
    {
        return config('queue.default', 'sync');
    }

    /**
     * Get the queue that should be used to broadcast the event.
     */
    public function broadcastVia(): string
    {
        return config('broadcasting.default', 'reverb');
    }

    /**
     * Get the channel names for this event.
     */
    abstract protected function getChannelNames(): array;

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        return [];
    }

    /**
     * Get the tenant ID for channel isolation.
     */
    protected function getTenantId(): string
    {
        return $this->getMetadata()['tenant_id'] ?? session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }

    /**
     * Format channel name with tenant prefix.
     */
    protected function formatChannelName(string $channelName, string $tenantId): string
    {
        $prefix = config('reverb.multi_tenant.channel_prefix', 'tenant');
        
        // Handle different channel types
        if ($this->isPrivateChannel($channelName)) {
            return "private-{$prefix}.{$tenantId}.{$channelName}";
        } elseif ($this->isPresenceChannel($channelName)) {
            return "presence-{$prefix}.{$tenantId}.{$channelName}";
        } else {
            return "{$prefix}.{$tenantId}.{$channelName}";
        }
    }

    /**
     * Check if channel is private.
     */
    protected function isPrivateChannel(string $channelName): bool
    {
        return str_starts_with($channelName, 'private-') || 
               in_array($channelName, $this->getPrivateChannels());
    }

    /**
     * Check if channel is presence channel.
     */
    protected function isPresenceChannel(string $channelName): bool
    {
        return str_starts_with($channelName, 'presence-') || 
               in_array($channelName, $this->getPresenceChannels());
    }

    /**
     * Get private channel names.
     */
    protected function getPrivateChannels(): array
    {
        return [];
    }

    /**
     * Get presence channel names.
     */
    protected function getPresenceChannels(): array
    {
        return [];
    }

    /**
     * Check if broadcasting is enabled for this event type.
     */
    protected function isBroadcastEnabled(): bool
    {
        return config('reverb.broadcasting.domain_events.enabled', true);
    }

    /**
     * Check if event should broadcast for the current tenant.
     */
    protected function shouldBroadcastForTenant(): bool
    {
        // Add tenant-specific broadcasting logic here
        // For example, check tenant subscription level, feature flags, etc.
        return true;
    }

    /**
     * Get the tags for this broadcast event.
     */
    public function tags(): array
    {
        return [
            'broadcast',
            'domain-event',
            'tenant:' . $this->getTenantId(),
            'event-type:' . $this->getEventType(),
            'aggregate-type:' . $this->getAggregateType(),
        ];
    }
}
