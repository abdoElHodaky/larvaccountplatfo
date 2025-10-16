<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any tenants.
     */
    public function viewAny(User $user): bool
    {
        // Users can view tenants they belong to
        return true;
    }

    /**
     * Determine whether the user can view the tenant.
     */
    public function view(User $user, Tenant $tenant): bool
    {
        return $user->hasAccessToTenant($tenant);
    }

    /**
     * Determine whether the user can create tenants.
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create a tenant (organization)
        return true;
    }

    /**
     * Determine whether the user can update the tenant.
     */
    public function update(User $user, Tenant $tenant): bool
    {
        if (! $user->hasAccessToTenant($tenant)) {
            return false;
        }

        // Get user's role in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $role = $userTenant?->pivot?->role;
        $permissions = $userTenant?->pivot?->permissions ?? [];

        // Admin and manager roles can update tenant settings
        if (in_array($role, ['admin', 'manager'])) {
            return true;
        }

        // Check for specific permission
        return in_array('manage-tenant', $permissions);
    }

    /**
     * Determine whether the user can delete the tenant.
     */
    public function delete(User $user, Tenant $tenant): bool
    {
        if (! $user->hasAccessToTenant($tenant)) {
            return false;
        }

        // Get user's role in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $role = $userTenant?->pivot?->role;

        // Only admin can delete tenant
        return $role === 'admin';
    }

    /**
     * Determine whether the user can restore the tenant.
     */
    public function restore(User $user, Tenant $tenant): bool
    {
        return $this->delete($user, $tenant);
    }

    /**
     * Determine whether the user can permanently delete the tenant.
     */
    public function forceDelete(User $user, Tenant $tenant): bool
    {
        return $this->delete($user, $tenant);
    }

    /**
     * Determine whether the user can manage users in the tenant.
     */
    public function manageUsers(User $user, Tenant $tenant): bool
    {
        if (! $user->hasAccessToTenant($tenant)) {
            return false;
        }

        // Get user's role in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $role = $userTenant?->pivot?->role;
        $permissions = $userTenant?->pivot?->permissions ?? [];

        // Admin and manager roles can manage users
        if (in_array($role, ['admin', 'manager'])) {
            return true;
        }

        // Check for specific permission
        return in_array('manage-users', $permissions);
    }

    /**
     * Determine whether the user can invite users to the tenant.
     */
    public function inviteUsers(User $user, Tenant $tenant): bool
    {
        return $this->manageUsers($user, $tenant);
    }

    /**
     * Determine whether the user can remove users from the tenant.
     */
    public function removeUsers(User $user, Tenant $tenant): bool
    {
        return $this->manageUsers($user, $tenant);
    }

    /**
     * Determine whether the user can manage modules in the tenant.
     */
    public function manageModules(User $user, Tenant $tenant): bool
    {
        if (! $user->hasAccessToTenant($tenant)) {
            return false;
        }

        // Get user's role in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $role = $userTenant?->pivot?->role;

        // Only admin can manage modules
        return $role === 'admin';
    }

    /**
     * Determine whether the user can access a specific module.
     */
    public function accessModule(User $user, Tenant $tenant, string $module): bool
    {
        if (! $user->hasAccessToTenant($tenant)) {
            return false;
        }

        // Check if module is enabled for the tenant
        $enabledModules = $tenant->enabled_modules ?? [];
        if (! in_array($module, $enabledModules)) {
            return false;
        }

        // Get user's permissions in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $permissions = $userTenant?->pivot?->permissions ?? [];

        // Check for specific module access permission
        return in_array("access-{$module}", $permissions);
    }

    /**
     * Determine whether the user can manage a specific module.
     */
    public function manageModule(User $user, Tenant $tenant, string $module): bool
    {
        if (! $this->accessModule($user, $tenant, $module)) {
            return false;
        }

        // Get user's permissions in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $permissions = $userTenant?->pivot?->permissions ?? [];

        // Check for specific module management permission
        return in_array("manage-{$module}", $permissions);
    }
}
