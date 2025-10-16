<?php

namespace App\Shared\Events;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

abstract class QueueableDomainEvent extends DomainEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run before timing out.
     */
    public int $timeout = 60;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [10, 30, 60];

    /**
     * Determine if the job should be retried.
     */
    public bool $failOnTimeout = true;

    /**
     * Create a new queueable domain event instance.
     */
    public function __construct()
    {
        parent::__construct();

        // Configure queue settings based on event type
        $this->configureQueueSettings();

        // Set tenant-specific queue
        $this->setTenantQueue();
    }

    /**
     * Get the queue connection that should be used.
     */
    public function connection(): string
    {
        return config('queue.default', 'redis');
    }

    /**
     * Get the queue that should be used.
     */
    public function queue(): string
    {
        return $this->getQueueName();
    }

    /**
     * Handle the queued event.
     */
    public function handle(): void
    {
        $startTime = microtime(true);
        $tenantId = $this->getTenantId();

        try {
            // Set tenant context for queue processing
            $this->setTenantContext($tenantId);

            // Track queue job start
            $this->trackQueueJobStart();

            // Process the domain event
            $this->process();

            // Track successful completion
            $this->trackQueueJobSuccess($startTime);
        } catch (\Throwable $exception) {
            // Track failed job
            $this->trackQueueJobFailure($exception, $startTime);

            // Re-throw to let Laravel handle retry logic
            throw $exception;
        } finally {
            // Clean up tenant context
            $this->clearTenantContext();
        }
    }

    /**
     * Process the domain event (to be implemented by subclasses).
     */
    abstract protected function process(): void;

    /**
     * Configure queue settings based on event type.
     */
    protected function configureQueueSettings(): void
    {
        $eventType = $this->getEventType();
        $jobConfig = config("horizon.job_types.{$eventType}");

        if ($jobConfig) {
            $this->timeout = $jobConfig['timeout'] ?? $this->timeout;
            $this->tries = $jobConfig['tries'] ?? $this->tries;
            $this->backoff = $jobConfig['backoff'] ?? $this->backoff;
        }
    }

    /**
     * Set tenant-specific queue.
     */
    protected function setTenantQueue(): void
    {
        if (config('horizon.multi_tenant.enabled', true)) {
            $tenantId = $this->getTenantId();
            $queueName = $this->getBaseQueueName();
            $pattern = config('horizon.multi_tenant.queue_naming.pattern', 'tenant_{tenant_id}_{queue_name}');

            $tenantQueue = str_replace(
                ['{tenant_id}', '{queue_name}'],
                [$tenantId, $queueName],
                $pattern
            );

            $this->onQueue($tenantQueue);
        }
    }

    /**
     * Get the base queue name for this event type.
     */
    protected function getBaseQueueName(): string
    {
        $eventType = $this->getEventType();
        $jobConfig = config("horizon.job_types.{$eventType}");

        return $jobConfig['queue'] ?? 'default';
    }

    /**
     * Get the full queue name including tenant prefix.
     */
    protected function getQueueName(): string
    {
        if (config('horizon.multi_tenant.enabled', true)) {
            $tenantId = $this->getTenantId();
            $queueName = $this->getBaseQueueName();
            $pattern = config('horizon.multi_tenant.queue_naming.pattern', 'tenant_{tenant_id}_{queue_name}');

            return str_replace(
                ['{tenant_id}', '{queue_name}'],
                [$tenantId, $queueName],
                $pattern
            );
        }

        return $this->getBaseQueueName();
    }

    /**
     * Get the tenant ID for queue isolation.
     */
    protected function getTenantId(): string
    {
        return $this->getMetadata()['tenant_id'] ?? session('tenant_id') ?? request()->header('X-Tenant-ID') ?? 'default';
    }

    /**
     * Set tenant context for queue processing.
     */
    protected function setTenantContext(string $tenantId): void
    {
        // Set tenant context in session or application state
        session(['tenant_id' => $tenantId]);

        // You might also want to set database connection, etc.
        // This depends on your multi-tenant architecture
    }

    /**
     * Clear tenant context after processing.
     */
    protected function clearTenantContext(): void
    {
        session()->forget('tenant_id');
    }

    /**
     * Track queue job start for performance monitoring.
     */
    protected function trackQueueJobStart(): void
    {
        if (config('horizon.performance_monitoring.enabled', true)) {
            $performanceMonitor = app(config('horizon.performance_monitoring.performance_monitor'));

            $performanceMonitor->startTimer("queue_job.{$this->getEventType()}", [
                'event_id' => $this->getEventId(),
                'tenant_id' => $this->getTenantId(),
                'queue' => $this->getQueueName(),
                'attempt' => $this->attempts(),
            ]);
        }
    }

    /**
     * Track successful queue job completion.
     */
    protected function trackQueueJobSuccess(float $startTime): void
    {
        if (config('horizon.performance_monitoring.enabled', true)) {
            $performanceMonitor = app(config('horizon.performance_monitoring.performance_monitor'));
            $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

            $performanceMonitor->stopTimer("queue_job.{$this->getEventType()}");

            $performanceMonitor->recordMetric('queue_job_success', 1, [
                'event_type' => $this->getEventType(),
                'tenant_id' => $this->getTenantId(),
                'queue' => $this->getQueueName(),
                'duration_ms' => $duration,
            ]);
        }
    }

    /**
     * Track failed queue job.
     */
    protected function trackQueueJobFailure(\Throwable $exception, float $startTime): void
    {
        if (config('horizon.performance_monitoring.enabled', true)) {
            $performanceMonitor = app(config('horizon.performance_monitoring.performance_monitor'));
            $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

            $performanceMonitor->stopTimer("queue_job.{$this->getEventType()}");

            $performanceMonitor->recordMetric('queue_job_failure', 1, [
                'event_type' => $this->getEventType(),
                'tenant_id' => $this->getTenantId(),
                'queue' => $this->getQueueName(),
                'duration_ms' => $duration,
                'exception' => get_class($exception),
                'attempt' => $this->attempts(),
            ]);
        }
    }

    /**
     * Get the tags for this queue job.
     */
    public function tags(): array
    {
        return [
            'queue-job',
            'domain-event',
            'tenant:'.$this->getTenantId(),
            'event-type:'.$this->getEventType(),
            'aggregate-type:'.$this->getAggregateType(),
            'queue:'.$this->getQueueName(),
        ];
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        // Log the failure
        logger()->error('Queue job failed', [
            'event_id' => $this->getEventId(),
            'event_type' => $this->getEventType(),
            'tenant_id' => $this->getTenantId(),
            'queue' => $this->getQueueName(),
            'attempts' => $this->attempts(),
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Broadcast failure notification if enabled
        if (config('horizon.performance_monitoring.reverb_broadcasting', true)) {
            $this->broadcastJobFailure($exception);
        }
    }

    /**
     * Broadcast job failure notification.
     */
    protected function broadcastJobFailure(\Throwable $exception): void
    {
        // This would integrate with your broadcasting system
        // to notify administrators of job failures
    }

    /**
     * Determine the time at which the job should timeout.
     */
    public function retryUntil(): \DateTime
    {
        return now()->addMinutes(10);
    }
}
