<?php

namespace App\Shared\Traits;

use Illuminate\Support\Facades\Cache;

/**
 * Cacheable Trait
 * 
 * Provides caching functionality for models and services.
 * Includes cache key generation and management methods.
 */
trait CacheableTrait
{
    /**
     * Cache prefix for this entity
     */
    protected $cachePrefix;

    /**
     * Default cache TTL in seconds
     */
    protected $cacheTtl = 3600;

    /**
     * Generate a cache key for this entity
     */
    public function getCacheKey(string $suffix = ''): string
    {
        $prefix = $this->cachePrefix ?? strtolower(class_basename(static::class));
        
        if (isset($this->id)) {
            $prefix .= ":{$this->id}";
        }
        
        return $prefix . ($suffix ? ":{$suffix}" : '');
    }

    /**
     * Remember a value in cache
     */
    public function remember(string $key, callable $callback, int $ttl = null)
    {
        return Cache::remember(
            $this->getCacheKey($key),
            $ttl ?? $this->cacheTtl,
            $callback
        );
    }

    /**
     * Store a value in cache
     */
    public function cacheSet(string $key, $value, int $ttl = null): bool
    {
        return Cache::put(
            $this->getCacheKey($key),
            $value,
            $ttl ?? $this->cacheTtl
        );
    }

    /**
     * Get a value from cache
     */
    public function cacheGet(string $key, $default = null)
    {
        return Cache::get($this->getCacheKey($key), $default);
    }

    /**
     * Check if a cache key exists
     */
    public function cacheHas(string $key): bool
    {
        return Cache::has($this->getCacheKey($key));
    }

    /**
     * Forget a cache key
     */
    public function cacheForget(string $key): bool
    {
        return Cache::forget($this->getCacheKey($key));
    }

    /**
     * Flush all cache for this entity
     */
    public function cacheFlush(): void
    {
        $prefix = $this->cachePrefix ?? strtolower(class_basename(static::class));
        
        if (isset($this->id)) {
            $prefix .= ":{$this->id}";
        }
        
        // Note: This is a simplified implementation
        // In production, you might want to use cache tags or a more sophisticated approach
        Cache::forget($prefix);
    }

    /**
     * Set cache prefix
     */
    public function setCachePrefix(string $prefix): self
    {
        $this->cachePrefix = $prefix;
        return $this;
    }

    /**
     * Set cache TTL
     */
    public function setCacheTtl(int $ttl): self
    {
        $this->cacheTtl = $ttl;
        return $this;
    }

    /**
     * Get cache TTL
     */
    public function getCacheTtl(): int
    {
        return $this->cacheTtl;
    }

    /**
     * Cache a method result
     */
    public function cacheMethod(string $method, array $args = [], int $ttl = null)
    {
        $key = $method . ':' . md5(serialize($args));
        
        return $this->remember($key, function () use ($method, $args) {
            return $this->$method(...$args);
        }, $ttl);
    }

    /**
     * Invalidate cache when model is updated
     */
    protected static function bootCacheableTrait()
    {
        static::updated(function ($model) {
            if (method_exists($model, 'cacheFlush')) {
                $model->cacheFlush();
            }
        });

        static::deleted(function ($model) {
            if (method_exists($model, 'cacheFlush')) {
                $model->cacheFlush();
            }
        });
    }
}
