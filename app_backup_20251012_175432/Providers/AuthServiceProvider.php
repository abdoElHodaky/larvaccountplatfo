<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define custom gates for multi-tenant authorization
        Gate::define('access-tenant', function ($user, $tenant) {
            return $user->tenants()->where('tenant_id', $tenant->id)->exists();
        });

        Gate::define('manage-tenant', function ($user, $tenant) {
            return $user->tenants()
                ->where('tenant_id', $tenant->id)
                ->wherePivot('role', 'admin')
                ->exists();
        });

        Gate::define('access-module', function ($user, $module) {
            $tenant = app('tenant');
            if (! $tenant) {
                return false;
            }

            return $user->hasModuleAccess($tenant, $module);
        });

        // Global user gates
        Gate::define('manage-global-settings', function ($user) {
            return $user instanceof \App\Models\GlobalUser && $user->is_super_admin;
        });

        Gate::define('create-tenant', function ($user) {
            return $user instanceof \App\Models\GlobalUser;
        });
    }
}
