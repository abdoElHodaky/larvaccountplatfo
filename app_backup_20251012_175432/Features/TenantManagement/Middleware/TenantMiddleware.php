<?php

namespace App\Features\TenantManagement\Middleware;

use App\Models\Tenant;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * The tenant resolver service.
     */
    protected TenantResolver $tenantResolver;

    /**
     * Create a new middleware instance.
     */
    public function __construct(TenantResolver $tenantResolver)
    {
        $this->tenantResolver = $tenantResolver;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip tenant resolution for certain routes
        if ($this->shouldSkipTenantResolution($request)) {
            return $next($request);
        }

        $tenant = $this->resolveTenant($request);

        if (! $tenant) {
            return $this->handleMissingTenant($request);
        }

        // Set tenant in container
        app()->instance('tenant', $tenant);

        // Configure database connection for tenant
        $this->tenantResolver->configureDatabaseForTenant($tenant);

        // Set tenant context in session
        session(['current_tenant_id' => $tenant->id]);

        return $next($request);
    }

    /**
     * Resolve the tenant for the current request.
     */
    protected function resolveTenant(Request $request): ?Tenant
    {
        // Method 1: From subdomain
        $tenant = $this->resolveTenantFromSubdomain($request);
        if ($tenant) {
            return $tenant;
        }

        // Method 2: From authenticated user's active tenant
        if (Auth::check()) {
            $user = Auth::user();
            $activeTenantId = session('active_tenant_id');

            if ($activeTenantId) {
                $tenant = $user->tenants()->where('tenant_id', $activeTenantId)->first();
                if ($tenant && $user->hasAccessToTenant($tenant)) {
                    return $tenant;
                }
            }

            // Fall back to user's first available tenant
            return $user->getActiveTenant();
        }

        // Method 3: From session (for guest users with tenant context)
        $tenantId = session('current_tenant_id');
        if ($tenantId) {
            return Tenant::find($tenantId);
        }

        return null;
    }

    /**
     * Resolve tenant from subdomain.
     */
    protected function resolveTenantFromSubdomain(Request $request): ?Tenant
    {
        $host = $request->getHost();
        $parts = explode('.', $host);

        // Skip if no subdomain or if it's www
        if (count($parts) < 3 || $parts[0] === 'www') {
            return null;
        }

        $subdomain = $parts[0];

        // Skip certain reserved subdomains
        $reservedSubdomains = ['api', 'admin', 'app', 'mail', 'ftp', 'www'];
        if (in_array($subdomain, $reservedSubdomains)) {
            return null;
        }

        return Tenant::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Handle missing tenant scenario.
     */
    protected function handleMissingTenant(Request $request): Response
    {
        // For API requests, return JSON error
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Tenant not found or access denied',
                'message' => 'Please ensure you have access to the requested organization.',
            ], 403);
        }

        // For authenticated users, redirect to tenant selection
        if (Auth::check()) {
            return redirect()->route('tenant.select')
                ->with('error', 'Please select an organization to continue.');
        }

        // For guest users, redirect to login
        return redirect()->route('login')
            ->with('error', 'Please log in to access this organization.');
    }

    /**
     * Determine if tenant resolution should be skipped.
     */
    protected function shouldSkipTenantResolution(Request $request): bool
    {
        $skipRoutes = [
            'login',
            'register',
            'password.*',
            'verification.*',
            'tenant.select',
            'tenant.create',
            'health-check',
            'api/health',
        ];

        $currentRoute = $request->route()?->getName();

        foreach ($skipRoutes as $pattern) {
            if (fnmatch($pattern, $currentRoute)) {
                return true;
            }
        }

        // Skip for certain paths
        $skipPaths = [
            '/health',
            '/api/health',
            '/login',
            '/register',
            '/password',
            '/email/verify',
        ];

        $currentPath = $request->path();

        foreach ($skipPaths as $path) {
            if (str_starts_with($currentPath, trim($path, '/'))) {
                return true;
            }
        }

        return false;
    }
}
