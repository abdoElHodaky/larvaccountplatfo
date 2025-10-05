<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Tenant-specific rate limiting
        RateLimiter::for('tenant-api', function (Request $request) {
            $tenant = app('tenant');
            $key = $tenant ? "tenant:{$tenant->id}:{$request->ip()}" : $request->ip();
            
            return Limit::perMinute(100)->by($key);
        });

        // Module-specific rate limiting
        RateLimiter::for('module-api', function (Request $request) {
            $tenant = app('tenant');
            $module = $request->route('module');
            $key = $tenant && $module 
                ? "tenant:{$tenant->id}:module:{$module}:{$request->ip()}" 
                : $request->ip();
            
            return Limit::perMinute(200)->by($key);
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            Route::middleware('web')
                ->group(base_path('routes/auth.php'));

            Route::middleware(['web', 'auth'])
                ->prefix('channels')
                ->group(base_path('routes/channels.php'));

            // Load module routes dynamically
            $this->loadModuleRoutes();
        });
    }

    /**
     * Load routes for enabled modules
     */
    protected function loadModuleRoutes(): void
    {
        $enabledModules = config('modules.enabled', []);
        
        foreach ($enabledModules as $module) {
            $moduleRoutePath = base_path("Modules/{$module}/routes");
            
            // Load web routes
            if (file_exists("{$moduleRoutePath}/web.php")) {
                Route::middleware(['web', 'tenant'])
                    ->prefix(strtolower($module))
                    ->name("{$module}.")
                    ->group("{$moduleRoutePath}/web.php");
            }
            
            // Load API routes
            if (file_exists("{$moduleRoutePath}/api.php")) {
                Route::middleware(['api', 'tenant'])
                    ->prefix("api/" . strtolower($module))
                    ->name("api.{$module}.")
                    ->group("{$moduleRoutePath}/api.php");
            }
        }
    }
}
