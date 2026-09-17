<?php

namespace App\Http\Middleware;

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
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkipTenantResolution($request)) {
            return $next($request);
        }

        $tenant = $this->resolveTenant($request);

        if (! $tenant) {
            return $this->handleMissingTenant($request);
        }

        // Set tenant in container and session
        app()->instance('tenant', $tenant);
        $this->tenantResolver->configureDatabaseForTenant($tenant);
        session(['current_tenant_id' => $tenant->id]);

        return $next($request);
    }

    /**
     * Resolve the tenant for the current request.
     */
    protected function resolveTenant(Request $request): ?Tenant
    {
        // 1. From subdomain
        if ($tenant = $this->resolveTenantFromSubdomain($request)) {
            return $tenant;
        }

        // 2. From authenticated user
        if (Auth::check()) {
            $user = Auth::user();
            $activeTenantId = session('active_tenant_id');

            if ($activeTenantId && $tenant = $user->tenants()->where('tenant_id', $activeTenantId)->first()) {
                if ($user->hasAccessToTenant($tenant)) {
                    return $tenant;
                }
            }

            return $user->getActiveTenant();
        }

        // 3. From session fallback
        if ($tenantId = session('current_tenant_id')) {
            return Tenant::find($tenantId);
        }

        return null;
    }

    /**
     * Resolve tenant from subdomain.
     */
    protected function resolveTenantFromSubdomain(Request $request): ?Tenant
    {
        $parts = explode('.', $request->getHost());

        if (count($parts) < 3 || $parts[0] === 'www') {
            return null;
        }

        $reservedSubdomains = ['api', 'admin', 'app', 'mail', 'ftp', 'www'];
        if (in_array($parts[0], $reservedSubdomains)) {
            return null;
        }

        return Tenant::where('subdomain', $parts[0])
            ->where('status', 'active')
            ->first();
    }

    /**
     * Handle missing tenant scenario.
     */
    protected function handleMissingTenant(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Tenant not found or access denied',
                'message' => 'Please ensure you have access to the requested organization.',
            ], 403);
        }

        if (Auth::check()) {
            return redirect()->route('tenant.select')
                ->with('error', 'Please select an organization to continue.');
        }

        return redirect()->route('login')
            ->with('error', 'Please log in to access this organization.');
    }

    /**
     * Determine if tenant resolution should be skipped.
     */
    protected function shouldSkipTenantResolution(Request $request): bool
    {
        $skipRoutes = [
            'login', 'register', 'password.*', 'verification.*',
            'tenant.select', 'tenant.create', 'health-check', 'api/health',
        ];

        $currentRoute = $request->route()?->getName();
        if ($currentRoute) {
            foreach ($skipRoutes as $pattern) {
                if (fnmatch($pattern, $currentRoute)) {
                    return true;
                }
            }
        }

        $skipPaths = ['health', 'api/health', 'login', 'register', 'password', 'email/verify'];
        $currentPath = $request->path();

        foreach ($skipPaths as $path) {
            if (str_starts_with($currentPath, trim($path, '/'))) {
                return true;
            }
        }

        return false;
    }
}
