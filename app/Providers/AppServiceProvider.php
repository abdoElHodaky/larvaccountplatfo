<?php

namespace App\Providers;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Features\Organization\Services\OrganizationService;
use App\Services\AuthService;
use App\Services\TenantProvisioningService;
use App\Services\TenantResolver;
use App\Shared\Services\InterModuleBus;
use App\Shared\Services\ModuleDiscoveryService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Auth;
use Laravel\Octane\Events\RequestReceived;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // 1. Rebind 'auth' singleton to TenantAwareAuthManager before Laravel resolves default auth
        $this->app->singleton('auth', function ($app) {
            return new TenantAwareAuthManager($app);
        });

        $this->app->alias('auth', TenantAwareAuthManager::class);

        // 2. Register core tenant services
        $this->app->singleton(TenantResolver::class, fn () => new TenantResolver);

        $this->app->singleton(TenantProvisioningService::class, function ($app) {
            return new TenantProvisioningService(
                $app->make(TenantResolver::class)
            );
        });

        // 3. Register authentication service
        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService(
                $app->make('auth'),
                $app->make(TenantResolver::class)
            );
        });

        // 4. Register module and organizational services
        $this->app->singleton(ModuleDiscoveryService::class, fn () => new ModuleDiscoveryService);
        $this->app->singleton(InterModuleBus::class, fn () => new InterModuleBus);
        $this->app->singleton(OrganizationService::class, fn () => new OrganizationService);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->bootModuleDiscovery();
        $this->bootInterModuleBus();
        // 1. Extend Auth to define the 'global_user' guard driver
        Auth::extend('global_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createGlobalUserDriver($name, $config);
        });

        // 2. Extend Auth to define the 'tenant_user' guard driver
        Auth::extend('tenant_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createTenantUserDriver($name, $config);
        });

        // 3. Extend Auth to define the 'hybrid' user provider if needed
        Auth::provider('hybrid', function ($app, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createHybridProvider($config);
        });
        Event::listen(RequestReceived::class, function () {
        // Forget user resolution state on the Auth facade between requests
         Auth::forgetGuards();
        // Forget bound tenant context in container
         app()->forgetInstance('tenant');
        });
    }

    /**
     * Boot module discovery.
     */
    protected function bootModuleDiscovery(): void
    {
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
            $bus->registerService('Organization', 'OrganizationService', $this->app->make(OrganizationService::class));
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
            'auth',
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
