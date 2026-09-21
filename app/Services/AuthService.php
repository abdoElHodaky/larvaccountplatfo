<?php

namespace App\Services;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Models\GlobalUser;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Shared\Models\User;

class AuthService
{
    /**
     * The tenant-aware authentication manager.
     */
    protected TenantAwareAuthManager $tenantAuth;

    /**
     * The tenant resolver service.
     */
    protected TenantResolver $tenantResolver;

    /**
     * Create a new authentication service instance.
     */
    public function __construct(TenantAwareAuthManager $tenantAuth, TenantResolver $tenantResolver)
    {
        $this->tenantAuth = $tenantAuth;
        $this->tenantResolver = $tenantResolver;
    }

    /**
     * Safely resolve current tenant in Octane context.
     */
    protected function resolveCurrentTenant(): ?Tenant
    {
        return app()->bound('tenant') ? app('tenant') : null;
    }

    /**
     * Attempt to authenticate user with given credentials
     */
    public function attemptLogin(array $credentials, bool $remember = false): bool
    {
        return $this->tenantAuth->attemptContextualLogin($credentials, $remember);
    }

    /**
     * Get the currently authenticated user
     */
    public function getAuthenticatedUser()
    {
        return $this->tenantAuth->getContextualUser();
    }

    /**
     * Log out the current user
     */
    public function logout(): void
    {
        $this->tenantAuth->contextualLogout();
    }

    /**
     * Register a new global user (landlord context)
     */
    public function registerGlobalUser(array $userData): GlobalUser
    {
        if ($this->tenantAuth->isTenantContext()) {
            throw new \Exception('Cannot register global user in tenant context.');
        }

        // Use DB::transaction() to ensure automatic rollback on failure under Octane
        return DB::connection('landlord')->transaction(function () use ($userData) {
            return GlobalUser::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'tenant_id' => $userData['tenant_id'] ?? null,
            ]);
        });
    }

    /**
     * Register a new tenant user (Fixed connection leakage & mass assignment)
     */
    public function registerTenantUser(array $userData, ?Tenant $tenant = null): User
    {
        $tenant = $tenant ?: $this->resolveCurrentTenant();

        if (! $tenant) {
            throw new \Exception('No tenant context available for user registration.');
        }

        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        return DB::connection($connectionName)->transaction(function () use ($userData, $connectionName, $tenant) {
            $userData['organization_id'] = $tenant->id;
            $userData['password'] = Hash::make($userData['password']);

            // Correctly instantiate and persist model on specific connection
            $user = new User;
            $user->setConnection($connectionName);
            $user->fill($userData);
            $user->save();

            return $user;
        });
    }

    /**
     * Change user password
     */
    public function changePassword(string $currentPassword, string $newPassword): bool
    {
        $user = $this->getAuthenticatedUser();

        if (! $user) {
            throw new \Exception('No authenticated user found.');
        }

        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($newPassword);
        return $user->save();
    }

    /**
     * Reset user password
     */
    public function resetPassword(string $email, string $token, string $newPassword): bool
    {
        $tenant = $this->resolveCurrentTenant();

        if ($tenant) {
            return $this->resetTenantUserPassword($email, $token, $newPassword, $tenant);
        }

        return $this->resetGlobalUserPassword($email, $token, $newPassword);
    }

    /**
     * Reset global user password
     */
    protected function resetGlobalUserPassword(string $email, string $token, string $newPassword): bool
    {
        $user = GlobalUser::where('email', $email)->first();

        if (! $user) {
            return false;
        }

        $user->password = Hash::make($newPassword);
        return $user->save();
    }

    /**
     * Reset tenant user password
     */
    protected function resetTenantUserPassword(string $email, string $token, string $newPassword, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $query = User::on($connectionName)->where('email', $email);

        if ($tenant->database_strategy === 'shared') {
            $query->where('organization_id', $tenant->id);
        }

        $user = $query->first();

        if (! $user) {
            return false;
        }

        $user->password = Hash::make($newPassword);
        return $user->save();
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(string $email): bool
    {
        $tenant = $this->resolveCurrentTenant();

        if ($tenant) {
            return $this->sendTenantPasswordResetEmail($email, $tenant);
        }

        return $this->sendGlobalPasswordResetEmail($email);
    }

    /**
     * Send password reset email for global user
     */
    protected function sendGlobalPasswordResetEmail(string $email): bool
    {
        $user = GlobalUser::where('email', $email)->first();

        return (bool) $user;
    }

    /**
     * Send password reset email for tenant user
     */
    protected function sendTenantPasswordResetEmail(string $email, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $query = User::on($connectionName)->where('email', $email);

        if ($tenant->database_strategy === 'shared') {
            $query->where('organization_id', $tenant->id);
        }

        return (bool) $query->first();
    }

    /**
     * Verify email address
     */
    public function verifyEmail(string $email, string $token): bool
    {
        $tenant = $this->resolveCurrentTenant();

        if ($tenant) {
            return $this->verifyTenantUserEmail($email, $token, $tenant);
        }

        return $this->verifyGlobalUserEmail($email, $token);
    }

    /**
     * Verify global user email
     */
    protected function verifyGlobalUserEmail(string $email, string $token): bool
    {
        $user = GlobalUser::where('email', $email)->first();

        if (! $user) {
            return false;
        }

        $user->email_verified_at = now();
        return $user->save();
    }

    /**
     * Verify tenant user email
     */
    protected function verifyTenantUserEmail(string $email, string $token, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $query = User::on($connectionName)->where('email', $email);

        if ($tenant->database_strategy === 'shared') {
            $query->where('organization_id', $tenant->id);
        }

        $user = $query->first();

        if (! $user) {
            return false;
        }

        $user->email_verified_at = now();
        return $user->save();
    }

    /**
     * Check if user has permission
     */
    public function userHasPermission(string $permission): bool
    {
        $user = $this->getAuthenticatedUser();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    /**
     * Check if user has role
     */
    public function userHasRole(string $role): bool
    {
        $user = $this->getAuthenticatedUser();

        return $user && method_exists($user, 'hasRole') && $user->hasRole($role);
    }

    /**
     * Get user's permissions
     */
    public function getUserPermissions(): array
    {
        $user = $this->getAuthenticatedUser();

        return $user->permissions ?? [];
    }

    /**
     * Grant permission to user
     */
    public function grantPermission(string $permission, $userId = null): bool
    {
        $user = $userId ? $this->findUserById($userId) : $this->getAuthenticatedUser();

        if ($user && method_exists($user, 'grantPermission')) {
            $user->grantPermission($permission);
            return true;
        }

        return false;
    }

    /**
     * Revoke permission from user
     */
    public function revokePermission(string $permission, $userId = null): bool
    {
        $user = $userId ? $this->findUserById($userId) : $this->getAuthenticatedUser();

        if ($user && method_exists($user, 'revokePermission')) {
            $user->revokePermission($permission);
            return true;
        }

        return false;
    }

    /**
     * Find user by ID in current context
     */
    protected function findUserById($userId)
    {
        $tenant = $this->resolveCurrentTenant();

        if ($tenant) {
            $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);
            $query = User::on($connectionName);

            if ($tenant->database_strategy === 'shared') {
                $query->where('organization_id', $tenant->id);
            }

            return $query->find($userId);
        }

        return GlobalUser::find($userId);
    }

    /**
     * Switch authentication context
     */
    public function switchContext(bool $toTenant = true): void
    {
        if ($toTenant) {
            $this->tenantAuth->switchToTenantContext();
        } else {
            $this->tenantAuth->switchToGlobalContext();
        }
    }

    /**
     * Check if current context is global
     */
    public function isGlobalContext(): bool
    {
        return $this->tenantAuth->isGlobalContext();
    }

    /**
     * Check if current context is tenant
     */
    public function isTenantContext(): bool
    {
        return $this->tenantAuth->isTenantContext();
    }
}
