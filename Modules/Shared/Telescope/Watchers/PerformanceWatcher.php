<?php

namespace Modules\Shared\Telescope\Watchers;

use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\Watchers\Watcher;
use Modules\Shared\Services\PerformanceMonitor;
use Illuminate\Foundation\Http\Events\RequestHandled;

class PerformanceWatcher extends Watcher
{
    private PerformanceMonitor $performanceMonitor;
    private array $activeTimers = [];

    public function __construct(array $options = [])
    {
        parent::__construct($options);
        $this->performanceMonitor = app(PerformanceMonitor::class);
    }

    /**
     * Register the watcher.
     */
    public function register($app): void
    {
        $app['events']->listen(RequestHandled::class, [$this, 'recordPerformanceMetrics']);
        
        // Listen for custom performance events
        $app['events']->listen('performance.operation.started', [$this, 'recordOperationStart']);
        $app['events']->listen('performance.operation.completed', [$this, 'recordOperationComplete']);
        $app['events']->listen('performance.slow.operation', [$this, 'recordSlowOperation']);
    }

    /**
     * Record performance metrics for the request.
     */
    public function recordPerformanceMetrics(RequestHandled $event): void
    {
        if (!$this->shouldRecord($event)) {
            return;
        }

        $performanceData = $this->gatherPerformanceData($event);
        
        if ($this->isSlowOperation($performanceData)) {
            $this->recordSlowOperation($performanceData);
        }

        Telescope::recordPerformance(IncomingEntry::make($performanceData)->tags([
            'performance',
            'tenant:' . $this->getCurrentTenantId(),
            'slow:' . ($this->isSlowOperation($performanceData) ? 'yes' : 'no'),
        ]));
    }

    /**
     * Record operation start.
     */
    public function recordOperationStart($event): void
    {
        if (!$this->shouldRecordOperation($event)) {
            return;
        }

        $this->activeTimers[$event['operation_id']] = [
            'operation' => $event['operation'],
            'context' => $event['context'] ?? [],
            'start_time' => microtime(true),
            'start_memory' => memory_get_usage(true),
            'tenant_id' => $this->getCurrentTenantId(),
        ];
    }

    /**
     * Record operation completion.
     */
    public function recordOperationComplete($event): void
    {
        if (!$this->shouldRecordOperation($event) || !isset($this->activeTimers[$event['operation_id']])) {
            return;
        }

        $timer = $this->activeTimers[$event['operation_id']];
        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);

        $performanceData = [
            'operation_id' => $event['operation_id'],
            'operation' => $timer['operation'],
            'context' => $timer['context'],
            'duration_ms' => round(($endTime - $timer['start_time']) * 1000, 2),
            'memory_used_mb' => round(($endMemory - $timer['start_memory']) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'tenant_id' => $timer['tenant_id'],
            'status' => $event['status'] ?? 'completed',
            'error' => $event['error'] ?? null,
        ];

        Telescope::recordDomainOperation(IncomingEntry::make($performanceData)->tags([
            'domain-operation',
            'operation:' . $timer['operation'],
            'tenant:' . $timer['tenant_id'],
            'status:' . ($event['status'] ?? 'completed'),
            'slow:' . ($performanceData['duration_ms'] > ($this->options['slow_threshold'] ?? 1000) ? 'yes' : 'no'),
        ]));

        unset($this->activeTimers[$event['operation_id']]);
    }

    /**
     * Record slow operation.
     */
    public function recordSlowOperation($data): void
    {
        $slowThreshold = $this->options['slow_threshold'] ?? 1000;
        
        if (is_array($data) && ($data['duration_ms'] ?? 0) > $slowThreshold) {
            Telescope::recordSlowOperation(IncomingEntry::make([
                'operation' => $data['operation'] ?? 'unknown',
                'duration_ms' => $data['duration_ms'],
                'threshold_ms' => $slowThreshold,
                'context' => $data['context'] ?? [],
                'tenant_id' => $data['tenant_id'] ?? $this->getCurrentTenantId(),
                'memory_used_mb' => $data['memory_used_mb'] ?? 0,
                'detected_at' => now()->toISOString(),
            ])->tags([
                'slow-operation',
                'tenant:' . ($data['tenant_id'] ?? $this->getCurrentTenantId()),
                'severity:' . $this->getSlownessSeverity($data['duration_ms'], $slowThreshold),
            ]));
        }
    }

    /**
     * Gather performance data from the request.
     */
    private function gatherPerformanceData(RequestHandled $event): array
    {
        $startTime = $event->request->server('REQUEST_TIME_FLOAT');
        $endTime = microtime(true);
        $duration = $startTime ? round(($endTime - $startTime) * 1000, 2) : null;

        return [
            'request_uri' => $event->request->getRequestUri(),
            'request_method' => $event->request->getMethod(),
            'response_status' => $event->response->getStatusCode(),
            'duration_ms' => $duration,
            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'tenant_id' => $this->getCurrentTenantId(),
            'user_id' => $event->request->user()?->id,
            'query_count' => $this->getQueryCount(),
            'custom_metrics' => $this->getCustomMetrics(),
        ];
    }

    /**
     * Determine if the request should be recorded.
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

        return true;
    }

    /**
     * Determine if the operation should be recorded.
     */
    private function shouldRecordOperation($event): bool
    {
        if (!$this->options['enabled'] ?? true) {
            return false;
        }

        return isset($event['operation']) && isset($event['operation_id']);
    }

    /**
     * Check if operation is slow.
     */
    private function isSlowOperation(array $data): bool
    {
        $threshold = $this->options['slow_threshold'] ?? 1000;
        return ($data['duration_ms'] ?? 0) > $threshold;
    }

    /**
     * Get slowness severity level.
     */
    private function getSlownessSeverity(float $duration, float $threshold): string
    {
        $ratio = $duration / $threshold;
        
        if ($ratio > 5) return 'critical';
        if ($ratio > 3) return 'high';
        if ($ratio > 2) return 'medium';
        return 'low';
    }

    /**
     * Get current tenant ID.
     */
    private function getCurrentTenantId(): ?string
    {
        return session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }

    /**
     * Get query count from performance monitor.
     */
    private function getQueryCount(): int
    {
        return count(\DB::getQueryLog());
    }

    /**
     * Get custom metrics from performance monitor.
     */
    private function getCustomMetrics(): array
    {
        return $this->performanceMonitor->getCurrentStatus();
    }
}
