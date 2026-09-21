<?php

namespace App\Telescope\Watchers;

use Illuminate\Contracts\Foundation\Application;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\Watchers\Watcher;

class DomainEventWatcher extends Watcher
{
    /**
     * Register the watcher.
     */
    public function register(Application $app): void
    {
        $app['events']->listen('*', [$this, 'recordEvent']);
    }

    /**
     * Record a domain event.
     */
    public function recordEvent(string $eventName, array $data): void
    {
        if (! Telescope::isRecording()) {
            return;
        }

        if ($this->shouldRecord($eventName)) {
            Telescope::recordEvent(
                IncomingEntry::make([
                    'name' => $eventName,
                    'payload' => $this->formatPayload($data),
                ])->type('event')
            );
        }
    }

    /**
     * Determine if the event should be recorded by this watcher.
     */
    protected function shouldRecord(string $eventName): bool
    {
        // Adjust filter criteria for domain events in your application
        return str_contains($eventName, 'Domain') || str_contains($eventName, 'Events\\');
    }

    /**
     * Format payload safely for Telescope display.
     */
    protected function formatPayload(array $data): array
    {
        return array_map(function ($value) {
            return is_object($value) ? get_class($value) : $value;
        }, $data);
    }
}
