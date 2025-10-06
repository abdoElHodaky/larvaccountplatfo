<?php

namespace Modules\Shared\Contracts;

use Modules\Shared\Events\DomainEvent;

interface EventBusInterface
{
    /**
     * Publish a domain event
     */
    public function publish(DomainEvent $event): void;

    /**
     * Publish multiple domain events
     */
    public function publishBatch(array $events): void;

    /**
     * Subscribe to a domain event
     */
    public function subscribe(string $eventType, callable $handler): void;

    /**
     * Unsubscribe from a domain event
     */
    public function unsubscribe(string $eventType, callable $handler): void;

    /**
     * Get all subscribers for an event type
     */
    public function getSubscribers(string $eventType): array;

    /**
     * Clear all subscribers
     */
    public function clearSubscribers(): void;
}
