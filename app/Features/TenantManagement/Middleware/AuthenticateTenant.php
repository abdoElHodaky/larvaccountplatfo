<?php

namespace App\Features\TenantManagement\Middleware;

use App\Auth\TenantAwareAuthManager;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class AuthenticateTenant extends Middleware
{
    /**
     * The tenant-aware authentication manager.
     */
    protected $tenantAuth;

    /**
     * Create a new middleware instance.
     */
    public function __construct(TenantAwareAuthManager $tenantAuth)
    {
        $this->tenantAuth = $tenantAuth;
    }

    /**
     * Handle an incoming request.
     */
    public function handle($request, Closure $next, ...$guards)
    {
        // Resolve the appropriate authentication context
        $this->authenticate($request, $guards);

        return $next($request);
    }

    /**
     * Determine if the user is logged in to any of the given guards.
     */
    protected function authenticate($request, array $guards)
    {
        if (empty($guards)) {
            $guards = [null];
        }

        foreach ($guards as $guard) {
            if ($this->auth->guard($guard)->check()) {
                return $this->auth->shouldUse($guard);
            }
        }

        $this->unauthenticated($request, $guards);
    }

    /**
     * Handle an unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        throw new AuthenticationException(
            'Unauthenticated.', $guards, $this->redirectTo($request)
        );
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo($request)
    {
        if (!$request->expectsJson()) {
            // Determine redirect based on tenant context
            $tenant = app('tenant', null);
            
            if ($tenant) {
                // Tenant context - redirect to tenant login
                return route('tenant.login');
            } else {
                // Global context - redirect to landlord login
                return route('landlord.login');
            }
        }
    }

    /**
     * Get the guards for the request based on tenant context
     */
    protected function getGuardsForRequest($request): array
    {
        $tenant = app('tenant', null);
        
        if ($tenant) {
            return ['tenant_user'];
        } else {
            return ['global_user'];
        }
    }

    /**
     * Determine if the request is for a tenant-specific route
     */
    protected function isTenantRoute($request): bool
    {
        return app()->bound('tenant') && app('tenant') !== null;
    }

    /**
     * Determine if the request is for a landlord route
     */
    protected function isLandlordRoute($request): bool
    {
        return !$this->isTenantRoute($request);
    }

    /**
     * Handle tenant-specific authentication
     */
    protected function authenticateTenant($request, array $guards)
    {
        $tenant = app('tenant');
        
        if (!$tenant) {
            throw new AuthenticationException('No tenant context found.');
        }

        // Use tenant-specific guard
        $guard = $this->auth->guard('tenant_user');
        
        if (!$guard->check()) {
            throw new AuthenticationException(
                'Unauthenticated for tenant.', 
                ['tenant_user'], 
                $this->redirectTo($request)
            );
        }

        // Verify user belongs to current tenant
        $user = $guard->user();
        if (!$this->userBelongsToTenant($user, $tenant)) {
            $guard->logout();
            throw new AuthenticationException(
                'User does not belong to current tenant.', 
                ['tenant_user'], 
                $this->redirectTo($request)
            );
        }

        return $guard;
    }

    /**
     * Handle landlord authentication
     */
    protected function authenticateLandlord($request, array $guards)
    {
        $guard = $this->auth->guard('global_user');
        
        if (!$guard->check()) {
            throw new AuthenticationException(
                'Unauthenticated for landlord.', 
                ['global_user'], 
                $this->redirectTo($request)
            );
        }

        return $guard;
    }

    /**
     * Check if user belongs to the current tenant
     */
    protected function userBelongsToTenant($user, $tenant): bool
    {
        if (!$user || !$tenant) {
            return false;
        }

        // For shared databases, check organization_id
        if ($tenant->database_strategy === 'shared') {
            return isset($user->organization_id) && $user->organization_id === $tenant->id;
        }

        // For dedicated/clustered databases, user automatically belongs to tenant
        // since they're in the tenant's database
        return true;
    }

    /**
     * Get the authenticated user for the current context
     */
    public function getAuthenticatedUser()
    {
        $tenant = app('tenant', null);
        
        if ($tenant) {
            return $this->auth->guard('tenant_user')->user();
        } else {
            return $this->auth->guard('global_user')->user();
        }
    }

    /**
     * Check if current user has permission
     */
    public function userHasPermission(string $permission): bool
    {
        $user = $this->getAuthenticatedUser();
        
        if (!$user) {
            return false;
        }

        // Check if user has the permission
        if (method_exists($user, 'hasPermission')) {
            return $user->hasPermission($permission);
        }

        return false;
    }

    /**
     * Check if current user has role
     */
    public function userHasRole(string $role): bool
    {
        $user = $this->getAuthenticatedUser();
        
        if (!$user) {
            return false;
        }

        // Check if user has the role
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($role);
        }

        return false;
    }

    /**
     * Require specific permission for the request
     */
    public function requirePermission(string $permission)
    {
        if (!$this->userHasPermission($permission)) {
            throw new AuthenticationException("Permission '{$permission}' required.");
        }
    }

    /**
     * Require specific role for the request
     */
    public function requireRole(string $role)
    {
        if (!$this->userHasRole($role)) {
            throw new AuthenticationException("Role '{$role}' required.");
        }
    }
}

