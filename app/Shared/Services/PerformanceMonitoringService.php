<?php

namespace App\Shared\Services;

use App\Shared\Services\BaseService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Exception;

/**
 * Advanced performance monitoring service
 */
class PerformanceMonitoringService extends BaseService
{
    protected array $metrics = [];
    protected array $thresholds = [];
    protected array $alerts = [];

    public function __construct()
    {
        parent::__construct();
        $this->loadThresholds();
        $this->configureCaching();
    }

    /**
     * Get service name
     */
    protected function getServiceName(): string
    {
        return 'PerformanceMonitoring';
    }

    /**
     * Load performance thresholds
     */
    protected function loadThresholds(): void
    {
        $this->thresholds = [
            'response_time' => [
                'warning' => config('performance.thresholds.response_time.warning', 1000), // 1 second
                'critical' => config('performance.thresholds.response_time.critical', 3000), // 3 seconds
            ],
            'memory_usage' => [
                'warning' => config('performance.thresholds.memory_usage.warning', 0.7), // 70%
                'critical' => config('performance.thresholds.memory_usage.critical', 0.9), // 90%
            ],
            'database_queries' => [
                'warning' => config('performance.thresholds.database_queries.warning', 50),
                'critical' => config('performance.thresholds.database_queries.critical', 100),
            ],
            'cache_hit_rate' => [
                'warning' => config('performance.thresholds.cache_hit_rate.warning', 0.8), // 80%
                'critical' => config('performance.thresholds.cache_hit_rate.critical', 0.6), // 60%
            ],
        ];
    }

    /**
     * Configure caching for this service
     */
    protected function configureCaching(): void
    {
        $this->setCacheConfig([
            'default_ttl' => 300, // 5 minutes
            'cacheable_methods' => [
                'getSystemMetrics',
                'getDatabaseMetrics',
                'getCacheMetrics',
                'getApplicationMetrics',
            ],
            'method_ttl' => [
                'getSystemMetrics' => 60, // 1 minute
                'getDatabaseMetrics' => 120, // 2 minutes
                'getCacheMetrics' => 60, // 1 minute
                'getApplicationMetrics' => 180, // 3 minutes
            ],
        ]);
    }

    /**
     * Collect comprehensive performance metrics
     */
    public function collectMetrics(): array
    {
        $startTime = microtime(true);

        try {
            $metrics = [
                'timestamp' => now()->toISOString(),
                'system' => $this->getSystemMetrics(),
                'database' => $this->getDatabaseMetrics(),
                'cache' => $this->getCacheMetrics(),
                'application' => $this->getApplicationMetrics(),
                'custom' => $this->getCustomMetrics(),
            ];

            $metrics['collection_time'] = microtime(true) - $startTime;
            $metrics['alerts'] = $this->analyzeMetrics($metrics);

            // Store metrics for historical analysis
            $this->storeMetrics($metrics);

            return $metrics;
        } catch (Exception $e) {
            $this->logError('Failed to collect performance metrics', $e);
            throw $e;
        }
    }

    /**
     * Get system-level metrics
     */
    public function getSystemMetrics(): array
    {
        return $this->cached('getSystemMetrics', [], function () {
            return [
                'memory' => [
                    'current_usage' => memory_get_usage(true),
                    'peak_usage' => memory_get_peak_usage(true),
                    'limit' => $this->parseMemoryLimit(ini_get('memory_limit')),
                    'usage_percentage' => $this->calculateMemoryUsagePercentage(),
                ],
                'cpu' => [
                    'load_average' => $this->getLoadAverage(),
                    'process_count' => $this->getProcessCount(),
                ],
                'disk' => [
                    'free_space' => disk_free_space('/'),
                    'total_space' => disk_total_space('/'),
                    'usage_percentage' => $this->calculateDiskUsagePercentage(),
                ],
                'php' => [
                    'version' => PHP_VERSION,
                    'max_execution_time' => ini_get('max_execution_time'),
                    'max_input_time' => ini_get('max_input_time'),
                    'opcache_enabled' => function_exists('opcache_get_status'),
                    'opcache_stats' => $this->getOpcacheStats(),
                ],
            ];
        });
    }

    /**
     * Get database performance metrics
     */
    public function getDatabaseMetrics(): array
    {
        return $this->cached('getDatabaseMetrics', [], function () {
            $connectionName = config('database.default');
            
            return [
                'connection' => $connectionName,
                'queries' => [
                    'total_count' => $this->getTotalQueryCount(),
                    'slow_queries' => $this->getSlowQueryCount(),
                    'average_execution_time' => $this->getAverageQueryTime(),
                ],
                'connections' => [
                    'active_connections' => $this->getActiveConnectionCount(),
                    'max_connections' => $this->getMaxConnectionCount(),
                    'connection_pool_usage' => $this->getConnectionPoolUsage(),
                ],
                'tables' => [
                    'largest_tables' => $this->getLargestTables(),
                    'table_locks' => $this->getTableLocks(),
                    'index_usage' => $this->getIndexUsageStats(),
                ],
                'performance' => [
                    'buffer_pool_hit_rate' => $this->getBufferPoolHitRate(),
                    'query_cache_hit_rate' => $this->getQueryCacheHitRate(),
                ],
            ];
        });
    }

    /**
     * Get cache performance metrics
     */
    public function getCacheMetrics(): array
    {
        return $this->cached('getCacheMetrics', [], function () {
            return [
                'redis' => $this->getRedisMetrics(),
                'application_cache' => $this->getApplicationCacheMetrics(),
                'opcache' => $this->getOpcacheMetrics(),
                'overall' => [
                    'hit_rate' => $this->calculateOverallCacheHitRate(),
                    'miss_rate' => $this->calculateOverallCacheMissRate(),
                    'total_keys' => $this->getTotalCacheKeys(),
                    'memory_usage' => $this->getCacheMemoryUsage(),
                ],
            ];
        });
    }

    /**
     * Get application-specific metrics
     */
    public function getApplicationMetrics(): array
    {
        return $this->cached('getApplicationMetrics', [], function () {
            return [
                'laravel' => [
                    'version' => app()->version(),
                    'environment' => app()->environment(),
                    'debug_mode' => config('app.debug'),
                    'queue_size' => $this->getQueueSize(),
                    'failed_jobs' => $this->getFailedJobsCount(),
                ],
                'features' => [
                    'dashboard' => $this->getDashboardMetrics(),
                    'accounting' => $this->getAccountingMetrics(),
                    'inventory' => $this->getInventoryMetrics(),
                ],
                'api' => [
                    'requests_per_minute' => $this->getApiRequestsPerMinute(),
                    'average_response_time' => $this->getAverageApiResponseTime(),
                    'error_rate' => $this->getApiErrorRate(),
                ],
                'users' => [
                    'active_sessions' => $this->getActiveSessionCount(),
                    'concurrent_users' => $this->getConcurrentUserCount(),
                ],
            ];
        });
    }

    /**
     * Get custom application metrics
     */
    protected function getCustomMetrics(): array
    {
        return [
            'business_metrics' => [
                'total_organizations' => $this->getTotalOrganizations(),
                'active_users_today' => $this->getActiveUsersToday(),
                'transactions_processed_today' => $this->getTransactionsProcessedToday(),
                'dashboard_widgets_created' => $this->getDashboardWidgetsCreated(),
            ],
            'performance_indicators' => [
                'dashboard_load_time' => $this->getDashboardLoadTime(),
                'report_generation_time' => $this->getReportGenerationTime(),
                'data_export_time' => $this->getDataExportTime(),
            ],
        ];
    }

    /**
     * Analyze metrics and generate alerts
     */
    protected function analyzeMetrics(array $metrics): array
    {
        $alerts = [];

        // Check response time
        if (isset($metrics['application']['api']['average_response_time'])) {
            $responseTime = $metrics['application']['api']['average_response_time'];
            if ($responseTime > $this->thresholds['response_time']['critical']) {
                $alerts[] = [
                    'type' => 'critical',
                    'metric' => 'response_time',
                    'value' => $responseTime,
                    'threshold' => $this->thresholds['response_time']['critical'],
                    'message' => 'API response time is critically high',
                ];
            } elseif ($responseTime > $this->thresholds['response_time']['warning']) {
                $alerts[] = [
                    'type' => 'warning',
                    'metric' => 'response_time',
                    'value' => $responseTime,
                    'threshold' => $this->thresholds['response_time']['warning'],
                    'message' => 'API response time is above warning threshold',
                ];
            }
        }

        // Check memory usage
        if (isset($metrics['system']['memory']['usage_percentage'])) {
            $memoryUsage = $metrics['system']['memory']['usage_percentage'];
            if ($memoryUsage > $this->thresholds['memory_usage']['critical']) {
                $alerts[] = [
                    'type' => 'critical',
                    'metric' => 'memory_usage',
                    'value' => $memoryUsage,
                    'threshold' => $this->thresholds['memory_usage']['critical'],
                    'message' => 'Memory usage is critically high',
                ];
            } elseif ($memoryUsage > $this->thresholds['memory_usage']['warning']) {
                $alerts[] = [
                    'type' => 'warning',
                    'metric' => 'memory_usage',
                    'value' => $memoryUsage,
                    'threshold' => $this->thresholds['memory_usage']['warning'],
                    'message' => 'Memory usage is above warning threshold',
                ];
            }
        }

        // Check cache hit rate
        if (isset($metrics['cache']['overall']['hit_rate'])) {
            $hitRate = $metrics['cache']['overall']['hit_rate'];
            if ($hitRate < $this->thresholds['cache_hit_rate']['critical']) {
                $alerts[] = [
                    'type' => 'critical',
                    'metric' => 'cache_hit_rate',
                    'value' => $hitRate,
                    'threshold' => $this->thresholds['cache_hit_rate']['critical'],
                    'message' => 'Cache hit rate is critically low',
                ];
            } elseif ($hitRate < $this->thresholds['cache_hit_rate']['warning']) {
                $alerts[] = [
                    'type' => 'warning',
                    'metric' => 'cache_hit_rate',
                    'value' => $hitRate,
                    'threshold' => $this->thresholds['cache_hit_rate']['warning'],
                    'message' => 'Cache hit rate is below warning threshold',
                ];
            }
        }

        return $alerts;
    }

    /**
     * Store metrics for historical analysis
     */
    protected function storeMetrics(array $metrics): void
    {
        try {
            // Store in cache for recent access
            $cacheKey = 'performance_metrics:' . date('Y-m-d-H-i');
            Cache::put($cacheKey, $metrics, 3600); // 1 hour

            // Store in database for long-term analysis
            DB::table('performance_metrics')->insert([
                'timestamp' => now(),
                'metrics' => json_encode($metrics),
                'alerts_count' => count($metrics['alerts'] ?? []),
                'created_at' => now(),
            ]);

            // Keep only last 7 days of detailed metrics
            DB::table('performance_metrics')
                ->where('created_at', '<', now()->subDays(7))
                ->delete();
        } catch (Exception $e) {
            Log::warning('Failed to store performance metrics: ' . $e->getMessage());
        }
    }

    /**
     * Get historical metrics
     */
    public function getHistoricalMetrics(int $hours = 24): array
    {
        try {
            return DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subHours($hours))
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'timestamp' => $record->timestamp,
                        'metrics' => json_decode($record->metrics, true),
                        'alerts_count' => $record->alerts_count,
                    ];
                })
                ->toArray();
        } catch (Exception $e) {
            Log::error('Failed to retrieve historical metrics: ' . $e->getMessage());
            return [];
        }
    }

    // Helper methods (placeholder implementations)
    protected function parseMemoryLimit(string $limit): int { return 134217728; } // 128MB default
    protected function calculateMemoryUsagePercentage(): float { return (memory_get_usage(true) / $this->parseMemoryLimit(ini_get('memory_limit'))) * 100; }
    protected function getLoadAverage(): array { return [0.1, 0.2, 0.3]; }
    protected function getProcessCount(): int { return 10; }
    protected function calculateDiskUsagePercentage(): float { return 50.0; }
    protected function getOpcacheStats(): array { return function_exists('opcache_get_status') ? opcache_get_status() : []; }
    protected function getTotalQueryCount(): int { return 100; }
    protected function getSlowQueryCount(): int { return 5; }
    protected function getAverageQueryTime(): float { return 0.05; }
    protected function getActiveConnectionCount(): int { return 10; }
    protected function getMaxConnectionCount(): int { return 100; }
    protected function getConnectionPoolUsage(): float { return 0.1; }
    protected function getLargestTables(): array { return []; }
    protected function getTableLocks(): int { return 0; }
    protected function getIndexUsageStats(): array { return []; }
    protected function getBufferPoolHitRate(): float { return 0.95; }
    protected function getQueryCacheHitRate(): float { return 0.85; }
    protected function getRedisMetrics(): array { return []; }
    protected function getApplicationCacheMetrics(): array { return []; }
    protected function getOpcacheMetrics(): array { return []; }
    protected function calculateOverallCacheHitRate(): float { return 0.9; }
    protected function calculateOverallCacheMissRate(): float { return 0.1; }
    protected function getTotalCacheKeys(): int { return 1000; }
    protected function getCacheMemoryUsage(): int { return 10485760; } // 10MB
    protected function getQueueSize(): int { return 5; }
    protected function getFailedJobsCount(): int { return 0; }
    protected function getDashboardMetrics(): array { return ['widgets_rendered' => 50]; }
    protected function getAccountingMetrics(): array { return ['transactions_processed' => 100]; }
    protected function getInventoryMetrics(): array { return ['products_updated' => 25]; }
    protected function getApiRequestsPerMinute(): int { return 120; }
    protected function getAverageApiResponseTime(): float { return 0.25; }
    protected function getApiErrorRate(): float { return 0.02; }
    protected function getActiveSessionCount(): int { return 50; }
    protected function getConcurrentUserCount(): int { return 25; }
    protected function getTotalOrganizations(): int { return 10; }
    protected function getActiveUsersToday(): int { return 100; }
    protected function getTransactionsProcessedToday(): int { return 500; }
    protected function getDashboardWidgetsCreated(): int { return 200; }
    protected function getDashboardLoadTime(): float { return 0.8; }
    protected function getReportGenerationTime(): float { return 2.5; }
    protected function getDataExportTime(): float { return 1.2; }
}
