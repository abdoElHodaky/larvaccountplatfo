<?php

namespace App\Providers;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Features\Organization\Services\OrganizationService;
use App\Services\AuthService;
use App\Services\TenantProvisioningService;
use App\Services\TenantResolver;
use App\Shared\Services\InterModuleBus;
use App\Shared\Services\ModuleDiscoveryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * (Only use this for container bindings. NO facades allowed here.)
     */
    public function register(): void
    {
        // Register core tenant services
        $this->app->singleton(TenantResolver::class, fn () => new TenantResolver);

        $this->app->singleton(TenantProvisioningService::class, function ($app) {
            return new TenantProvisioningService(
                $app->make(TenantResolver::class)
            );
        });

        // Register authentication container bindings
        $this->app->singleton(TenantAwareAuthManager::class, function ($app) {
            return new TenantAwareAuthManager($app);
        });

        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService(
                $app->make(TenantAwareAuthManager::class),
                $app->make(TenantResolver::class)
            );
        });

        // Register module services
        $this->app->singleton(ModuleDiscoveryService::class, fn () => new ModuleDiscoveryService);
        $this->app->singleton(InterModuleBus::class, fn () => new InterModuleBus);

        // Register organization services
        $this->app->singleton(OrganizationService::class, fn () => new OrganizationService);
    }

    /**
     * Bootstrap any application services.
     * (Safe to use facades and extend core managers here.)
     */
    public function boot(): void
    {
        // 1. Register custom authentication guards and providers using the Auth facade safely
        Auth::extend('global_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createGlobalUserDriver($config);
        });

        Auth::extend('tenant_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createTenantUserDriver($config);
        });

        Auth::provider('hybrid', function ($app, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createHybridProvider($config);
        });

        // 2. Boot authentication manager
        $this->bootAuthenticationManager();

        // 3. Boot module discovery
        $this->bootModuleDiscovery();

        // 4. Boot inter-module communication bus
        $this->bootInterModuleBus();
    }

    /**
     * Boot the authentication manager.
     */
    protected function bootAuthenticationManager(): void
    {
        $this->app->singleton('auth', function ($app) {
            return $app->make(TenantAwareAuthManager::class);
        });

        $this->app->resolving('auth', function ($auth, $app) {
            $auth->userResolver(function ($guard = null) use ($app) {
                return call_user_func($app['auth']->userResolver(), $guard);
            });
        });
    }

    /**
     * Boot module discovery.
     */
    protected function bootModuleDiscovery(): void
   {
    // Prevent modules from loading during early artisan discovery/cache commands
    if ($this->app->runningInConsole() && request()->server('argv')) {
        $command = $_SERVER['argv'][1] ?? null;
        if (in_array($command, ['package:discover', 'discover', 'config:clear', 'cache:clear', 'optimize:clear'])) {
            return;
        }
    }

    if (config('modules.discovery.enabled', true)) {
        $discoveryService = $this->app->make(ModuleDiscoveryService::class);
        $modules = $discoveryService->loadModules();

        foreach ($modules as $module) {
            if ($module['enabled'] ?? true) {
                $this->registerDiscoveredModule($module);
            }
        }
    }
   }

    /**
     * Boot inter-module communication bus.
     */
    protected function bootInterModuleBus(): void
    {
        if (config('modules.communication.bus_enabled', true)) {
            $bus = $this->app->make(InterModuleBus::class);

            $bus->registerService('Shared', 'ModuleDiscovery', $this->app->make(ModuleDiscoveryService::class));
            $bus->registerService('Shared', 'TenantResolver', $this->app->make(TenantResolver::class));
            $bus->registerService('Shared', 'AuthService', $this->app->make(AuthService::class));
            $bus->renderService('Organization', 'OrganizationService', $this->app->make(OrganizationService::class));
        }
    }

    /**
     * Register a discovered module.
     */
    protected function registerDiscoveredModule(array $module): void
    {
        $providerClass = $module['provider'];

        if (class_exists($providerClass)) {
            $this->app->register($providerClass);
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            TenantResolver::class,
            TenantProvisioningService::class,
            TenantAwareAuthManager::class,
            AuthService::class,
            ModuleDiscoveryService::class,
            InterModuleBus::class,
            OrganizationService::class,
        ];
    }
}
