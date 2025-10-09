<?php

namespace App\Http\Middleware;

use App\Infrastructure\Database\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Set Database Shard Middleware
 * Automatically sets the appropriate database connection based on tenant
 */
class SetDatabaseShard
{
    public function __construct(
        private TenantResolver $tenantResolver
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Resolve tenant from request context
            $tenant = $this->tenantResolver->resolveTenantFromRequest();
            
            if ($tenant) {
                // Set the appropriate database connection
                $this->tenantResolver->setTenantConnection($tenant);
                
                // Store tenant in application context for later use
                app()->instance('current.tenant', $tenant);
                
                // Log database connection switch for debugging
                if (config('app.debug')) {
                    $connectionName = $this->tenantResolver->getConnectionName($tenant);
                    Log::debug("Database connection set to: {$connectionName} for tenant: {$tenant->id}");
                }
            } else {
                // No tenant found, use landlord database
                config(['database.default' => 'landlord']);
                
                if (config('app.debug')) {
                    Log::debug("No tenant found, using landlord database");
                }
            }
        } catch (\Exception $e) {
            // Log error but don't break the request
            Log::error("Failed to set database shard: " . $e->getMessage(), [
                'exception' => $e,
                'request_url' => $request->url(),
                'user_id' => auth()->id(),
            ]);
            
            // Fallback to landlord database
            config(['database.default' => 'landlord']);
        }

        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        // Clean up tenant context
        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }
        
        // Log performance metrics if enabled
        if (config('app.debug') && config('tenant.log_performance', false)) {
            $this->logPerformanceMetrics($request, $response);
        }
    }

    /**
     * Log performance metrics for monitoring
     */
    private function logPerformanceMetrics(Request $request, Response $response): void
    {
        $executionTime = microtime(true) - LARAVEL_START;
        $memoryUsage = memory_get_peak_usage(true);
        
        Log::info("Request performance metrics", [
            'url' => $request->url(),
            'method' => $request->method(),
            'execution_time' => round($executionTime * 1000, 2) . 'ms',
            'memory_usage' => $this->formatBytes($memoryUsage),
            'response_status' => $response->getStatusCode(),
            'tenant_id' => app()->bound('current.tenant') ? app('current.tenant')->id : null,
            'database_connection' => config('database.default'),
        ]);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
