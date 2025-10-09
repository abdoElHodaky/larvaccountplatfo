<?php

namespace App\Features\Organization\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\Organization\Services\OrganizationService;

class OrganizationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(OrganizationService::class, function ($app) {
            return new OrganizationService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes if they exist
        $routePath = __DIR__ . '/../Routes/organization.php';
        if (file_exists($routePath)) {
            $this->loadRoutesFrom($routePath);
        }
        
        // Load migrations if needed
        // $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        
        // Load views if needed
        // $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'organization');
        
        // Publish config if needed
        // $this->publishes([
        //     __DIR__ . '/../Config/organization.php' => config_path('organization.php'),
        // ], 'organization-config');
    }
}
