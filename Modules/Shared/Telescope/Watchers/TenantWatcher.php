<?php

namespace Modules\Shared\Telescope\Watchers;

use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\Watchers\Watcher;
use Illuminate\Http\Request;
use Illuminate\Foundation\Http\Events\RequestHandled;

class TenantWatcher extends Watcher
{
    /**
     * Register the watcher.
     */
    public function register($app): void
    {
        $app['events']->listen(RequestHandled::class, [$this, 'recordTenantContext']);
    }

    /**
     * Record tenant context for the request.
     */
    public function recordTenantContext(RequestHandled $event): void
    {
        if (!$this->shouldRecord($event)) {
            return;
        }

        $tenantId = $this->extractTenantId($event->request);
        $tenantInfo = $this->getTenantInfo($tenantId);

        Telescope::recordTenantContext(IncomingEntry::make([
            'tenant_id' => $tenantId,
            'tenant_name' => $tenantInfo['name'] ?? null,
            'tenant_tier' => $tenantInfo['tier'] ?? null,
            'database_strategy' => $tenantInfo['database_strategy'] ?? null,
            'request_uri' => $event->request->getRequestUri(),
            'request_method' => $event->request->getMethod(),
            'user_id' => $event->request->user()?->id,
            'ip_address' => $event->request->ip(),
            'user_agent' => $event->request->userAgent(),
            'session_id' => $event->request->session()?->getId(),
            'response_status' => $event->response->getStatusCode(),
            'response_time' => $this->getResponseTime($event),
        ])->tags([
            'tenant-context',
            'tenant:' . $tenantId,
            'tier:' . ($tenantInfo['tier'] ?? 'unknown'),
            'status:' . $event->response->getStatusCode(),
        ]));
    }

    /**
     * Determine if the tenant context should be recorded.
     */
    private function shouldRecord(RequestHandled $event): bool
    {
        if (!$this->options['enabled'] ?? true) {
            return false;
        }

        // Skip telescope routes
        if (str_contains($event->request->getRequestUri(), '/telescope')) {
            return false;
        }

        // Skip health check routes
        if (str_contains($event->request->getRequestUri(), '/health')) {
            return false;
        }

        return true;
    }

    /**
     * Extract tenant ID from the request.
     */
    private function extractTenantId(Request $request): ?string
    {
        // Try multiple sources for tenant identification
        return $request->header('X-Tenant-ID') 
            ?? $request->get('tenant_id')
            ?? session('tenant_id')
            ?? $this->extractFromSubdomain($request)
            ?? 'default';
    }

    /**
     * Extract tenant from subdomain.
     */
    private function extractFromSubdomain(Request $request): ?string
    {
        $host = $request->getHost();
        $parts = explode('.', $host);
        
        // If we have a subdomain and it's not 'www'
        if (count($parts) > 2 && $parts[0] !== 'www') {
            return $parts[0];
        }
        
        return null;
    }

    /**
     * Get tenant information.
     */
    private function getTenantInfo(?string $tenantId): array
    {
        if (!$tenantId || $tenantId === 'default') {
            return [
                'name' => 'Default Tenant',
                'tier' => 'basic',
                'database_strategy' => 'shared',
            ];
        }

        // This would typically query a tenant registry
        // For now, return mock data
        return [
            'name' => "Tenant {$tenantId}",
            'tier' => 'premium', // This would be looked up
            'database_strategy' => 'dedicated', // This would be looked up
        ];
    }

    /**
     * Get response time from the request.
     */
    private function getResponseTime(RequestHandled $event): ?float
    {
        $startTime = $event->request->server('REQUEST_TIME_FLOAT');
        
        if ($startTime) {
            return round((microtime(true) - $startTime) * 1000, 2);
        }
        
        return null;
    }
}
