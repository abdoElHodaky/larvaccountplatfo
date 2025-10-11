<?php

namespace App\Shared\Services;

use App\Shared\Contracts\EventBusInterface;
use App\Shared\Events\DomainEvent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

class InterModuleBus implements EventBusInterface
{
    /**
     * Registered module services.
     */
    protected $services = [];

    /**
     * Event listeners for inter-module communication.
     */
    protected $listeners = [];

    /**
     * Domain event subscribers.
     */
    protected $domainEventSubscribers = [];

    /**
     * Module communication history for debugging.
     */
    protected $communicationHistory = [];

    /**
     * Register a service from a module.
     */
    public function registerService(string $moduleName, string $serviceName, $serviceInstance): void
    {
        $key = "{$moduleName}.{$serviceName}";
        $this->services[$key] = $serviceInstance;

        Log::debug("Inter-module service registered: {$key}");
    }

    /**
     * Get a service from another module.
     */
    public function getService(string $moduleName, string $serviceName)
    {
        $key = "{$moduleName}.{$serviceName}";

        if (! isset($this->services[$key])) {
            throw new \Exception("Service not found: {$key}");
        }

        $this->logCommunication('service_call', $key, [
            'caller' => $this->getCurrentModule(),
            'service' => $key,
        ]);

        return $this->services[$key];
    }

    /**
     * Check if a service exists.
     */
    public function hasService(string $moduleName, string $serviceName): bool
    {
        $key = "{$moduleName}.{$serviceName}";

        return isset($this->services[$key]);
    }

    /**
     * Call a method on a service from another module.
     */
    public function callService(string $moduleName, string $serviceName, string $method, array $parameters = [])
    {
        $service = $this->getService($moduleName, $serviceName);

        if (! method_exists($service, $method)) {
            throw new \Exception("Method {$method} does not exist on service {$moduleName}.{$serviceName}");
        }

        $this->logCommunication('method_call', "{$moduleName}.{$serviceName}.{$method}", [
            'caller' => $this->getCurrentModule(),
            'service' => "{$moduleName}.{$serviceName}",
            'method' => $method,
            'parameters' => $parameters,
        ]);

        return call_user_func_array([$service, $method], $parameters);
    }

    /**
     * Broadcast an event to other modules.
     */
    public function broadcast(string $eventName, array $data = []): void
    {
        $eventClass = "Modules\\Events\\{$eventName}";

        if (class_exists($eventClass)) {
            Event::dispatch(new $eventClass($data));
        } else {
            // Use generic inter-module event
            Event::dispatch('inter-module.'.$eventName, $data);
        }

        $this->logCommunication('event_broadcast', $eventName, [
            'broadcaster' => $this->getCurrentModule(),
            'event' => $eventName,
            'data' => $data,
        ]);
    }

    /**
     * Listen for events from other modules.
     */
    public function listen(string $eventName, callable $callback): void
    {
        $listenerKey = $eventName.'.'.uniqid();
        $this->listeners[$listenerKey] = $callback;

        Event::listen('inter-module.'.$eventName, $callback);

        Log::debug("Inter-module event listener registered: {$eventName}");
    }

    /**
     * Send a direct message to another module.
     */
    public function sendMessage(string $targetModule, string $messageType, array $data = [])
    {
        $eventName = "message.{$targetModule}.{$messageType}";

        $this->broadcast($eventName, array_merge($data, [
            'sender' => $this->getCurrentModule(),
            'target' => $targetModule,
            'type' => $messageType,
            'timestamp' => now(),
        ]));

        $this->logCommunication('message_send', $eventName, [
            'sender' => $this->getCurrentModule(),
            'target' => $targetModule,
            'type' => $messageType,
            'data' => $data,
        ]);
    }

    /**
     * Listen for messages from other modules.
     */
    public function listenForMessages(string $messageType, callable $callback): void
    {
        $currentModule = $this->getCurrentModule();
        $eventName = "message.{$currentModule}.{$messageType}";

        $this->listen($eventName, $callback);
    }

    /**
     * Get all registered services.
     */
    public function getServices(): array
    {
        return $this->services;
    }

    /**
     * Get services from a specific module.
     */
    public function getModuleServices(string $moduleName): array
    {
        $prefix = "{$moduleName}.";
        $services = [];

        foreach ($this->services as $key => $service) {
            if (str_starts_with($key, $prefix)) {
                $serviceName = substr($key, strlen($prefix));
                $services[$serviceName] = $service;
            }
        }

        return $services;
    }

    /**
     * Check if a module has any registered services.
     */
    public function moduleHasServices(string $moduleName): bool
    {
        $prefix = "{$moduleName}.";

        foreach (array_keys($this->services) as $key) {
            if (str_starts_with($key, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get communication statistics.
     */
    public function getCommunicationStats(): array
    {
        $stats = [
            'total_communications' => count($this->communicationHistory),
            'by_type' => [],
            'by_module' => [],
            'recent_communications' => array_slice($this->communicationHistory, -10),
        ];

        foreach ($this->communicationHistory as $communication) {
            $type = $communication['type'];
            $module = $communication['data']['caller'] ?? 'unknown';

            $stats['by_type'][$type] = ($stats['by_type'][$type] ?? 0) + 1;
            $stats['by_module'][$module] = ($stats['by_module'][$module] ?? 0) + 1;
        }

        return $stats;
    }

    /**
     * Clear communication history.
     */
    public function clearHistory(): void
    {
        $this->communicationHistory = [];
    }

    /**
     * Get communication history.
     */
    public function getHistory(): array
    {
        return $this->communicationHistory;
    }

    /**
     * Create a service proxy for easier access.
     */
    public function createServiceProxy(string $moduleName, string $serviceName): ServiceProxy
    {
        return new ServiceProxy($this, $moduleName, $serviceName);
    }

    /**
     * Batch register services from a module.
     */
    public function registerModuleServices(string $moduleName, array $services): void
    {
        foreach ($services as $serviceName => $serviceInstance) {
            $this->registerService($moduleName, $serviceName, $serviceInstance);
        }
    }

    /**
     * Unregister all services from a module.
     */
    public function unregisterModuleServices(string $moduleName): void
    {
        $prefix = "{$moduleName}.";

        foreach (array_keys($this->services) as $key) {
            if (str_starts_with($key, $prefix)) {
                unset($this->services[$key]);
            }
        }

        Log::debug("All services unregistered for module: {$moduleName}");
    }

    /**
     * Check module connectivity.
     */
    public function checkModuleConnectivity(string $moduleName): array
    {
        $connectivity = [
            'has_services' => $this->moduleHasServices($moduleName),
            'service_count' => count($this->getModuleServices($moduleName)),
            'can_communicate' => true,
            'last_communication' => null,
        ];

        // Find last communication with this module
        foreach (array_reverse($this->communicationHistory) as $communication) {
            $caller = $communication['data']['caller'] ?? null;
            $target = $communication['data']['target'] ?? null;

            if ($caller === $moduleName || $target === $moduleName) {
                $connectivity['last_communication'] = $communication;
                break;
            }
        }

        return $connectivity;
    }

    /**
     * Get the current module name from the call stack.
     */
    protected function getCurrentModule(): string
    {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10);

        foreach ($trace as $frame) {
            if (isset($frame['class']) && str_contains($frame['class'], 'Modules\\')) {
                $parts = explode('\\', $frame['class']);
                if (count($parts) >= 2 && $parts[0] === 'Modules') {
                    return $parts[1];
                }
            }
        }

        return 'unknown';
    }

    /**
     * Log communication for debugging and monitoring.
     */
    protected function logCommunication(string $type, string $action, array $data): void
    {
        $communication = [
            'type' => $type,
            'action' => $action,
            'data' => $data,
            'timestamp' => now(),
        ];

        $this->communicationHistory[] = $communication;

        // Keep only last 1000 communications to prevent memory issues
        if (count($this->communicationHistory) > 1000) {
            $this->communicationHistory = array_slice($this->communicationHistory, -1000);
        }

        Log::debug("Inter-module communication: {$type} - {$action}", $data);
    }

    // Domain Event Bus Implementation

    /**
     * Publish a domain event
     */
    public function publish(DomainEvent $event): void
    {
        $eventType = $event->getEventType();

        // Store event for potential replay/debugging
        $this->logCommunication('domain_event', $eventType, $event->toArray());

        // Notify subscribers
        if (isset($this->domainEventSubscribers[$eventType])) {
            foreach ($this->domainEventSubscribers[$eventType] as $handler) {
                try {
                    call_user_func($handler, $event);
                } catch (\Exception $e) {
                    Log::error("Error in domain event handler for {$eventType}: ".$e->getMessage(), [
                        'event' => $event->toArray(),
                        'exception' => $e,
                    ]);
                }
            }
        }

        // Also broadcast via Laravel's event system for broader integration
        Event::dispatch('domain-event.'.$eventType, $event);
    }

    /**
     * Publish multiple domain events
     */
    public function publishBatch(array $events): void
    {
        foreach ($events as $event) {
            if ($event instanceof DomainEvent) {
                $this->publish($event);
            }
        }
    }

    /**
     * Subscribe to a domain event
     */
    public function subscribe(string $eventType, callable $handler): void
    {
        if (! isset($this->domainEventSubscribers[$eventType])) {
            $this->domainEventSubscribers[$eventType] = [];
        }

        $this->domainEventSubscribers[$eventType][] = $handler;

        Log::debug("Domain event subscriber registered: {$eventType}");
    }

    /**
     * Unsubscribe from a domain event
     */
    public function unsubscribe(string $eventType, callable $handler): void
    {
        if (! isset($this->domainEventSubscribers[$eventType])) {
            return;
        }

        $this->domainEventSubscribers[$eventType] = array_filter(
            $this->domainEventSubscribers[$eventType],
            function ($subscriber) use ($handler) {
                return $subscriber !== $handler;
            }
        );

        if (empty($this->domainEventSubscribers[$eventType])) {
            unset($this->domainEventSubscribers[$eventType]);
        }
    }

    /**
     * Get all subscribers for an event type
     */
    public function getSubscribers(string $eventType): array
    {
        return $this->domainEventSubscribers[$eventType] ?? [];
    }

    /**
     * Clear all subscribers
     */
    public function clearSubscribers(): void
    {
        $this->domainEventSubscribers = [];
    }

    /**
     * Get domain event statistics
     */
    public function getDomainEventStats(): array
    {
        $stats = [
            'total_event_types' => count($this->domainEventSubscribers),
            'total_subscribers' => 0,
            'event_types' => [],
        ];

        foreach ($this->domainEventSubscribers as $eventType => $subscribers) {
            $subscriberCount = count($subscribers);
            $stats['total_subscribers'] += $subscriberCount;
            $stats['event_types'][$eventType] = $subscriberCount;
        }

        return $stats;
    }
}

/**
 * Service proxy for easier inter-module service access.
 */
class ServiceProxy
{
    protected $bus;

    protected $moduleName;

    protected $serviceName;

    public function __construct(InterModuleBus $bus, string $moduleName, string $serviceName)
    {
        $this->bus = $bus;
        $this->moduleName = $moduleName;
        $this->serviceName = $serviceName;
    }

    public function __call(string $method, array $parameters)
    {
        return $this->bus->callService($this->moduleName, $this->serviceName, $method, $parameters);
    }

    public function getService()
    {
        return $this->bus->getService($this->moduleName, $this->serviceName);
    }
}
