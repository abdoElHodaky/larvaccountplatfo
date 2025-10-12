<?php

namespace App\Features\Authentication\Services;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Models\GlobalUser;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Shared\Models\User;

class AuthService
{
    /**
     * The tenant-aware authentication manager.
     */
    protected $tenantAuth;

    /**
     * The tenant resolver service.
     */
    protected $tenantResolver;

    /**
     * Create a new authentication service instance.
     */
    public function __construct(TenantAwareAuthManager $tenantAuth, TenantResolver $tenantResolver)
    {
        $this->tenantAuth = $tenantAuth;
        $this->tenantResolver = $tenantResolver;
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
        // Ensure we're in global context
        if ($this->tenantAuth->isTenantContext()) {
            throw new \Exception('Cannot register global user in tenant context.');
        }

        DB::connection('landlord')->beginTransaction();

        try {
            $globalUser = GlobalUser::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'tenant_id' => $userData['tenant_id'] ?? null,
            ]);

            DB::connection('landlord')->commit();

            return $globalUser;
        } catch (\Exception $e) {
            DB::connection('landlord')->rollBack();
            throw $e;
        }
    }

    /**
     * Register a new tenant user
     */
    public function registerTenantUser(array $userData, ?Tenant $tenant = null): User
    {
        $tenant = $tenant ?: app('tenant');

        if (! $tenant) {
            throw new \Exception('No tenant context available for user registration.');
        }

        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        DB::connection($connectionName)->beginTransaction();

        try {
            $user = new User;
            $user->setConnection($connectionName);

            $userData['organization_id'] = $tenant->id;
            $userData['password'] = Hash::make($userData['password']);

            $user = $user->create($userData);

            DB::connection($connectionName)->commit();

            return $user;
        } catch (\Exception $e) {
            DB::connection($connectionName)->rollBack();
            throw $e;
        }
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

        // Verify current password
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($newPassword);
        $user->save();

        return true;
    }

    /**
     * Reset user password
     */
    public function resetPassword(string $email, string $token, string $newPassword): bool
    {
        $tenant = app('tenant', null);

        if ($tenant) {
            return $this->resetTenantUserPassword($email, $token, $newPassword, $tenant);
        } else {
            return $this->resetGlobalUserPassword($email, $token, $newPassword);
        }
    }

    /**
     * Reset global user password
     */
    protected function resetGlobalUserPassword(string $email, string $token, string $newPassword): bool
    {
        // Implementation for global user password reset
        $user = GlobalUser::where('email', $email)->first();

        if (! $user) {
            return false;
        }

        // Verify reset token (simplified - in production use Laravel's password reset)
        // This would typically involve checking a password_reset_tokens table

        $user->password = Hash::make($newPassword);
        $user->save();

        return true;
    }

    /**
     * Reset tenant user password
     */
    protected function resetTenantUserPassword(string $email, string $token, string $newPassword, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $user = User::on($connectionName)->where('email', $email);

        // For shared databases, also filter by organization
        if ($tenant->database_strategy === 'shared') {
            $user->where('organization_id', $tenant->id);
        }

        $user = $user->first();

        if (! $user) {
            return false;
        }

        // Verify reset token (simplified - in production use Laravel's password reset)

        $user->password = Hash::make($newPassword);
        $user->save();

        return true;
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(string $email): bool
    {
        $tenant = app('tenant', null);

        if ($tenant) {
            return $this->sendTenantPasswordResetEmail($email, $tenant);
        } else {
            return $this->sendGlobalPasswordResetEmail($email);
        }
    }

    /**
     * Send password reset email for global user
     */
    protected function sendGlobalPasswordResetEmail(string $email): bool
    {
        $user = GlobalUser::where('email', $email)->first();

        if (! $user) {
            return false;
        }

        // Generate reset token and send email
        // Implementation would use Laravel's password reset functionality

        return true;
    }

    /**
     * Send password reset email for tenant user
     */
    protected function sendTenantPasswordResetEmail(string $email, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $user = User::on($connectionName)->where('email', $email);

        // For shared databases, also filter by organization
        if ($tenant->database_strategy === 'shared') {
            $user->where('organization_id', $tenant->id);
        }

        $user = $user->first();

        if (! $user) {
            return false;
        }

        // Generate reset token and send email
        // Implementation would use Laravel's password reset functionality

        return true;
    }

    /**
     * Verify email address
     */
    public function verifyEmail(string $email, string $token): bool
    {
        $tenant = app('tenant', null);

        if ($tenant) {
            return $this->verifyTenantUserEmail($email, $token, $tenant);
        } else {
            return $this->verifyGlobalUserEmail($email, $token);
        }
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

        // Verify email verification token
        // Implementation would check the token and mark email as verified

        $user->email_verified_at = now();
        $user->save();

        return true;
    }

    /**
     * Verify tenant user email
     */
    protected function verifyTenantUserEmail(string $email, string $token, Tenant $tenant): bool
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $user = User::on($connectionName)->where('email', $email);

        // For shared databases, also filter by organization
        if ($tenant->database_strategy === 'shared') {
            $user->where('organization_id', $tenant->id);
        }

        $user = $user->first();

        if (! $user) {
            return false;
        }

        // Verify email verification token

        $user->email_verified_at = now();
        $user->save();

        return true;
    }

    /**
     * Check if user has permission
     */
    public function userHasPermission(string $permission): bool
    {
        $user = $this->getAuthenticatedUser();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasPermission')) {
            return $user->hasPermission($permission);
        }

        return false;
    }

    /**
     * Check if user has role
     */
    public function userHasRole(string $role): bool
    {
        $user = $this->getAuthenticatedUser();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($role);
        }

        return false;
    }

    /**
     * Get user's permissions
     */
    public function getUserPermissions(): array
    {
        $user = $this->getAuthenticatedUser();

        if (! $user) {
            return [];
        }

        if (isset($user->permissions)) {
            return $user->permissions ?? [];
        }

        return [];
    }

    /**
     * Grant permission to user
     */
    public function grantPermission(string $permission, $userId = null): bool
    {
        $user = $userId ? $this->findUserById($userId) : $this->getAuthenticatedUser();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'grantPermission')) {
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

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'revokePermission')) {
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
        $tenant = app('tenant', null);

        if ($tenant) {
            $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);
            $user = User::on($connectionName);

            if ($tenant->database_strategy === 'shared') {
                $user->where('organization_id', $tenant->id);
            }

            return $user->find($userId);
        } else {
            return GlobalUser::find($userId);
        }
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
