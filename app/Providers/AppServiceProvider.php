<?php

namespace App\Providers;

use App\Auth\TenantAwareAuthManager;
use App\Services\AuthService;
use App\Services\TenantResolver;
use App\Services\TenantProvisioningService;
use App\Services\DatabaseInitializationService;
use Modules\Shared\Services\ModuleDiscoveryService;
use Modules\Shared\Services\InterModuleBus;
use Modules\Organization\Services\OrganizationService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register core tenant services
        $this->registerTenantServices();
        
        // Register authentication services
        $this->registerAuthenticationServices();
        
        // Register module services
        $this->registerModuleServices();
        
        // Register organization services
        $this->registerOrganizationServices();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Boot authentication manager
        $this->bootAuthenticationManager();
        
        // Boot module discovery
        $this->bootModuleDiscovery();
        
        // Boot inter-module communication
        $this->bootInterModuleBus();
    }

    /**
     * Register tenant-related services.
     */
    protected function registerTenantServices(): void
    {
        // Tenant Resolver Service
        $this->app->singleton(TenantResolver::class, function ($app) {
            return new TenantResolver();
        });

        // Database Initialization Service
        $this->app->singleton(DatabaseInitializationService::class, function ($app) {
            return new DatabaseInitializationService();
        });

        // Tenant Provisioning Service
        $this->app->singleton(TenantProvisioningService::class, function ($app) {
            return new TenantProvisioningService(
                $app->make(TenantResolver::class),
                $app->make(DatabaseInitializationService::class)
            );
        });
    }

    /**
     * Register authentication services.
     */
    protected function registerAuthenticationServices(): void
    {
        // Tenant-Aware Authentication Manager
        $this->app->singleton(TenantAwareAuthManager::class, function ($app) {
            return new TenantAwareAuthManager($app);
        });

        // Authentication Service
        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService(
                $app->make(TenantAwareAuthManager::class),
                $app->make(TenantResolver::class)
            );
        });

        // Register custom authentication guards
        Auth::extend('global_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createGlobalUserDriver($config);
        });

        Auth::extend('tenant_user', function ($app, $name, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createTenantUserDriver($config);
        });

        // Register custom user provider
        Auth::provider('hybrid', function ($app, array $config) {
            return $app->make(TenantAwareAuthManager::class)->createHybridProvider($config);
        });
    }

    /**
     * Register module services.
     */
    protected function registerModuleServices(): void
    {
        // Module Discovery Service
        $this->app->singleton(ModuleDiscoveryService::class, function ($app) {
            return new ModuleDiscoveryService();
        });

        // Inter-Module Communication Bus
        $this->app->singleton(InterModuleBus::class, function ($app) {
            return new InterModuleBus();
        });
    }

    /**
     * Register organization services.
     */
    protected function registerOrganizationServices(): void
    {
        // Organization Service
        $this->app->singleton(OrganizationService::class, function ($app) {
            return new OrganizationService();
        });
    }

    /**
     * Boot the authentication manager.
     */
    protected function bootAuthenticationManager(): void
    {
        // Replace the default auth manager with our tenant-aware version
        $this->app->singleton('auth', function ($app) {
            return $app->make(TenantAwareAuthManager::class);
        });

        // Ensure the auth manager is properly configured
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
        if (config('modules.discovery.enabled', true)) {
            $discoveryService = $this->app->make(ModuleDiscoveryService::class);
            
            // Load modules from cache or discover them
            $modules = $discoveryService->loadModules();
            
            // Register discovered modules
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
            
            // Register core services with the bus
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
            TenantResolver::class,
            DatabaseInitializationService::class,
            TenantProvisioningService::class,
            TenantAwareAuthManager::class,
            AuthService::class,
            ModuleDiscoveryService::class,
            InterModuleBus::class,
            OrganizationService::class,
        ];
    }
}

