<?php

namespace App\Shared\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PerformanceMonitor
{
    private array $timers = [];
    private array $metrics = [];
    private array $counters = [];
    private bool $enabled;

    public function __construct()
    {
        $this->enabled = config('tenant.monitoring.metrics.enabled', true);
    }

    /**
     * Start timing an operation
     */
    public function startTimer(string $operation, array $context = []): string
    {
        if (!$this->enabled) {
            return '';
        }

        $timerId = $this->generateTimerId($operation);
        
        $this->timers[$timerId] = [
            'operation' => $operation,
            'start_time' => microtime(true),
            'start_memory' => memory_get_usage(true),
            'context' => $context,
            'tenant_id' => $this->getCurrentTenantId(),
            'module' => $this->extractModuleFromContext($context),
        ];

        return $timerId;
    }

    /**
     * Stop timing an operation and record metrics
     */
    public function stopTimer(string $timerId): ?array
    {
        if (!$this->enabled || !isset($this->timers[$timerId])) {
            return null;
        }

        $timer = $this->timers[$timerId];
        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);

        $metrics = [
            'operation' => $timer['operation'],
            'duration_ms' => round(($endTime - $timer['start_time']) * 1000, 2),
            'memory_used_mb' => round(($endMemory - $timer['start_memory']) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'tenant_id' => $timer['tenant_id'],
            'module' => $timer['module'],
            'context' => $timer['context'],
            'timestamp' => now(),
            'db_queries' => $this->getQueryCount(),
        ];

        // Store metrics
        $this->recordMetrics($metrics);

        // Clean up timer
        unset($this->timers[$timerId]);

        return $metrics;
    }

    /**
     * Record custom metrics
     */
    public function recordMetric(string $name, $value, array $tags = []): void
    {
        if (!$this->enabled) {
            return;
        }

        $metric = [
            'name' => $name,
            'value' => $value,
            'tags' => array_merge($tags, [
                'tenant_id' => $this->getCurrentTenantId(),
                'module' => $this->getCurrentModule(),
            ]),
            'timestamp' => now(),
        ];

        $this->metrics[] = $metric;
        $this->flushMetricsIfNeeded();
    }

    /**
     * Increment a counter
     */
    public function incrementCounter(string $name, int $value = 1, array $tags = []): void
    {
        if (!$this->enabled) {
            return;
        }

        $key = $this->buildCounterKey($name, $tags);
        $this->counters[$key] = ($this->counters[$key] ?? 0) + $value;
    }

    /**
     * Record domain service operation metrics
     */
    public function recordDomainServiceOperation(
        string $service,
        string $method,
        float $duration,
        array $context = []
    ): void {
        $this->recordMetric('domain_service.operation', $duration, [
            'service' => $service,
            'method' => $method,
            'status' => $context['status'] ?? 'success',
        ]);

        $this->incrementCounter('domain_service.calls', 1, [
            'service' => $service,
            'method' => $method,
        ]);
    }

    /**
     * Record event processing metrics
     */
    public function recordEventProcessing(
        string $eventType,
        float $duration,
        bool $success = true,
        array $context = []
    ): void {
        $this->recordMetric('event.processing_time', $duration, [
            'event_type' => $eventType,
            'status' => $success ? 'success' : 'failed',
        ]);

        $this->incrementCounter('event.processed', 1, [
            'event_type' => $eventType,
            'status' => $success ? 'success' : 'failed',
        ]);

        if (!$success && isset($context['error'])) {
            $this->recordMetric('event.error', 1, [
                'event_type' => $eventType,
                'error_type' => $context['error_type'] ?? 'unknown',
            ]);
        }
    }

    /**
     * Record database operation metrics
     */
    public function recordDatabaseOperation(
        string $operation,
        string $table,
        float $duration,
        int $affectedRows = 0
    ): void {
        $this->recordMetric('database.operation_time', $duration, [
            'operation' => $operation,
            'table' => $table,
        ]);

        $this->recordMetric('database.affected_rows', $affectedRows, [
            'operation' => $operation,
            'table' => $table,
        ]);

        $this->incrementCounter('database.operations', 1, [
            'operation' => $operation,
            'table' => $table,
        ]);
    }

    /**
     * Get performance summary for a time period
     */
    public function getPerformanceSummary(int $minutes = 60): array
    {
        $cacheKey = "performance_summary_{$minutes}min_" . $this->getCurrentTenantId();
        
        return Cache::remember($cacheKey, 300, function () use ($minutes) {
            $since = now()->subMinutes($minutes);
            
            return [
                'period' => "{$minutes} minutes",
                'tenant_id' => $this->getCurrentTenantId(),
                'domain_services' => $this->getDomainServiceMetrics($since),
                'events' => $this->getEventMetrics($since),
                'database' => $this->getDatabaseMetrics($since),
                'system' => $this->getSystemMetrics($since),
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Get slow operations report
     */
    public function getSlowOperations(int $thresholdMs = 1000, int $limit = 50): array
    {
        $cacheKey = "slow_operations_{$thresholdMs}ms_" . $this->getCurrentTenantId();
        
        return Cache::remember($cacheKey, 300, function () use ($thresholdMs, $limit) {
            // This would typically query a metrics database
            // For now, we'll return recent slow operations from memory
            $slowOps = [];
            
            foreach ($this->metrics as $metric) {
                if ($metric['name'] === 'domain_service.operation' && $metric['value'] > $thresholdMs) {
                    $slowOps[] = [
                        'operation' => $metric['tags']['service'] . '::' . $metric['tags']['method'],
                        'duration_ms' => $metric['value'],
                        'timestamp' => $metric['timestamp'],
                        'tenant_id' => $metric['tags']['tenant_id'],
                    ];
                }
            }
            
            // Sort by duration descending
            usort($slowOps, fn($a, $b) => $b['duration_ms'] <=> $a['duration_ms']);
            
            return array_slice($slowOps, 0, $limit);
        });
    }

    /**
     * Get current performance status
     */
    public function getCurrentStatus(): array
    {
        return [
            'monitoring_enabled' => $this->enabled,
            'active_timers' => count($this->timers),
            'metrics_buffer_size' => count($this->metrics),
            'counters_count' => count($this->counters),
            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'tenant_id' => $this->getCurrentTenantId(),
        ];
    }

    /**
     * Flush all metrics to storage
     */
    public function flushMetrics(): void
    {
        if (empty($this->metrics) && empty($this->counters)) {
            return;
        }

        try {
            // Store metrics in database or external service
            $this->storeMetrics($this->metrics, $this->counters);
            
            // Clear buffers
            $this->metrics = [];
            $this->counters = [];
            
        } catch (\Exception $e) {
            Log::error('Failed to flush performance metrics', [
                'error' => $e->getMessage(),
                'metrics_count' => count($this->metrics),
                'counters_count' => count($this->counters),
            ]);
        }
    }

    /**
     * Enable or disable monitoring
     */
    public function setEnabled(bool $enabled): void
    {
        $this->enabled = $enabled;
        
        if (!$enabled) {
            $this->timers = [];
            $this->metrics = [];
            $this->counters = [];
        }
    }

    private function generateTimerId(string $operation): string
    {
        return $operation . '_' . uniqid() . '_' . microtime(true);
    }

    private function getCurrentTenantId(): ?string
    {
        // This would integrate with your tenant resolution system
        return session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }

    private function getCurrentModule(): string
    {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10);
        
        foreach ($trace as $frame) {
            if (isset($frame['class']) && str_contains($frame['class'], 'Modules\\')) {
                $parts = explode('\\', $frame['class']);
                if (count($parts) >= 2 && $parts[0] === 'Modules') {
                    return $parts[1];
                }
            }
        }
        
        return 'unknown';
    }

    private function extractModuleFromContext(array $context): string
    {
        return $context['module'] ?? $this->getCurrentModule();
    }

    private function getQueryCount(): int
    {
        return count(DB::getQueryLog());
    }

    private function recordMetrics(array $metrics): void
    {
        $this->metrics[] = $metrics;
        $this->flushMetricsIfNeeded();
        
        // Log slow operations
        if ($metrics['duration_ms'] > 1000) {
            Log::warning('Slow operation detected', $metrics);
        }
    }

    private function flushMetricsIfNeeded(): void
    {
        $maxBufferSize = config('tenant.monitoring.metrics.buffer_size', 100);
        
        if (count($this->metrics) >= $maxBufferSize) {
            $this->flushMetrics();
        }
    }

    private function buildCounterKey(string $name, array $tags): string
    {
        $tagString = '';
        if (!empty($tags)) {
            ksort($tags);
            $tagString = '_' . md5(serialize($tags));
        }
        
        return $name . $tagString;
    }

    private function storeMetrics(array $metrics, array $counters): void
    {
        // In a production environment, this would store to:
        // - Time series database (InfluxDB, Prometheus)
        // - Logging service (ELK stack)
        // - Monitoring service (DataDog, New Relic)
        
        // For now, we'll log to Laravel's logging system
        if (!empty($metrics)) {
            Log::channel('performance')->info('Performance metrics batch', [
                'metrics_count' => count($metrics),
                'tenant_id' => $this->getCurrentTenantId(),
                'metrics' => $metrics,
            ]);
        }
        
        if (!empty($counters)) {
            Log::channel('performance')->info('Performance counters batch', [
                'counters_count' => count($counters),
                'tenant_id' => $this->getCurrentTenantId(),
                'counters' => $counters,
            ]);
        }
    }

    private function getDomainServiceMetrics(\DateTimeInterface $since): array
    {
        // This would query stored metrics
        return [
            'total_operations' => 0,
            'average_duration_ms' => 0,
            'slowest_operation' => null,
            'error_rate' => 0,
        ];
    }

    private function getEventMetrics(\DateTimeInterface $since): array
    {
        return [
            'total_events' => 0,
            'average_processing_time_ms' => 0,
            'success_rate' => 100,
            'failed_events' => 0,
        ];
    }

    private function getDatabaseMetrics(\DateTimeInterface $since): array
    {
        return [
            'total_queries' => 0,
            'average_query_time_ms' => 0,
            'slow_queries' => 0,
            'most_queried_table' => null,
        ];
    }

    private function getSystemMetrics(\DateTimeInterface $since): array
    {
        return [
            'average_memory_usage_mb' => 0,
            'peak_memory_usage_mb' => 0,
            'average_cpu_usage' => 0,
        ];
    }
}
