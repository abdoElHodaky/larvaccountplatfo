<?php

namespace App\Shared\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\App;
use App\Shared\Contracts\ServiceInterface;
use App\Shared\Services\ServiceRegistry;
use App\Shared\Services\ServiceManager;

/**
 * Service provider for the service layer architecture
 */
class ServiceLayerProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register service registry as singleton
        $this->app->singleton(ServiceRegistry::class, function ($app) {
            return new ServiceRegistry();
        });

        // Register service manager as singleton
        $this->app->singleton(ServiceManager::class, function ($app) {
            return new ServiceManager($app->make(ServiceRegistry::class));
        });

        // Register service discovery
        $this->registerServiceDiscovery();

        // Register repository bindings
        $this->registerRepositories();

        // Register service bindings
        $this->registerServices();
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        // Initialize service manager
        $serviceManager = $this->app->make(ServiceManager::class);
        $serviceManager->initialize();

        // Register service health checks
        $this->registerHealthChecks();

        // Register service metrics
        $this->registerMetrics();
    }

    /**
     * Register service discovery
     */
    protected function registerServiceDiscovery(): void
    {
        $this->app->singleton('service.discovery', function ($app) {
            return new \App\Shared\Services\ServiceDiscovery($app);
        });
    }

    /**
     * Register repository bindings
     */
    protected function registerRepositories(): void
    {
        // Accounting repositories
        $this->app->bind(
            \App\Features\Accounting\Contracts\AccountRepositoryInterface::class,
            \App\Features\Accounting\Repositories\AccountRepository::class
        );

        $this->app->bind(
            \App\Features\Accounting\Contracts\TransactionRepositoryInterface::class,
            \App\Features\Accounting\Repositories\TransactionRepository::class
        );

        $this->app->bind(
            \App\Features\Accounting\Contracts\JournalEntryRepositoryInterface::class,
            \App\Features\Accounting\Repositories\JournalEntryRepository::class
        );

        // Budget repositories
        $this->app->bind(
            \App\Features\Accounting\Contracts\BudgetRepositoryInterface::class,
            \App\Features\Accounting\Repositories\BudgetRepository::class
        );

        // Inventory repositories
        $this->app->bind(
            \App\Features\Inventory\Contracts\ProductRepositoryInterface::class,
            \App\Features\Inventory\Repositories\ProductRepository::class
        );

        $this->app->bind(
            \App\Features\Inventory\Contracts\InventoryRepositoryInterface::class,
            \App\Features\Inventory\Repositories\InventoryRepository::class
        );

        // Dashboard repositories
        $this->app->bind(
            \App\Features\Dashboard\Contracts\DashboardWidgetRepositoryInterface::class,
            \App\Features\Dashboard\Repositories\DashboardWidgetRepository::class
        );
    }

    /**
     * Register service bindings
     */
    protected function registerServices(): void
    {
        // Accounting services
        $this->app->bind(
            \App\Features\Accounting\Contracts\AccountingServiceInterface::class,
            \App\Features\Accounting\Services\AccountingService::class
        );

        $this->app->bind(
            \App\Features\Accounting\Contracts\BudgetServiceInterface::class,
            \App\Features\Accounting\Services\BudgetService::class
        );

        $this->app->bind(
            \App\Features\Accounting\Contracts\TaxServiceInterface::class,
            \App\Features\Accounting\Services\TaxService::class
        );

        $this->app->bind(
            \App\Features\Accounting\Contracts\ForecastingServiceInterface::class,
            \App\Features\Accounting\Services\ForecastingService::class
        );

        // Inventory services
        $this->app->bind(
            \App\Features\Inventory\Contracts\InventoryServiceInterface::class,
            \App\Features\Inventory\Services\InventoryService::class
        );

        $this->app->bind(
            \App\Features\Inventory\Contracts\ProductServiceInterface::class,
            \App\Features\Inventory\Services\ProductService::class
        );

        // Dashboard services
        $this->app->bind(
            \App\Features\Dashboard\Contracts\DashboardServiceInterface::class,
            \App\Features\Dashboard\Services\AdvancedDashboardService::class
        );

        $this->app->bind(
            \App\Features\Dashboard\Contracts\WidgetServiceInterface::class,
            \App\Features\Dashboard\Services\WidgetService::class
        );
    }

    /**
     * Register health checks
     */
    protected function registerHealthChecks(): void
    {
        $this->app->singleton('service.health', function ($app) {
            return new \App\Shared\Services\ServiceHealthChecker($app);
        });
    }

    /**
     * Register metrics
     */
    protected function registerMetrics(): void
    {
        $this->app->singleton('service.metrics', function ($app) {
            return new \App\Shared\Services\ServiceMetricsCollector($app);
        });
    }

    /**
     * Get the services provided by the provider
     */
    public function provides(): array
    {
        return [
            ServiceRegistry::class,
            ServiceManager::class,
            'service.discovery',
            'service.health',
            'service.metrics',
        ];
    }
}
