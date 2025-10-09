<?php

namespace App\Features\Sales\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\Sales\Services\SalesService;

class SalesServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(SalesService::class, function ($app) {
            return new SalesService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/sales.php');
        
        // Load migrations if needed
        // $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        
        // Load views if needed
        // $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'sales');
        
        // Publish config if needed
        // $this->publishes([
        //     __DIR__ . '/../Config/sales.php' => config_path('sales.php'),
        // ], 'sales-config');
    }
}
