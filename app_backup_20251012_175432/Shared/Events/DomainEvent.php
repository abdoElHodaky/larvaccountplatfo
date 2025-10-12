<?php

namespace App\Shared\Events;

use DateTimeImmutable;

abstract class DomainEvent
{
    private string $eventId;

    private DateTimeImmutable $occurredAt;

    private string $eventType;

    private int $version;

    public function __construct()
    {
        $this->eventId = $this->generateEventId();
        $this->occurredAt = new DateTimeImmutable;
        $this->eventType = static::class;
        $this->version = $this->getEventVersion();
    }

    public function getEventId(): string
    {
        return $this->eventId;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventType(): string
    {
        return $this->eventType;
    }

    public function getVersion(): int
    {
        return $this->version;
    }

    /**
     * Get the aggregate ID that this event belongs to
     */
    abstract public function getAggregateId(): string;

    /**
     * Get the aggregate type that this event belongs to
     */
    abstract public function getAggregateType(): string;

    /**
     * Get the event payload
     */
    abstract public function getPayload(): array;

    /**
     * Get the event version for backward compatibility
     */
    protected function getEventVersion(): int
    {
        return 1;
    }

    /**
     * Serialize the event to array
     */
    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId,
            'event_type' => $this->eventType,
            'aggregate_id' => $this->getAggregateId(),
            'aggregate_type' => $this->getAggregateType(),
            'version' => $this->version,
            'occurred_at' => $this->occurredAt->format('Y-m-d H:i:s.u'),
            'payload' => $this->getPayload(),
        ];
    }

    /**
     * Create event from array
     */
    public static function fromArray(array $data): static
    {
        $event = new static;
        $event->eventId = $data['event_id'];
        $event->eventType = $data['event_type'];
        $event->version = $data['version'];
        $event->occurredAt = new DateTimeImmutable($data['occurred_at']);

        return $event;
    }

    private function generateEventId(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xFFFF), mt_rand(0, 0xFFFF),
            mt_rand(0, 0xFFFF),
            mt_rand(0, 0x0FFF) | 0x4000,
            mt_rand(0, 0x3FFF) | 0x8000,
            mt_rand(0, 0xFFFF), mt_rand(0, 0xFFFF), mt_rand(0, 0xFFFF)
        );
    }
}
