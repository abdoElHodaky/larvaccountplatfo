<?php

namespace App\Features\Inventory\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\Inventory\Services\InventoryService;

class InventoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(InventoryService::class, function ($app) {
            return new InventoryService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/inventory.php');
        
        // Load migrations if needed
        // $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        
        // Load views if needed
        // $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'inventory');
        
        // Publish config if needed
        // $this->publishes([
        //     __DIR__ . '/../Config/inventory.php' => config_path('inventory.php'),
        // ], 'inventory-config');
    }
}
