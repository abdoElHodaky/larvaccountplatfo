<?php

namespace App\Features\Authentication\Auth;

use App\Features\Authentication\Auth\Guards\GlobalUserGuard;
use App\Features\Authentication\Auth\Guards\TenantUserGuard;
use App\Features\Authentication\Auth\Providers\HybridUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Contracts\Foundation\Application;

class TenantAwareAuthManager extends AuthManager
{
    public function __construct(Application $app)
    {
        parent::__construct($app);

        // Register custom hybrid user provider driver automatically
        $this->provider('hybrid', function ($app, array $config) {
            return $this->createHybridProvider($config);
        });
    }

    /**
     * Create the global user guard for landlord authentication
     */
    public function createGlobalUserDriver(array $config): Guard
    {
        $provider = $this->createUserProvider($config['provider'] ?? null);

        $guard = new GlobalUserGuard(
            $provider,
            $this->app['session.store'],
            $this->app['request']
        );

        return $this->configureGuard($guard);
    }

    /**
     * Create the tenant user guard for tenant-specific authentication
     */
    public function createTenantUserDriver(array $config): Guard
    {
        $provider = $this->createUserProvider($config['provider'] ?? null);

        $guard = new TenantUserGuard(
            $provider,
            $this->app['session.store'],
            $this->app['request']
        );

        return $this->configureGuard($guard);
    }

    /**
     * Configure guard settings safely
     */
    protected function configureGuard(Guard $guard): Guard
    {
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
    public function createHybridProvider(array $config): UserProvider
    {
        return new HybridUserProvider(
            $this->app['hash'],
            $config['model'] ?? null,
            $config['global_model'] ?? null
        );
    }

    /**
     * Get the default authentication driver name
     */
    public function getDefaultDriver(): string
    {
        return $this->isTenantContext() ? 'tenant_user' : 'global_user';
    }

    /**
     * Dynamically resolve the appropriate guard based on context
     */
    public function resolveGuard(?string $name = null): Guard
    {
        $name = $name ?: $this->getDefaultDriver();

        $this->ensureGuardConfiguration($name);

        return $this->guard($name);
    }

    /**
     * Ensure guard configuration exists for the requested guard
     */
    protected function ensureGuardConfiguration(string $guardName): void
    {
        $config = $this->app['config']['auth.guards'];

        if (! isset($config[$guardName])) {
            $this->createDynamicGuardConfiguration($guardName);
        }
    }

    /**
     * Create dynamic guard configuration based on tenant context
     */
    protected function createDynamicGuardConfiguration(string $guardName): void
    {
        $config = $this->app['config'];

        if ($guardName === 'global_user') {
            $config->set('auth.guards.global_user', [
                'driver' => 'global_user',
                'provider' => 'global_users',
            ]);

            $config->set('auth.providers.global_users', [
                'driver' => 'hybrid',
                'model' => \App\Models\GlobalUser::class,
                'global_model' => \App\Models\GlobalUser::class,
            ]);
        } elseif ($guardName === 'tenant_user') {
            $config->set('auth.guards.tenant_user', [
                'driver' => 'tenant_user',
                'provider' => 'tenant_users',
            ]);

            $config->set('auth.providers.tenant_users', [
                'driver' => 'hybrid',
                'model' => \Modules\Shared\Models\User::class,
                'global_model' => \App\Models\GlobalUser::class,
            ]);
        }
    }

    /**
     * Switch authentication context to global user
     */
    public function switchToGlobalContext(): void
    {
        $this->shouldUse('global_user');
    }

    /**
     * Switch authentication context to tenant user
     */
    public function switchToTenantContext(): void
    {
        $this->shouldUse('tenant_user');
    }

    /**
     * Get the current tenant if in tenant context
     */
    public function getCurrentTenant(): mixed
    {
        return $this->app->bound('tenant') ? $this->app->make('tenant') : null;
    }

    /**
     * Check if current context is tenant-specific
     */
    public function isTenantContext(): bool
    {
        return $this->getCurrentTenant() !== null;
    }

    /**
     * Check if current context is global (landlord)
     */
    public function isGlobalContext(): bool
    {
        return $this->getCurrentTenant() === null;
    }

    /**
     * Attempt to authenticate user in the appropriate context
     */
    public function attemptContextualLogin(array $credentials, bool $remember = false): bool
    {
        $guard = $this->resolveGuard();

        if ($guard instanceof StatefulGuard) {
            return $guard->attempt($credentials, $remember);
        }

        return false;
    }

    /**
     * Get the authenticated user from the appropriate context
     */
    public function getContextualUser()
    {
        return $this->resolveGuard()->user();
    }

    /**
     * Log out the user from the appropriate context
     */
    public function contextualLogout(): void
    {
        $guard = $this->resolveGuard();

        if ($guard instanceof StatefulGuard) {
            $guard->logout();
        }
    }
}
