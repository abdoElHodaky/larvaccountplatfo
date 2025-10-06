<?php

namespace Modules\Shared\Services;

use Laravel\Telescope\Telescope;
use Laravel\Telescope\Storage\EntryQueryOptions;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TelescopePerformanceAdapter
{
    private PerformanceMonitor $customMonitor;

    public function __construct(PerformanceMonitor $customMonitor)
    {
        $this->customMonitor = $customMonitor;
    }

    /**
     * Get unified performance summary combining Telescope and custom metrics.
     */
    public function getUnifiedPerformanceSummary(int $minutes = 60): array
    {
        $cacheKey = "unified_performance_summary_{$minutes}min_" . $this->getCurrentTenantId();
        
        return Cache::remember($cacheKey, 300, function () use ($minutes) {
            $since = now()->subMinutes($minutes);
            
            return [
                'period' => "{$minutes} minutes",
                'tenant_id' => $this->getCurrentTenantId(),
                'telescope_metrics' => $this->getTelescopeMetrics($since),
                'custom_metrics' => $this->customMonitor->getPerformanceSummary($minutes),
                'unified_insights' => $this->generateUnifiedInsights($since),
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Get slow operations from both Telescope and custom monitoring.
     */
    public function getUnifiedSlowOperations(int $thresholdMs = 1000, int $limit = 50): array
    {
        $telescopeSlowOps = $this->getTelescopeSlowOperations($thresholdMs, $limit);
        $customSlowOps = $this->customMonitor->getSlowOperations($thresholdMs, $limit);
        
        // Merge and sort by duration
        $allSlowOps = array_merge($telescopeSlowOps, $customSlowOps);
        usort($allSlowOps, fn($a, $b) => ($b['duration_ms'] ?? 0) <=> ($a['duration_ms'] ?? 0));
        
        return array_slice($allSlowOps, 0, $limit);
    }

    /**
     * Get database performance metrics from Telescope.
     */
    public function getDatabasePerformanceFromTelescope(\DateTimeInterface $since): array
    {
        if (!$this->isTelescopeEnabled()) {
            return $this->getEmptyDatabaseMetrics();
        }

        try {
            $queries = $this->getTelescopeEntries('queries', $since);
            
            return [
                'total_queries' => $queries->count(),
                'slow_queries' => $queries->where('slow', true)->count(),
                'average_duration_ms' => $queries->avg('duration') ?? 0,
                'total_duration_ms' => $queries->sum('duration') ?? 0,
                'unique_queries' => $queries->unique('sql')->count(),
                'most_frequent_queries' => $this->getMostFrequentQueries($queries),
                'slowest_queries' => $this->getSlowestQueries($queries),
            ];
        } catch (\Exception $e) {
            return $this->getEmptyDatabaseMetrics();
        }
    }

    /**
     * Get request performance metrics from Telescope.
     */
    public function getRequestPerformanceFromTelescope(\DateTimeInterface $since): array
    {
        if (!$this->isTelescopeEnabled()) {
            return $this->getEmptyRequestMetrics();
        }

        try {
            $requests = $this->getTelescopeEntries('requests', $since);
            
            return [
                'total_requests' => $requests->count(),
                'average_response_time_ms' => $requests->avg('duration') ?? 0,
                'slowest_requests' => $this->getSlowestRequests($requests),
                'status_code_distribution' => $this->getStatusCodeDistribution($requests),
                'endpoint_performance' => $this->getEndpointPerformance($requests),
                'tenant_performance' => $this->getTenantPerformanceFromRequests($requests),
            ];
        } catch (\Exception $e) {
            return $this->getEmptyRequestMetrics();
        }
    }

    /**
     * Get domain event metrics from Telescope.
     */
    public function getDomainEventMetricsFromTelescope(\DateTimeInterface $since): array
    {
        if (!$this->isTelescopeEnabled()) {
            return $this->getEmptyDomainEventMetrics();
        }

        try {
            $events = $this->getTelescopeEntries('domain_events', $since);
            
            return [
                'total_events' => $events->count(),
                'events_by_type' => $events->groupBy('event_type')->map->count(),
                'events_by_aggregate' => $events->groupBy('aggregate_type')->map->count(),
                'events_by_tenant' => $events->groupBy('tenant_id')->map->count(),
                'recent_events' => $events->take(10)->toArray(),
            ];
        } catch (\Exception $e) {
            return $this->getEmptyDomainEventMetrics();
        }
    }

    /**
     * Get tenant-specific performance data from Telescope.
     */
    public function getTenantPerformanceFromTelescope(string $tenantId, \DateTimeInterface $since): array
    {
        if (!$this->isTelescopeEnabled()) {
            return $this->getEmptyTenantMetrics();
        }

        try {
            $tenantRequests = $this->getTelescopeEntries('requests', $since)
                ->where('tenant_id', $tenantId);
            
            $tenantQueries = $this->getTelescopeEntries('queries', $since)
                ->where('tenant_id', $tenantId);
            
            return [
                'tenant_id' => $tenantId,
                'request_count' => $tenantRequests->count(),
                'average_response_time_ms' => $tenantRequests->avg('duration') ?? 0,
                'query_count' => $tenantQueries->count(),
                'average_query_time_ms' => $tenantQueries->avg('duration') ?? 0,
                'error_rate' => $this->calculateErrorRate($tenantRequests),
                'performance_trend' => $this->calculatePerformanceTrend($tenantRequests),
            ];
        } catch (\Exception $e) {
            return $this->getEmptyTenantMetrics();
        }
    }

    /**
     * Sync custom metrics to Telescope.
     */
    public function syncCustomMetricsToTelescope(): void
    {
        if (!$this->isTelescopeEnabled() || !config('telescope.performance_integration.sync_metrics', true)) {
            return;
        }

        $customMetrics = $this->customMonitor->getCurrentStatus();
        
        Telescope::recordCustomMetrics([
            'type' => 'custom_performance_sync',
            'metrics' => $customMetrics,
            'tenant_id' => $this->getCurrentTenantId(),
            'synced_at' => now()->toISOString(),
        ]);
    }

    /**
     * Get performance alerts based on both Telescope and custom data.
     */
    public function getPerformanceAlerts(): array
    {
        $alerts = [];
        
        // Check for slow operations
        $slowOps = $this->getUnifiedSlowOperations(5000, 10); // 5 second threshold
        if (!empty($slowOps)) {
            $alerts[] = [
                'type' => 'slow_operations',
                'severity' => 'high',
                'message' => count($slowOps) . ' operations detected over 5 seconds',
                'data' => $slowOps,
            ];
        }
        
        // Check error rates from Telescope
        if ($this->isTelescopeEnabled()) {
            $errorRate = $this->getRecentErrorRate();
            if ($errorRate > 0.05) { // 5% threshold
                $alerts[] = [
                    'type' => 'high_error_rate',
                    'severity' => 'critical',
                    'message' => "Error rate is {$errorRate}% (threshold: 5%)",
                    'data' => ['error_rate' => $errorRate],
                ];
            }
        }
        
        return $alerts;
    }

    /**
     * Get Telescope entries for a specific type.
     */
    private function getTelescopeEntries(string $type, \DateTimeInterface $since): Collection
    {
        if (!$this->isTelescopeEnabled()) {
            return collect();
        }

        try {
            return collect(
                Telescope::storage()->get(
                    EntryQueryOptions::forType($type)
                        ->limit(1000)
                        ->afterSequence(0)
                )
            )->filter(function ($entry) use ($since) {
                return $entry->created_at >= $since;
            });
        } catch (\Exception $e) {
            return collect();
        }
    }

    /**
     * Generate unified insights from both monitoring systems.
     */
    private function generateUnifiedInsights(\DateTimeInterface $since): array
    {
        return [
            'database_performance' => $this->getDatabasePerformanceFromTelescope($since),
            'request_performance' => $this->getRequestPerformanceFromTelescope($since),
            'domain_events' => $this->getDomainEventMetricsFromTelescope($since),
            'performance_alerts' => $this->getPerformanceAlerts(),
            'recommendations' => $this->generatePerformanceRecommendations(),
        ];
    }

    /**
     * Generate performance recommendations.
     */
    private function generatePerformanceRecommendations(): array
    {
        $recommendations = [];
        
        // Check for N+1 query patterns
        if ($this->detectNPlusOneQueries()) {
            $recommendations[] = [
                'type' => 'n_plus_one_queries',
                'priority' => 'high',
                'message' => 'Potential N+1 query patterns detected. Consider using eager loading.',
            ];
        }
        
        // Check for memory usage
        $memoryUsage = memory_get_peak_usage(true) / 1024 / 1024;
        if ($memoryUsage > 128) { // 128MB threshold
            $recommendations[] = [
                'type' => 'high_memory_usage',
                'priority' => 'medium',
                'message' => "Peak memory usage is {$memoryUsage}MB. Consider optimizing memory-intensive operations.",
            ];
        }
        
        return $recommendations;
    }

    /**
     * Check if Telescope is enabled and available.
     */
    private function isTelescopeEnabled(): bool
    {
        return config('telescope.enabled', false) && class_exists(\Laravel\Telescope\Telescope::class);
    }

    /**
     * Get current tenant ID.
     */
    private function getCurrentTenantId(): ?string
    {
        return session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }

    /**
     * Get Telescope metrics summary.
     */
    private function getTelescopeMetrics(\DateTimeInterface $since): array
    {
        return [
            'database' => $this->getDatabasePerformanceFromTelescope($since),
            'requests' => $this->getRequestPerformanceFromTelescope($since),
            'domain_events' => $this->getDomainEventMetricsFromTelescope($since),
        ];
    }

    /**
     * Get slow operations from Telescope.
     */
    private function getTelescopeSlowOperations(int $thresholdMs, int $limit): array
    {
        // This would query Telescope's slow operation entries
        // Implementation depends on how slow operations are stored in Telescope
        return [];
    }

    /**
     * Helper methods for empty metrics when Telescope is unavailable.
     */
    private function getEmptyDatabaseMetrics(): array
    {
        return [
            'total_queries' => 0,
            'slow_queries' => 0,
            'average_duration_ms' => 0,
            'total_duration_ms' => 0,
            'unique_queries' => 0,
            'most_frequent_queries' => [],
            'slowest_queries' => [],
        ];
    }

    private function getEmptyRequestMetrics(): array
    {
        return [
            'total_requests' => 0,
            'average_response_time_ms' => 0,
            'slowest_requests' => [],
            'status_code_distribution' => [],
            'endpoint_performance' => [],
            'tenant_performance' => [],
        ];
    }

    private function getEmptyDomainEventMetrics(): array
    {
        return [
            'total_events' => 0,
            'events_by_type' => [],
            'events_by_aggregate' => [],
            'events_by_tenant' => [],
            'recent_events' => [],
        ];
    }

    private function getEmptyTenantMetrics(): array
    {
        return [
            'request_count' => 0,
            'average_response_time_ms' => 0,
            'query_count' => 0,
            'average_query_time_ms' => 0,
            'error_rate' => 0,
            'performance_trend' => 'stable',
        ];
    }

    // Additional helper methods would be implemented here for:
    // - getMostFrequentQueries()
    // - getSlowestQueries()
    // - getSlowestRequests()
    // - getStatusCodeDistribution()
    // - getEndpointPerformance()
    // - getTenantPerformanceFromRequests()
    // - calculateErrorRate()
    // - calculatePerformanceTrend()
    // - getRecentErrorRate()
    // - detectNPlusOneQueries()
}
