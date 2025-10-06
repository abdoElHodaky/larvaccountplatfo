<?php

namespace Modules\Shared\Telescope\Watchers;

use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\Watchers\Watcher;
use Modules\Shared\Events\DomainEvent;
use Illuminate\Contracts\Events\Dispatcher;

class DomainEventWatcher extends Watcher
{
    /**
     * Register the watcher.
     */
    public function register($app): void
    {
        $app[Dispatcher::class]->listen('*', [$this, 'recordDomainEvent']);
    }

    /**
     * Record a domain event.
     */
    public function recordDomainEvent($eventName, $payload): void
    {
        if (!$this->shouldRecord($eventName, $payload)) {
            return;
        }

        $event = $payload[0] ?? null;
        
        if (!$event instanceof DomainEvent) {
            return;
        }

        Telescope::recordDomainEvent(IncomingEntry::make([
            'event_id' => $event->getEventId(),
            'event_type' => $event->getEventType(),
            'aggregate_id' => $event->getAggregateId(),
            'aggregate_type' => $event->getAggregateType(),
            'version' => $event->getVersion(),
            'occurred_at' => $event->getOccurredAt()->toISOString(),
            'payload' => $event->getPayload(),
            'metadata' => $event->getMetadata(),
            'tenant_id' => $this->getCurrentTenantId(),
        ])->tags([
            'domain-event',
            'event-type:' . $event->getEventType(),
            'aggregate-type:' . $event->getAggregateType(),
            'tenant:' . $this->getCurrentTenantId(),
        ]));
    }

    /**
     * Determine if the event should be recorded.
     */
    private function shouldRecord($eventName, $payload): bool
    {
        if (!$this->options['enabled'] ?? true) {
            return false;
        }

        // Only record domain events
        if (!isset($payload[0]) || !($payload[0] instanceof DomainEvent)) {
            return false;
        }

        // Skip if in ignored events list
        $ignoredEvents = $this->options['ignore'] ?? [];
        if (in_array($eventName, $ignoredEvents)) {
            return false;
        }

        return true;
    }

    /**
     * Get the current tenant ID.
     */
    private function getCurrentTenantId(): ?string
    {
        return session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }
}
