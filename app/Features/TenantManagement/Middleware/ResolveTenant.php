<?php

namespace App\Features\TenantManagement\Middleware;

use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        private TenantResolver $tenantResolver
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip tenant resolution for certain routes
        if ($this->shouldSkipTenantResolution($request)) {
            return $next($request);
        }

        // Resolve tenant from request
        $tenant = $this->resolveTenantFromRequest($request);

        if (! $tenant) {
            return $this->handleTenantNotFound($request);
        }

        // Set tenant context
        $this->setTenantContext($tenant);

        // Configure database connection
        $this->configureDatabaseConnection($tenant);

        return $next($request);
    }

    /**
     * Resolve tenant from the current request
     */
    private function resolveTenantFromRequest(Request $request)
    {
        // Try to resolve from subdomain first
        $host = $request->getHost();
        $tenant = $this->tenantResolver->resolveByDomain($host);

        if ($tenant) {
            return $tenant;
        }

        // Try to resolve from custom domain (if implemented)
        // This would be for tenants with custom domains
    }

    /**
     * Set tenant context in the application
     */
    private function setTenantContext($tenant): void
    {
        // Store tenant in app container
        app()->instance('tenant', $tenant);

        // Store tenant strategy for models
        app()->instance('tenant_strategy', $tenant->database_strategy);

        // Set tenant ID for organization scoping
        app()->instance('tenant_id', $tenant->id);

        // Store in config for easy access
        Config::set('app.current_tenant', $tenant);
    }

    /**
     * Configure database connection for the tenant
     */
    private function configureDatabaseConnection($tenant): void
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        // Set the default database connection
        Config::set('database.default', $connectionName);

        // Configure the specific connection if it doesn't exist
        if (! Config::has("database.connections.{$connectionName}")) {
            $this->createDatabaseConnection($tenant, $connectionName);
        }

        // Purge any existing connection to ensure fresh connection
        DB::purge($connectionName);
    }

    /**
     * Create database connection configuration for tenant
     */
    private function createDatabaseConnection($tenant, string $connectionName): void
    {
        $baseConfig = Config::get('database.connections.mysql');

        switch ($tenant->database_strategy) {
            case 'dedicated':
                $config = array_merge($baseConfig, [
                    'host' => $tenant->database_host ?? env('DB_HOST', '127.0.0.1'),
                    'database' => $tenant->database_name,
                ]);
                break;

            case 'clustered':
                $config = array_merge($baseConfig, [
                    'host' => $this->getRegionalHost($tenant->region),
                    'database' => "cluster_{$tenant->region}",
                ]);
                break;

            case 'shared':
            default:
                $shardNumber = (($tenant->id - 1) % 4) + 1;
                $config = array_merge($baseConfig, [
                    'database' => "shared_shard_{$shardNumber}",
                ]);
                break;
        }

        Config::set("database.connections.{$connectionName}", $config);
    }

    /**
     * Get regional database host
     */
    private function getRegionalHost(string $region): string
    {
        $regionalHosts = [
            'us-east-1' => env('DB_HOST_US_EAST', '127.0.0.1'),
            'us-west-2' => env('DB_HOST_US_WEST', '127.0.0.1'),
            'eu-west-1' => env('DB_HOST_EU_WEST', '127.0.0.1'),
            'ap-southeast-1' => env('DB_HOST_AP_SOUTHEAST', '127.0.0.1'),
        ];

        return $regionalHosts[$region] ?? env('DB_HOST', '127.0.0.1');
    }

    /**
     * Check if tenant resolution should be skipped
     */
    private function shouldSkipTenantResolution(Request $request): bool
    {
        $skipRoutes = [
            'health-check',
            'metrics',
            'api/status',
            'landlord/*',
        ];

        $path = $request->path();

        foreach ($skipRoutes as $skipRoute) {
            if (str_contains($skipRoute, '*')) {
                $pattern = str_replace('*', '.*', $skipRoute);
                if (preg_match("/^{$pattern}/", $path)) {
                    return true;
                }
            } elseif ($path === $skipRoute) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle case when tenant is not found
     */
    private function handleTenantNotFound(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Tenant not found',
                'message' => 'The requested tenant could not be found or is inactive.',
            ], 404);
        }

        // Redirect to tenant selection or registration page
        return redirect()->route('tenant.select');
    }
}
