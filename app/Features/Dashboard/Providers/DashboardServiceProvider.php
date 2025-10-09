<?php

namespace App\Features\Dashboard\Providers;

use Illuminate\Support\ServiceProvider;
use App\Features\Dashboard\Services\DashboardService;

class DashboardServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(DashboardService::class, function ($app) {
            return new DashboardService(
                $app->make(\Modules\Accounting\Services\AccountingService::class)
            );
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
