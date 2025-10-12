<?php

namespace App\Shared\Contracts;

/**
 * Interface for services that support caching
 */
interface CacheableInterface
{
    /**
     * Get cache key for the given parameters
     */
    public function getCacheKey(string $method, array $parameters = []): string;

    /**
     * Get cache TTL (time to live) in seconds
     */
    public function getCacheTTL(string $method): int;

    /**
     * Get cache tags for the given method
     */
    public function getCacheTags(string $method): array;

    /**
     * Check if method should be cached
     */
    public function shouldCache(string $method): bool;

    /**
     * Invalidate cache for specific tags
     */
    public function invalidateCache(array $tags = []): void;

    /**
     * Clear all cache for this service
     */
    public function clearCache(): void;

    /**
     * Warm up cache for common operations
     */
    public function warmUpCache(): void;
}
