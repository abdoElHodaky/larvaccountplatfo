<?php

namespace App\Features\Accounting\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\Accounting\Services\AccountingService;

class AccountingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(AccountingService::class, function ($app) {
            return new AccountingService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/accounting.php');
        
        // Load migrations if needed
        // $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        
        // Load views if needed
        // $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'accounting');
        
        // Publish config if needed
        // $this->publishes([
        //     __DIR__ . '/../Config/accounting.php' => config_path('accounting.php'),
        // ], 'accounting-config');
    }
}
