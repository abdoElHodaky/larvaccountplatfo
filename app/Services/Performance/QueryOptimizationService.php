<?php

namespace App\Services\Performance;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Query Optimization Service
 * Provides database query optimization and caching strategies
 */
class QueryOptimizationService
{
    private const CACHE_PREFIX = 'query_cache:';
    private const DEFAULT_TTL = 300; // 5 minutes
    private const SLOW_QUERY_THRESHOLD = 1000; // 1 second in milliseconds

    /**
     * Cache a query result with automatic key generation
     */
    public static function cacheQuery(
        callable $queryCallback,
        array $tags = [],
        int $ttl = self::DEFAULT_TTL,
        string $customKey = null
    ) {
        $key = $customKey ?: self::generateCacheKey($queryCallback, $tags);
        
        return Cache::remember($key, $ttl, function () use ($queryCallback) {
            $startTime = microtime(true);
            $result = $queryCallback();
            $endTime = microtime(true);
            
            $executionTime = ($endTime - $startTime) * 1000;
            
            // Log slow queries
            if ($executionTime > self::SLOW_QUERY_THRESHOLD) {
                Log::warning('Slow query detected', [
                    'execution_time' => $executionTime,
                    'cache_key' => $key ?? 'unknown',
                ]);
            }
            
            return $result;
        });
    }

    /**
     * Optimized pagination with cursor-based pagination for large datasets
     */
    public static function optimizedPaginate(
        Builder $query,
        int $perPage = 15,
        string $cursorColumn = 'id',
        $cursor = null
    ) {
        // Clone query to avoid modifying original
        $optimizedQuery = clone $query;
        
        // Add cursor condition if provided
        if ($cursor) {
            $optimizedQuery->where($cursorColumn, '>', $cursor);
        }
        
        // Limit results and add one extra to check for next page
        $results = $optimizedQuery
            ->orderBy($cursorColumn)
            ->limit($perPage + 1)
            ->get();
        
        $hasNextPage = $results->count() > $perPage;
        
        if ($hasNextPage) {
            $results->pop(); // Remove the extra item
        }
        
        $nextCursor = $hasNextPage && $results->isNotEmpty() 
            ? $results->last()->{$cursorColumn}
            : null;
        
        return [
            'data' => $results,
            'has_next_page' => $hasNextPage,
            'next_cursor' => $nextCursor,
        ];
    }

    /**
     * Batch load related models to avoid N+1 queries
     */
    public static function batchLoadRelations($models, array $relations): void
    {
        if (empty($models) || empty($relations)) {
            return;
        }
        
        $collection = collect($models);
        $modelClass = get_class($collection->first());
        
        // Use Eloquent's load method for efficient batch loading
        $collection->load($relations);
    }

    /**
     * Optimize query with proper indexing hints
     */
    public static function optimizeWithIndexes(Builder $query, array $indexes = []): Builder
    {
        foreach ($indexes as $index) {
            if (is_array($index)) {
                // Composite index
                $query->orderBy(DB::raw('(' . implode(', ', $index) . ')'));
            } else {
                // Single column index
                $query->orderBy($index);
            }
        }
        
        return $query;
    }

    /**
     * Cache expensive aggregation queries
     */
    public static function cacheAggregation(
        Builder $query,
        string $aggregateFunction,
        string $column = '*',
        int $ttl = 600 // 10 minutes for aggregations
    ) {
        $cacheKey = self::CACHE_PREFIX . 'agg:' . md5(
            $query->toSql() . serialize($query->getBindings()) . $aggregateFunction . $column
        );
        
        return Cache::remember($cacheKey, $ttl, function () use ($query, $aggregateFunction, $column) {
            return $query->{$aggregateFunction}($column);
        });
    }

    /**
     * Bulk insert with optimized batch size
     */
    public static function bulkInsert(string $table, array $data, int $batchSize = 1000): void
    {
        $chunks = array_chunk($data, $batchSize);
        
        DB::transaction(function () use ($table, $chunks) {
            foreach ($chunks as $chunk) {
                DB::table($table)->insert($chunk);
            }
        });
    }

    /**
     * Bulk update with optimized queries
     */
    public static function bulkUpdate(string $table, array $updates, string $keyColumn = 'id'): void
    {
        if (empty($updates)) {
            return;
        }
        
        DB::transaction(function () use ($table, $updates, $keyColumn) {
            foreach ($updates as $update) {
                if (!isset($update[$keyColumn])) {
                    continue;
                }
                
                $id = $update[$keyColumn];
                unset($update[$keyColumn]);
                
                DB::table($table)->where($keyColumn, $id)->update($update);
            }
        });
    }

    /**
     * Generate cache key for query
     */
    private static function generateCacheKey(callable $callback, array $tags = []): string
    {
        $reflection = new \ReflectionFunction($callback);
        $file = $reflection->getFileName();
        $line = $reflection->getStartLine();
        
        return self::CACHE_PREFIX . md5($file . $line . serialize($tags));
    }

    /**
     * Clear query cache by tags
     */
    public static function clearCache(array $tags = []): void
    {
        if (empty($tags)) {
            // Clear all query cache
            Cache::flush();
        } else {
            // Clear specific tagged cache (if using tagged cache driver)
            foreach ($tags as $tag) {
                Cache::tags($tag)->flush();
            }
        }
    }

    /**
     * Get query performance statistics
     */
    public static function getQueryStats(): array
    {
        // This would integrate with Laravel Telescope or custom query logging
        return [
            'total_queries' => DB::getQueryLog() ? count(DB::getQueryLog()) : 0,
            'slow_queries' => 0, // Would be tracked separately
            'cache_hit_rate' => self::getCacheHitRate(),
        ];
    }

    /**
     * Calculate cache hit rate
     */
    private static function getCacheHitRate(): float
    {
        // This would require custom cache hit/miss tracking
        // For now, return a placeholder
        return 0.75; // 75% hit rate
    }

    /**
     * Optimize common query patterns
     */
    public static function optimizeCommonPatterns(Builder $query, string $pattern): Builder
    {
        switch ($pattern) {
            case 'recent_records':
                return $query->orderBy('created_at', 'desc')
                           ->limit(100);
                           
            case 'active_records':
                return $query->where('status', 'active')
                           ->whereNull('deleted_at');
                           
            case 'user_owned':
                return $query->where('user_id', auth()->id());
                
            case 'tenant_scoped':
                if (auth()->user() && method_exists(auth()->user(), 'currentTenant')) {
                    return $query->where('tenant_id', auth()->user()->currentTenant()->id);
                }
                return $query;
                
            default:
                return $query;
        }
    }

    /**
     * Database connection pool optimization
     */
    public static function optimizeConnectionPool(): void
    {
        // Configure connection pool settings
        config([
            'database.connections.mysql.options' => array_merge(
                config('database.connections.mysql.options', []),
                [
                    \PDO::ATTR_PERSISTENT => true,
                    \PDO::ATTR_TIMEOUT => 30,
                    \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                ]
            )
        ]);
    }

    /**
     * Query result streaming for large datasets
     */
    public static function streamLargeDataset(Builder $query, callable $callback, int $chunkSize = 1000): void
    {
        $query->chunk($chunkSize, function ($records) use ($callback) {
            foreach ($records as $record) {
                $callback($record);
            }
        });
    }
}
