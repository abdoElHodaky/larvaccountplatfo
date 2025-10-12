<?php

namespace App\Infrastructure\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class QueryCache
{
    private const DEFAULT_TTL = 300; // 5 minutes

    private const CACHE_PREFIX = 'graphql:';

    /**
     * Cache configuration for different query types
     */
    private static array $cacheConfig = [
        'accounts' => ['ttl' => 600, 'tags' => ['accounts']],
        'transactions' => ['ttl' => 60, 'tags' => ['transactions']],
        'products' => ['ttl' => 300, 'tags' => ['inventory']],
        'dashboardMetrics' => ['ttl' => 120, 'tags' => ['dashboard']],
    ];

    /**
     * Generate cache key for GraphQL query
     */
    public static function generateKey(string $query, array $variables = [], ?int $userId = null): string
    {
        $queryHash = md5($query);
        $variablesHash = md5(json_encode($variables));
        $userContext = $userId ? "user:{$userId}" : 'anonymous';

        return self::CACHE_PREFIX."{$queryHash}:{$variablesHash}:{$userContext}";
    }

    /**
     * Get cached query result
     */
    public static function get(string $key): mixed
    {
        try {
            return Cache::get($key);
        } catch (\Exception $e) {
            Log::warning('Cache get failed', ['key' => $key, 'error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Cache query result
     */
    public static function put(string $key, mixed $data, ?string $queryType = null): void
    {
        try {
            $config = self::$cacheConfig[$queryType] ?? ['ttl' => self::DEFAULT_TTL];
            $ttl = $config['ttl'];

            if (isset($config['tags'])) {
                Cache::tags($config['tags'])->put($key, $data, $ttl);
            } else {
                Cache::put($key, $data, $ttl);
            }
        } catch (\Exception $e) {
            Log::warning('Cache put failed', ['key' => $key, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Invalidate cache by tags
     */
    public static function invalidateByTags(array $tags): void
    {
        try {
            Cache::tags($tags)->flush();
            Log::info('Cache invalidated', ['tags' => $tags]);
        } catch (\Exception $e) {
            Log::warning('Cache invalidation failed', ['tags' => $tags, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Invalidate specific cache key
     */
    public static function forget(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (\Exception $e) {
            Log::warning('Cache forget failed', ['key' => $key, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get cache statistics
     */
    public static function getStats(): array
    {
        try {
            // Simple cache stats (implementation depends on cache driver)
            return [
                'total_keys' => 0, // Would need Redis commands for actual count
                'memory_usage' => 0,
                'hit_rate' => 0,
                'last_updated' => now(),
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
