<?php

namespace App\Shared\Services;

use App\Shared\Contracts\that;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Service manager for coordinating service lifecycle and operations
 */
class ServiceManager
{
    protected ServiceRegistry $registry;

    protected bool $initialized = false;

    protected array $config = [];

    public function __construct(ServiceRegistry $registry)
    {
        $this->registry = $registry;
        $this->loadConfiguration();
    }

    /**
     * Load service manager configuration
     */
    protected function loadConfiguration(): void
    {
        $this->config = [
            'auto_initialize' => config('services.auto_initialize', true),
            'health_check_interval' => config('services.health_check_interval', 300), // 5 minutes
            'metrics_collection_interval' => config('services.metrics_collection_interval', 60), // 1 minute
            'max_initialization_retries' => config('services.max_initialization_retries', 3),
            'initialization_timeout' => config('services.initialization_timeout', 30), // 30 seconds
        ];
    }

    /**
     * Initialize the service manager
     */
    public function initialize(): void
    {
        if ($this->initialized) {
            return;
        }

        try {
            Log::info('Initializing Service Manager');

            // Discover and register services
            $this->discoverServices();

            // Initialize services if auto-initialization is enabled
            if ($this->config['auto_initialize']) {
                $this->initializeAllServices();
            }

            $this->initialized = true;
            Log::info('Service Manager initialized successfully');
        } catch (Exception $e) {
            Log::error('Failed to initialize Service Manager: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Discover and register services
     */
    protected function discoverServices(): void
    {
        // Register core services
        $this->registerCoreServices();

        // Register feature services
        $this->registerFeatureServices();

        Log::info('Service discovery completed', [
            'total_services' => $this->registry->all()->count(),
            'services' => $this->registry->getServiceNames(),
        ]);
    }

    /**
     * Register core services
     */
    protected function registerCoreServices(): void
    {
        // These would be registered by the ServiceLayerProvider
        // This method can be used for additional core service registration
    }

    /**
     * Register feature services
     */
    protected function registerFeatureServices(): void
    {
        // Register services from different feature modules
        $this->registerAccountingServices();
        $this->registerInventoryServices();
        $this->registerDashboardServices();
    }

    /**
     * Register accounting services
     */
    protected function registerAccountingServices(): void
    {
        try {
            if (class_exists(\App\Features\Accounting\Services\AccountingService::class)) {
                $service = app(\App\Features\Accounting\Services\AccountingService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('accounting', $service);
                }
            }

            if (class_exists(\App\Features\Accounting\Services\BudgetService::class)) {
                $service = app(\App\Features\Accounting\Services\BudgetService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('budget', $service);
                }
            }

            if (class_exists(\App\Features\Accounting\Services\TaxService::class)) {
                $service = app(\App\Features\Accounting\Services\TaxService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('tax', $service);
                }
            }

            if (class_exists(\App\Features\Accounting\Services\ForecastingService::class)) {
                $service = app(\App\Features\Accounting\Services\ForecastingService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('forecasting', $service);
                }
            }
        } catch (Exception $e) {
            Log::warning('Failed to register some accounting services: '.$e->getMessage());
        }
    }

    /**
     * Register inventory services
     */
    protected function registerInventoryServices(): void
    {
        try {
            if (class_exists(\App\Features\Inventory\Services\InventoryService::class)) {
                $service = app(\App\Features\Inventory\Services\InventoryService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('inventory', $service);
                }
            }

            if (class_exists(\App\Features\Inventory\Services\ProductService::class)) {
                $service = app(\App\Features\Inventory\Services\ProductService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('product', $service);
                }
            }
        } catch (Exception $e) {
            Log::warning('Failed to register some inventory services: '.$e->getMessage());
        }
    }

    /**
     * Register dashboard services
     */
    protected function registerDashboardServices(): void
    {
        try {
            if (class_exists(\App\Features\Dashboard\Services\AdvancedDashboardService::class)) {
                $service = app(\App\Features\Dashboard\Services\AdvancedDashboardService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('dashboard', $service);
                }
            }

            if (class_exists(\App\Features\Dashboard\Services\WidgetService::class)) {
                $service = app(\App\Features\Dashboard\Services\WidgetService::class);
                if ($service instanceof ServiceInterface) {
                    $this->registry->register('widget', $service);
                }
            }
        } catch (Exception $e) {
            Log::warning('Failed to register some dashboard services: '.$e->getMessage());
        }
    }

    /**
     * Initialize all services
     */
    public function initializeAllServices(): void
    {
        try {
            $this->registry->initializeAll();
            Log::info('All services initialized successfully');
        } catch (Exception $e) {
            Log::error('Failed to initialize all services: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Initialize a specific service
     */
    public function initializeService(string $name): void
    {
        $retries = 0;
        $maxRetries = $this->config['max_initialization_retries'];

        while ($retries < $maxRetries) {
            try {
                $this->registry->initializeService($name);
                Log::info("Service '{$name}' initialized successfully");

                return;
            } catch (Exception $e) {
                $retries++;
                Log::warning("Failed to initialize service '{$name}' (attempt {$retries}/{$maxRetries}): ".$e->getMessage());

                if ($retries >= $maxRetries) {
                    Log::error("Failed to initialize service '{$name}' after {$maxRetries} attempts");
                    throw $e;
                }

                // Wait before retrying
                sleep(1);
            }
        }
    }

    /**
     * Shutdown all services
     */
    public function shutdown(): void
    {
        try {
            Log::info('Shutting down Service Manager');
            $this->registry->cleanupAll();
            $this->initialized = false;
            Log::info('Service Manager shutdown completed');
        } catch (Exception $e) {
            Log::error('Error during Service Manager shutdown: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Get service registry
     */
    public function getRegistry(): ServiceRegistry
    {
        return $this->registry;
    }

    /**
     * Get a service by name
     */
    public function getService(string $name): ?ServiceInterface
    {
        return $this->registry->get($name);
    }

    /**
     * Check if service manager is initialized
     */
    public function isInitialized(): bool
    {
        return $this->initialized;
    }

    /**
     * Get health status of all services
     */
    public function getHealthStatus(): array
    {
        $status = $this->registry->getHealthStatus();

        return [
            'service_manager' => [
                'initialized' => $this->initialized,
                'total_services' => count($status),
                'healthy_services' => count(array_filter($status, fn ($s) => $s['healthy'])),
                'unhealthy_services' => count(array_filter($status, fn ($s) => ! $s['healthy'])),
            ],
            'services' => $status,
        ];
    }

    /**
     * Get service metrics
     */
    public function getMetrics(): array
    {
        $registryMetrics = $this->registry->getMetrics();

        return [
            'service_manager' => [
                'initialized' => $this->initialized,
                'config' => $this->config,
                'uptime' => $this->getUptime(),
            ],
            'registry' => $registryMetrics,
        ];
    }

    /**
     * Get service manager uptime (placeholder)
     */
    protected function getUptime(): int
    {
        // This would typically track actual uptime
        // For now, return 0 as placeholder
        return 0;
    }

    /**
     * Restart a service
     */
    public function restartService(string $name): void
    {
        try {
            Log::info("Restarting service: {$name}");

            // Cleanup the service
            $this->registry->cleanupService($name);

            // Wait a moment
            usleep(100000); // 100ms

            // Initialize the service again
            $this->registry->initializeService($name);

            Log::info("Service '{$name}' restarted successfully");
        } catch (Exception $e) {
            Log::error("Failed to restart service '{$name}': ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Restart all services
     */
    public function restartAllServices(): void
    {
        try {
            Log::info('Restarting all services');

            $serviceNames = $this->registry->getServiceNames();

            // Cleanup all services
            $this->registry->cleanupAll();

            // Wait a moment
            sleep(1);

            // Initialize all services
            $this->registry->initializeAll();

            Log::info('All services restarted successfully');
        } catch (Exception $e) {
            Log::error('Failed to restart all services: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Check for circular dependencies
     */
    public function checkCircularDependencies(): bool
    {
        return $this->registry->hasCircularDependencies();
    }

    /**
     * Get dependency tree for a service
     */
    public function getDependencyTree(string $serviceName): array
    {
        return $this->registry->getDependencyTree($serviceName);
    }

    /**
     * Validate service configuration
     */
    public function validateConfiguration(): array
    {
        $issues = [];

        // Check for circular dependencies
        if ($this->checkCircularDependencies()) {
            $issues[] = 'Circular dependencies detected in service configuration';
        }

        // Check service health
        $healthStatus = $this->getHealthStatus();
        if ($healthStatus['service_manager']['unhealthy_services'] > 0) {
            $issues[] = "Found {$healthStatus['service_manager']['unhealthy_services']} unhealthy services";
        }

        return $issues;
    }
}
