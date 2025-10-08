<?php

namespace App\Features\Authentication\Auth;

use App\Auth\Guards\GlobalUserGuard;
use App\Auth\Guards\TenantUserGuard;
use App\Auth\Providers\HybridUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Contracts\Foundation\Application;

class TenantAwareAuthManager extends AuthManager
{
    public function __construct(Application $app)
    {
        parent::__construct($app);
    }

    /**
     * Create the global user guard for landlord authentication
     */
    protected function createGlobalUserDriver(array $config)
    {
        $provider = $this->createUserProvider($config['provider'] ?? null);

        $guard = new GlobalUserGuard(
            $provider,
            $this->app['session.store'],
            $this->app['request']
        );

        // Configure guard settings
        if (method_exists($guard, 'setCookieJar')) {
            $guard->setCookieJar($this->app['cookie']);
        }

        if (method_exists($guard, 'setDispatcher')) {
            $guard->setDispatcher($this->app['events']);
        }

        if (method_exists($guard, 'setRequest')) {
            $guard->setRequest($this->app->refresh('request', $guard, 'setRequest'));
        }

        return $guard;
    }

    /**
     * Create the tenant user guard for tenant-specific authentication
     */
    protected function createTenantUserDriver(array $config)
    {
        $provider = $this->createUserProvider($config['provider'] ?? null);

        $guard = new TenantUserGuard(
            $provider,
            $this->app['session.store'],
            $this->app['request']
        );

        // Configure guard settings
        if (method_exists($guard, 'setCookieJar')) {
            $guard->setCookieJar($this->app['cookie']);
        }

        if (method_exists($guard, 'setDispatcher')) {
            $guard->setDispatcher($this->app['events']);
        }

        if (method_exists($guard, 'setRequest')) {
            $guard->setRequest($this->app->refresh('request', $guard, 'setRequest'));
        }

        return $guard;
    }

    /**
     * Create the hybrid user provider
     */
    protected function createHybridProvider(array $config)
    {
        return new HybridUserProvider(
            $this->app['hash'],
            $config['model'] ?? null,
            $config['global_model'] ?? null
        );
    }

    /**
     * Get the default authentication driver name
     * Dynamically determines based on tenant context
     */
    public function getDefaultDriver()
    {
        // Check if we're in a tenant context
        $tenant = app('tenant', null);
        
        if (!$tenant) {
            // No tenant context, use global user authentication
            return 'global_user';
        }

        // We have a tenant, use tenant-specific authentication
        return 'tenant_user';
    }

    /**
     * Dynamically resolve the appropriate guard based on context
     */
    public function resolveGuard(?string $name = null)
    {
        $name = $name ?: $this->getDefaultDriver();
        
        // Ensure the guard configuration exists
        $this->ensureGuardConfiguration($name);
        
        return $this->guard($name);
    }

    /**
     * Ensure guard configuration exists for the requested guard
     */
    protected function ensureGuardConfiguration(string $guardName): void
    {
        $config = $this->app['config']['auth.guards'];
        
        if (!isset($config[$guardName])) {
            // Dynamically create configuration based on tenant context
            $this->createDynamicGuardConfiguration($guardName);
        }
    }

    /**
     * Create dynamic guard configuration based on tenant context
     */
    protected function createDynamicGuardConfiguration(string $guardName): void
    {
        $tenant = app('tenant', null);
        $config = $this->app['config'];
        
        switch ($guardName) {
            case 'global_user':
                $config->set('auth.guards.global_user', [
                    'driver' => 'global_user',
                    'provider' => 'global_users',
                ]);
                
                $config->set('auth.providers.global_users', [
                    'driver' => 'hybrid',
                    'model' => \App\Models\GlobalUser::class,
                    'global_model' => \App\Models\GlobalUser::class,
                ]);
                break;
                
            case 'tenant_user':
                $config->set('auth.guards.tenant_user', [
                    'driver' => 'tenant_user',
                    'provider' => 'tenant_users',
                ]);
                
                $config->set('auth.providers.tenant_users', [
                    'driver' => 'hybrid',
                    'model' => \Modules\Shared\Models\User::class,
                    'global_model' => \App\Models\GlobalUser::class,
                ]);
                break;
        }
    }

    /**
     * Switch authentication context to global user
     */
    public function switchToGlobalContext(): void
    {
        $this->app->instance('auth.default_guard', 'global_user');
        $this->forgetGuards();
    }

    /**
     * Switch authentication context to tenant user
     */
    public function switchToTenantContext(): void
    {
        $this->app->instance('auth.default_guard', 'tenant_user');
        $this->forgetGuards();
    }

    /**
     * Forget all resolved guards to force re-resolution
     */
    protected function forgetGuards(): void
    {
        $this->guards = [];
    }

    /**
     * Check if current context is global (landlord)
     */
    public function isGlobalContext(): bool
    {
        return !app()->bound('tenant') || app('tenant') === null;
    }

    /**
     * Check if current context is tenant-specific
     */
    public function isTenantContext(): bool
    {
        return app()->bound('tenant') && app('tenant') !== null;
    }

    /**
     * Get the current tenant if in tenant context
     */
    public function getCurrentTenant()
    {
        return app('tenant', null);
    }

    /**
     * Attempt to authenticate user in the appropriate context
     */
    public function attemptContextualLogin(array $credentials, bool $remember = false): bool
    {
        $guard = $this->resolveGuard();
        
        return $guard->attempt($credentials, $remember);
    }

    /**
     * Get the authenticated user from the appropriate context
     */
    public function getContextualUser()
    {
        $guard = $this->resolveGuard();
        
        return $guard->user();
    }

    /**
     * Log out the user from the appropriate context
     */
    public function contextualLogout(): void
    {
        $guard = $this->resolveGuard();
        
        $guard->logout();
    }
}

