<?php

namespace App\Features\Dashboard\Providers;

use App\Features\Dashboard\Contracts\DashboardAnalyticsServiceInterface;
use App\Features\Dashboard\Contracts\DashboardCustomizationServiceInterface;
use App\Features\Dashboard\Contracts\DashboardExportServiceInterface;
use App\Features\Dashboard\Contracts\WidgetConfigurationServiceInterface;
use App\Features\Dashboard\Contracts\WidgetManagementServiceInterface;
use App\Features\Dashboard\Contracts\WidgetRenderingServiceInterface;
use App\Features\Dashboard\Services\Application\DashboardAnalyticsService;
use App\Features\Dashboard\Services\Application\DashboardCustomizationService;
use App\Features\Dashboard\Services\Application\DashboardExportService;
use App\Features\Dashboard\Services\Application\WidgetConfigurationService;
use App\Features\Dashboard\Services\Application\WidgetManagementService;
use App\Features\Dashboard\Services\Application\WidgetRenderingService;
use App\Features\Dashboard\Services\Domain\DashboardOrchestrationService;
use Illuminate\Support\ServiceProvider;

class DashboardServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Bind service contracts to implementations
        $this->app->bind(WidgetManagementServiceInterface::class, WidgetManagementService::class);
        $this->app->bind(WidgetRenderingServiceInterface::class, WidgetRenderingService::class);
        $this->app->bind(WidgetConfigurationServiceInterface::class, WidgetConfigurationService::class);
        $this->app->bind(DashboardAnalyticsServiceInterface::class, DashboardAnalyticsService::class);
        $this->app->bind(DashboardCustomizationServiceInterface::class, DashboardCustomizationService::class);
        $this->app->bind(DashboardExportServiceInterface::class, DashboardExportService::class);

        // Register domain service as singleton
        $this->app->singleton(DashboardOrchestrationService::class);
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');

        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/dashboard.php');

        // Load views
        $this->loadViewsFrom(__DIR__ . '/../Resources/Views', 'dashboard');

        // Publish configuration
        $this->publishes([
            __DIR__ . '/../Config/dashboard.php' => config_path('dashboard.php'),
        ], 'dashboard-config');

        // Publish assets
        $this->publishes([
            __DIR__ . '/../Resources/Assets' => public_path('vendor/dashboard'),
        ], 'dashboard-assets');
    }
}

