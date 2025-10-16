<?php

namespace App\Features\TenantManagement\Providers;

use App\Features\TenantManagement\Services\TenantService;
use Illuminate\Support\ServiceProvider;

class TenantManagementServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantService::class, function ($app) {
            return new TenantService;
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
