<?php

namespace App\Shared\Services;

use Exception;
use Illuminate\Support\Collection;

/**
 * Service registry for managing service instances and dependencies
 */
class ServiceRegistry
{
    protected Collection $services;

    protected array $serviceMap = [];

    protected array $dependencyGraph = [];

    protected array $initializedServices = [];

    public function __construct()
    {
        $this->services = new Collection;
    }

    /**
     * Register a service
     */
    public function register(string $name, ServiceInterface $service): void
    {
        $this->services->put($name, $service);
        $this->serviceMap[$name] = get_class($service);
        $this->dependencyGraph[$name] = $service->getDependencies();
    }

    /**
     * Get a service by name
     */
    public function get(string $name): ?ServiceInterface
    {
        return $this->services->get($name);
    }

    /**
     * Check if a service is registered
     */
    public function has(string $name): bool
    {
        return $this->services->has($name);
    }

    /**
     * Get all registered services
     */
    public function all(): Collection
    {
        return $this->services;
    }

    /**
     * Get service names
     */
    public function getServiceNames(): array
    {
        return $this->services->keys()->toArray();
    }

    /**
     * Get service map (name => class)
     */
    public function getServiceMap(): array
    {
        return $this->serviceMap;
    }

    /**
     * Get dependency graph
     */
    public function getDependencyGraph(): array
    {
        return $this->dependencyGraph;
    }

    /**
     * Get services in dependency order
     */
    public function getServicesInDependencyOrder(): array
    {
        $sorted = [];
        $visited = [];
        $visiting = [];

        foreach ($this->getServiceNames() as $serviceName) {
            if (! isset($visited[$serviceName])) {
                $this->topologicalSort($serviceName, $visited, $visiting, $sorted);
            }
        }

        return array_reverse($sorted);
    }

    /**
     * Topological sort for dependency resolution
     */
    protected function topologicalSort(string $serviceName, array &$visited, array &$visiting, array &$sorted): void
    {
        if (isset($visiting[$serviceName])) {
            throw new Exception("Circular dependency detected involving service: {$serviceName}");
        }

        if (isset($visited[$serviceName])) {
            return;
        }

        $visiting[$serviceName] = true;

        $dependencies = $this->dependencyGraph[$serviceName] ?? [];
        foreach ($dependencies as $dependency) {
            if ($this->has($dependency)) {
                $this->topologicalSort($dependency, $visited, $visiting, $sorted);
            }
        }

        unset($visiting[$serviceName]);
        $visited[$serviceName] = true;
        $sorted[] = $serviceName;
    }

    /**
     * Initialize all services in dependency order
     */
    public function initializeAll(): void
    {
        $orderedServices = $this->getServicesInDependencyOrder();

        foreach ($orderedServices as $serviceName) {
            $this->initializeService($serviceName);
        }
    }

    /**
     * Initialize a specific service
     */
    public function initializeService(string $name): void
    {
        if (isset($this->initializedServices[$name])) {
            return; // Already initialized
        }

        $service = $this->get($name);
        if (! $service) {
            throw new Exception("Service not found: {$name}");
        }

        // Initialize dependencies first
        $dependencies = $service->getDependencies();
        foreach ($dependencies as $dependency) {
            if ($this->has($dependency)) {
                $this->initializeService($dependency);
            }
        }

        // Initialize the service
        $service->initialize();
        $this->initializedServices[$name] = true;
    }

    /**
     * Cleanup all services
     */
    public function cleanupAll(): void
    {
        $orderedServices = array_reverse($this->getServicesInDependencyOrder());

        foreach ($orderedServices as $serviceName) {
            $this->cleanupService($serviceName);
        }
    }

    /**
     * Cleanup a specific service
     */
    public function cleanupService(string $name): void
    {
        $service = $this->get($name);
        if ($service) {
            $service->cleanup();
            unset($this->initializedServices[$name]);
        }
    }

    /**
     * Get health status of all services
     */
    public function getHealthStatus(): array
    {
        $status = [];

        foreach ($this->services as $name => $service) {
            $status[$name] = [
                'name' => $service->getName(),
                'version' => $service->getVersion(),
                'healthy' => $service->isHealthy(),
                'initialized' => isset($this->initializedServices[$name]),
                'dependencies' => $service->getDependencies(),
            ];
        }

        return $status;
    }

    /**
     * Get service metrics
     */
    public function getMetrics(): array
    {
        $metrics = [
            'total_services' => $this->services->count(),
            'initialized_services' => count($this->initializedServices),
            'healthy_services' => 0,
            'unhealthy_services' => 0,
            'services' => [],
        ];

        foreach ($this->services as $name => $service) {
            $isHealthy = $service->isHealthy();

            if ($isHealthy) {
                $metrics['healthy_services']++;
            } else {
                $metrics['unhealthy_services']++;
            }

            $serviceMetrics = method_exists($service, 'getMetrics')
                ? $service->getMetrics()
                : [
                    'name' => $service->getName(),
                    'version' => $service->getVersion(),
                    'healthy' => $isHealthy,
                ];

            $metrics['services'][$name] = $serviceMetrics;
        }

        return $metrics;
    }

    /**
     * Unregister a service
     */
    public function unregister(string $name): void
    {
        if ($this->has($name)) {
            $this->cleanupService($name);
            $this->services->forget($name);
            unset($this->serviceMap[$name]);
            unset($this->dependencyGraph[$name]);
        }
    }

    /**
     * Clear all services
     */
    public function clear(): void
    {
        $this->cleanupAll();
        $this->services = new Collection;
        $this->serviceMap = [];
        $this->dependencyGraph = [];
        $this->initializedServices = [];
    }

    /**
     * Get services by interface or class
     */
    public function getServicesByType(string $type): Collection
    {
        return $this->services->filter(function ($service) use ($type) {
            return $service instanceof $type;
        });
    }

    /**
     * Check for circular dependencies
     */
    public function hasCircularDependencies(): bool
    {
        try {
            $this->getServicesInDependencyOrder();

            return false;
        } catch (Exception $e) {
            return str_contains($e->getMessage(), 'Circular dependency');
        }
    }

    /**
     * Get dependency tree for a service
     */
    public function getDependencyTree(string $serviceName): array
    {
        $tree = [];
        $this->buildDependencyTree($serviceName, $tree, []);

        return $tree;
    }

    /**
     * Build dependency tree recursively
     */
    protected function buildDependencyTree(string $serviceName, array &$tree, array $visited): void
    {
        if (in_array($serviceName, $visited)) {
            return; // Avoid infinite recursion
        }

        $visited[] = $serviceName;
        $dependencies = $this->dependencyGraph[$serviceName] ?? [];

        $tree[$serviceName] = [];

        foreach ($dependencies as $dependency) {
            if ($this->has($dependency)) {
                $this->buildDependencyTree($dependency, $tree[$serviceName], $visited);
            }
        }
    }
}
