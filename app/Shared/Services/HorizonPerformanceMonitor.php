<?php

namespace App\Shared\Services;

use Laravel\Horizon\Contracts\JobRepository;
use Laravel\Horizon\Contracts\MetricsRepository;
use Laravel\Horizon\Contracts\SupervisorRepository;
use Laravel\Horizon\Contracts\WorkloadRepository;

class HorizonPerformanceMonitor
{
    private JobRepository $jobRepository;

    private MetricsRepository $metricsRepository;

    private SupervisorRepository $supervisorRepository;

    private WorkloadRepository $workloadRepository;

    private PerformanceMonitor $performanceMonitor;

    public function __construct(
        JobRepository $jobRepository,
        MetricsRepository $metricsRepository,
        SupervisorRepository $supervisorRepository,
        WorkloadRepository $workloadRepository,
        PerformanceMonitor $performanceMonitor
    ) {
        $this->jobRepository = $jobRepository;
        $this->metricsRepository = $metricsRepository;
        $this->supervisorRepository = $supervisorRepository;
        $this->workloadRepository = $workloadRepository;
        $this->performanceMonitor = $performanceMonitor;
    }

    /**
     * Get comprehensive queue performance metrics.
     */
    public function getQueuePerformanceMetrics(int $minutes = 60): array
    {
        $since = now()->subMinutes($minutes);

        return [
            'period' => [
                'minutes' => $minutes,
                'from' => $since->toISOString(),
                'to' => now()->toISOString(),
            ],
            'queue_metrics' => $this->getQueueMetrics($since),
            'job_metrics' => $this->getJobMetrics($since),
            'supervisor_metrics' => $this->getSupervisorMetrics(),
            'workload_metrics' => $this->getWorkloadMetrics(),
            'tenant_metrics' => $this->getTenantQueueMetrics($since),
            'performance_alerts' => $this->getQueuePerformanceAlerts(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Get queue-specific metrics.
     */
    private function getQueueMetrics(\DateTime $since): array
    {
        $queues = $this->getActiveQueues();
        $metrics = [];

        foreach ($queues as $queue) {
            $queueMetrics = $this->metricsRepository->queueMetrics($queue, $since);

            $metrics[$queue] = [
                'throughput' => $queueMetrics['throughput'] ?? 0,
                'runtime' => $queueMetrics['runtime'] ?? 0,
                'wait_time' => $this->getQueueWaitTime($queue),
                'jobs_per_minute' => $queueMetrics['jobs_per_minute'] ?? 0,
                'pending_jobs' => $this->getPendingJobsCount($queue),
                'failed_jobs' => $this->getFailedJobsCount($queue, $since),
                'completed_jobs' => $this->getCompletedJobsCount($queue, $since),
                'average_runtime' => $queueMetrics['average_runtime'] ?? 0,
            ];
        }

        return $metrics;
    }

    /**
     * Get job-specific metrics.
     */
    private function getJobMetrics(\DateTime $since): array
    {
        $recentJobs = $this->jobRepository->getRecent();
        $failedJobs = $this->jobRepository->getFailed();

        return [
            'total_processed' => count($recentJobs),
            'total_failed' => count($failedJobs),
            'failure_rate' => $this->calculateFailureRate($recentJobs, $failedJobs),
            'average_runtime' => $this->calculateAverageRuntime($recentJobs),
            'longest_runtime' => $this->getLongestRuntime($recentJobs),
            'job_types' => $this->getJobTypeMetrics($recentJobs),
            'retry_statistics' => $this->getRetryStatistics($failedJobs),
        ];
    }

    /**
     * Get supervisor metrics.
     */
    private function getSupervisorMetrics(): array
    {
        $supervisors = $this->supervisorRepository->all();
        $metrics = [];

        foreach ($supervisors as $supervisor) {
            $metrics[$supervisor->name] = [
                'status' => $supervisor->status,
                'processes' => $supervisor->processes,
                'options' => $supervisor->options,
                'memory_usage' => $this->getSupervisorMemoryUsage($supervisor),
                'uptime' => $this->getSupervisorUptime($supervisor),
            ];
        }

        return $metrics;
    }

    /**
     * Get workload metrics.
     */
    private function getWorkloadMetrics(): array
    {
        $workload = $this->workloadRepository->get();

        return [
            'queues' => $workload,
            'total_load' => array_sum($workload),
            'queue_distribution' => $this->calculateQueueDistribution($workload),
            'load_balance_score' => $this->calculateLoadBalanceScore($workload),
        ];
    }

    /**
     * Get tenant-specific queue metrics.
     */
    private function getTenantQueueMetrics(\DateTime $since): array
    {
        if (! config('horizon.multi_tenant.enabled', true)) {
            return [];
        }

        $tenantMetrics = [];
        $tenantQueues = $this->getTenantQueues();

        foreach ($tenantQueues as $tenantId => $queues) {
            $tenantMetrics[$tenantId] = [
                'queues' => $queues,
                'total_jobs' => $this->getTenantJobCount($tenantId, $since),
                'failed_jobs' => $this->getTenantFailedJobCount($tenantId, $since),
                'average_wait_time' => $this->getTenantAverageWaitTime($tenantId),
                'throughput' => $this->getTenantThroughput($tenantId, $since),
            ];
        }

        return $tenantMetrics;
    }

    /**
     * Get queue performance alerts.
     */
    private function getQueuePerformanceAlerts(): array
    {
        $alerts = [];
        $config = config('horizon.performance_monitoring.alerts', []);

        // Check for long wait times
        if (isset($config['long_wait_threshold'])) {
            $longWaitQueues = $this->getQueuesWithLongWaitTimes($config['long_wait_threshold']);
            foreach ($longWaitQueues as $queue => $waitTime) {
                $alerts[] = [
                    'type' => 'long_wait_time',
                    'severity' => 'warning',
                    'queue' => $queue,
                    'wait_time' => $waitTime,
                    'threshold' => $config['long_wait_threshold'],
                    'message' => "Queue '{$queue}' has high wait time: {$waitTime}s",
                ];
            }
        }

        // Check for high failure rates
        if (isset($config['high_failure_rate'])) {
            $highFailureQueues = $this->getQueuesWithHighFailureRate($config['high_failure_rate']);
            foreach ($highFailureQueues as $queue => $failureRate) {
                $alerts[] = [
                    'type' => 'high_failure_rate',
                    'severity' => 'error',
                    'queue' => $queue,
                    'failure_rate' => $failureRate,
                    'threshold' => $config['high_failure_rate'],
                    'message' => "Queue '{$queue}' has high failure rate: ".($failureRate * 100).'%',
                ];
            }
        }

        // Check for memory usage
        if (isset($config['memory_threshold'])) {
            $highMemorySupervisors = $this->getSupervisorsWithHighMemoryUsage($config['memory_threshold']);
            foreach ($highMemorySupervisors as $supervisor => $memoryUsage) {
                $alerts[] = [
                    'type' => 'high_memory_usage',
                    'severity' => 'warning',
                    'supervisor' => $supervisor,
                    'memory_usage' => $memoryUsage,
                    'threshold' => $config['memory_threshold'],
                    'message' => "Supervisor '{$supervisor}' has high memory usage: ".($memoryUsage * 100).'%',
                ];
            }
        }

        return $alerts;
    }

    /**
     * Integrate with existing performance monitor.
     */
    public function integrateWithPerformanceMonitor(): void
    {
        $queueMetrics = $this->getQueuePerformanceMetrics(5); // Last 5 minutes

        // Record queue metrics in the performance monitor
        foreach ($queueMetrics['queue_metrics'] as $queue => $metrics) {
            $this->performanceMonitor->recordMetric("queue.{$queue}.throughput", $metrics['throughput'], [
                'queue' => $queue,
                'type' => 'queue_metric',
            ]);

            $this->performanceMonitor->recordMetric("queue.{$queue}.wait_time", $metrics['wait_time'], [
                'queue' => $queue,
                'type' => 'queue_metric',
            ]);

            $this->performanceMonitor->recordMetric("queue.{$queue}.pending_jobs", $metrics['pending_jobs'], [
                'queue' => $queue,
                'type' => 'queue_metric',
            ]);
        }

        // Record overall job metrics
        $jobMetrics = $queueMetrics['job_metrics'];
        $this->performanceMonitor->recordMetric('queue.total_processed', $jobMetrics['total_processed']);
        $this->performanceMonitor->recordMetric('queue.total_failed', $jobMetrics['total_failed']);
        $this->performanceMonitor->recordMetric('queue.failure_rate', $jobMetrics['failure_rate']);
        $this->performanceMonitor->recordMetric('queue.average_runtime', $jobMetrics['average_runtime']);
    }

    /**
     * Get active queues.
     */
    private function getActiveQueues(): array
    {
        $workload = $this->workloadRepository->get();

        return array_keys($workload);
    }

    /**
     * Get queue wait time.
     */
    private function getQueueWaitTime(string $queue): float
    {
        // This would need to be implemented based on your queue monitoring setup
        return 0.0;
    }

    /**
     * Get pending jobs count for a queue.
     */
    private function getPendingJobsCount(string $queue): int
    {
        // This would need to be implemented based on your queue setup
        return 0;
    }

    /**
     * Get failed jobs count for a queue.
     */
    private function getFailedJobsCount(string $queue, \DateTime $since): int
    {
        $failedJobs = $this->jobRepository->getFailed();

        return count(array_filter($failedJobs, function ($job) use ($queue, $since) {
            return $job->queue === $queue && $job->failed_at >= $since;
        }));
    }

    /**
     * Get completed jobs count for a queue.
     */
    private function getCompletedJobsCount(string $queue, \DateTime $since): int
    {
        $recentJobs = $this->jobRepository->getRecent();

        return count(array_filter($recentJobs, function ($job) use ($queue, $since) {
            return $job->queue === $queue && $job->completed_at >= $since;
        }));
    }

    /**
     * Calculate failure rate.
     */
    private function calculateFailureRate(array $recentJobs, array $failedJobs): float
    {
        $totalJobs = count($recentJobs) + count($failedJobs);

        return $totalJobs > 0 ? count($failedJobs) / $totalJobs : 0.0;
    }

    /**
     * Calculate average runtime.
     */
    private function calculateAverageRuntime(array $jobs): float
    {
        if (empty($jobs)) {
            return 0.0;
        }

        $totalRuntime = array_sum(array_map(function ($job) {
            return $job->runtime ?? 0;
        }, $jobs));

        return $totalRuntime / count($jobs);
    }

    /**
     * Get longest runtime.
     */
    private function getLongestRuntime(array $jobs): float
    {
        if (empty($jobs)) {
            return 0.0;
        }

        return max(array_map(function ($job) {
            return $job->runtime ?? 0;
        }, $jobs));
    }

    /**
     * Get job type metrics.
     */
    private function getJobTypeMetrics(array $jobs): array
    {
        $jobTypes = [];

        foreach ($jobs as $job) {
            $jobType = $job->name ?? 'unknown';
            if (! isset($jobTypes[$jobType])) {
                $jobTypes[$jobType] = [
                    'count' => 0,
                    'total_runtime' => 0,
                    'average_runtime' => 0,
                ];
            }

            $jobTypes[$jobType]['count']++;
            $jobTypes[$jobType]['total_runtime'] += $job->runtime ?? 0;
            $jobTypes[$jobType]['average_runtime'] = $jobTypes[$jobType]['total_runtime'] / $jobTypes[$jobType]['count'];
        }

        return $jobTypes;
    }

    /**
     * Get retry statistics.
     */
    private function getRetryStatistics(array $failedJobs): array
    {
        $retryStats = [
            'total_retries' => 0,
            'jobs_with_retries' => 0,
            'average_retries' => 0,
        ];

        foreach ($failedJobs as $job) {
            $attempts = $job->attempts ?? 1;
            if ($attempts > 1) {
                $retryStats['jobs_with_retries']++;
                $retryStats['total_retries'] += ($attempts - 1);
            }
        }

        if ($retryStats['jobs_with_retries'] > 0) {
            $retryStats['average_retries'] = $retryStats['total_retries'] / $retryStats['jobs_with_retries'];
        }

        return $retryStats;
    }

    /**
     * Get supervisor memory usage.
     */
    private function getSupervisorMemoryUsage($supervisor): float
    {
        // This would need to be implemented based on system monitoring
        return 0.0;
    }

    /**
     * Get supervisor uptime.
     */
    private function getSupervisorUptime($supervisor): int
    {
        // This would need to be implemented based on supervisor data
        return 0;
    }

    /**
     * Calculate queue distribution.
     */
    private function calculateQueueDistribution(array $workload): array
    {
        $total = array_sum($workload);
        $distribution = [];

        foreach ($workload as $queue => $load) {
            $distribution[$queue] = $total > 0 ? $load / $total : 0;
        }

        return $distribution;
    }

    /**
     * Calculate load balance score.
     */
    private function calculateLoadBalanceScore(array $workload): float
    {
        if (empty($workload)) {
            return 1.0;
        }

        $values = array_values($workload);
        $mean = array_sum($values) / count($values);

        if ($mean == 0) {
            return 1.0;
        }

        $variance = array_sum(array_map(function ($value) use ($mean) {
            return pow($value - $mean, 2);
        }, $values)) / count($values);

        $coefficient_of_variation = sqrt($variance) / $mean;

        // Return a score between 0 and 1, where 1 is perfectly balanced
        return max(0, 1 - $coefficient_of_variation);
    }

    /**
     * Get tenant queues.
     */
    private function getTenantQueues(): array
    {
        // This would need to be implemented based on your tenant queue naming strategy
        return [];
    }

    /**
     * Get tenant job count.
     */
    private function getTenantJobCount(string $tenantId, \DateTime $since): int
    {
        // This would need to be implemented based on your tenant job tracking
        return 0;
    }

    /**
     * Get tenant failed job count.
     */
    private function getTenantFailedJobCount(string $tenantId, \DateTime $since): int
    {
        // This would need to be implemented based on your tenant job tracking
        return 0;
    }

    /**
     * Get tenant average wait time.
     */
    private function getTenantAverageWaitTime(string $tenantId): float
    {
        // This would need to be implemented based on your tenant queue monitoring
        return 0.0;
    }

    /**
     * Get tenant throughput.
     */
    private function getTenantThroughput(string $tenantId, \DateTime $since): float
    {
        // This would need to be implemented based on your tenant job tracking
        return 0.0;
    }

    /**
     * Get queues with long wait times.
     */
    private function getQueuesWithLongWaitTimes(int $threshold): array
    {
        // This would need to be implemented based on your queue monitoring
        return [];
    }

    /**
     * Get queues with high failure rate.
     */
    private function getQueuesWithHighFailureRate(float $threshold): array
    {
        // This would need to be implemented based on your queue monitoring
        return [];
    }

    /**
     * Get supervisors with high memory usage.
     */
    private function getSupervisorsWithHighMemoryUsage(float $threshold): array
    {
        // This would need to be implemented based on your system monitoring
        return [];
    }
}
