<?php

namespace App\Features\TenantManagement\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\TenantManagement\Services\TenantService;

class TenantManagementServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantService::class, function ($app) {
            return new TenantService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
