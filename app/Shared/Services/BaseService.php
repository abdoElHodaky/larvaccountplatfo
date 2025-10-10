<?php

namespace App\Shared\Services;

use App\Shared\Contracts\ServiceInterface;
use App\Shared\Contracts\CacheableInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Base service class that provides common functionality for all services
 */
abstract class BaseService implements ServiceInterface, CacheableInterface
{
    protected string $serviceName;
    protected string $serviceVersion = '1.0.0';
    protected array $dependencies = [];
    protected bool $initialized = false;
    protected array $cacheConfig = [];

    public function __construct()
    {
        $this->serviceName = $this->getServiceName();
        $this->initializeCacheConfig();
    }

    /**
     * Get the service name (must be implemented by child classes)
     */
    abstract protected function getServiceName(): string;

    /**
     * Initialize cache configuration
     */
    protected function initializeCacheConfig(): void
    {
        $this->cacheConfig = [
            'default_ttl' => 3600, // 1 hour
            'tags' => [$this->serviceName],
            'prefix' => strtolower($this->serviceName),
            'cacheable_methods' => [],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function getName(): string
    {
        return $this->serviceName;
    }

    /**
     * {@inheritdoc}
     */
    public function getVersion(): string
    {
        return $this->serviceVersion;
    }

    /**
     * {@inheritdoc}
     */
    public function isHealthy(): bool
    {
        try {
            // Check if service is initialized
            if (!$this->initialized) {
                return false;
            }

            // Check dependencies
            foreach ($this->dependencies as $dependency) {
                if (!$this->checkDependency($dependency)) {
                    return false;
                }
            }

            // Perform service-specific health checks
            return $this->performHealthCheck();
        } catch (Exception $e) {
            Log::error("Health check failed for service {$this->serviceName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getDependencies(): array
    {
        return $this->dependencies;
    }

    /**
     * {@inheritdoc}
     */
    public function initialize(): void
    {
        if ($this->initialized) {
            return;
        }

        try {
            $this->performInitialization();
            $this->initialized = true;
            Log::info("Service {$this->serviceName} initialized successfully");
        } catch (Exception $e) {
            Log::error("Failed to initialize service {$this->serviceName}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function cleanup(): void
    {
        try {
            $this->performCleanup();
            $this->initialized = false;
            Log::info("Service {$this->serviceName} cleaned up successfully");
        } catch (Exception $e) {
            Log::error("Failed to cleanup service {$this->serviceName}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getCacheKey(string $method, array $parameters = []): string
    {
        $parameterHash = md5(serialize($parameters));
        return "{$this->cacheConfig['prefix']}:{$method}:{$parameterHash}";
    }

    /**
     * {@inheritdoc}
     */
    public function getCacheTTL(string $method): int
    {
        return $this->cacheConfig['method_ttl'][$method] ?? $this->cacheConfig['default_ttl'];
    }

    /**
     * {@inheritdoc}
     */
    public function getCacheTags(string $method): array
    {
        $baseTags = $this->cacheConfig['tags'];
        $methodTags = $this->cacheConfig['method_tags'][$method] ?? [];
        
        return array_merge($baseTags, $methodTags);
    }

    /**
     * {@inheritdoc}
     */
    public function shouldCache(string $method): bool
    {
        return in_array($method, $this->cacheConfig['cacheable_methods']);
    }

    /**
     * {@inheritdoc}
     */
    public function invalidateCache(array $tags = []): void
    {
        $tagsToInvalidate = empty($tags) ? $this->cacheConfig['tags'] : $tags;
        
        foreach ($tagsToInvalidate as $tag) {
            Cache::tags($tag)->flush();
        }
        
        Log::info("Cache invalidated for service {$this->serviceName}", ['tags' => $tagsToInvalidate]);
    }

    /**
     * {@inheritdoc}
     */
    public function clearCache(): void
    {
        Cache::tags($this->cacheConfig['tags'])->flush();
        Log::info("All cache cleared for service {$this->serviceName}");
    }

    /**
     * {@inheritdoc}
     */
    public function warmUpCache(): void
    {
        // Override in child classes to implement cache warming
        Log::info("Cache warm-up completed for service {$this->serviceName}");
    }

    /**
     * Execute a method with caching support
     */
    protected function cached(string $method, array $parameters, callable $callback)
    {
        if (!$this->shouldCache($method)) {
            return $callback();
        }

        $cacheKey = $this->getCacheKey($method, $parameters);
        $cacheTags = $this->getCacheTags($method);
        $cacheTTL = $this->getCacheTTL($method);

        return Cache::tags($cacheTags)->remember($cacheKey, $cacheTTL, $callback);
    }

    /**
     * Log service activity
     */
    protected function logActivity(string $action, array $context = []): void
    {
        Log::info("Service {$this->serviceName}: {$action}", $context);
    }

    /**
     * Log service error
     */
    protected function logError(string $message, Exception $exception = null, array $context = []): void
    {
        $context['service'] = $this->serviceName;
        
        if ($exception) {
            $context['exception'] = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }

        Log::error($message, $context);
    }

    /**
     * Check if a dependency is available
     */
    protected function checkDependency(string $dependency): bool
    {
        try {
            return app()->bound($dependency);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Perform service-specific initialization
     * Override in child classes
     */
    protected function performInitialization(): void
    {
        // Default implementation - override in child classes
    }

    /**
     * Perform service-specific cleanup
     * Override in child classes
     */
    protected function performCleanup(): void
    {
        // Default implementation - override in child classes
    }

    /**
     * Perform service-specific health checks
     * Override in child classes
     */
    protected function performHealthCheck(): bool
    {
        return true; // Default implementation - override in child classes
    }

    /**
     * Set cache configuration
     */
    protected function setCacheConfig(array $config): void
    {
        $this->cacheConfig = array_merge($this->cacheConfig, $config);
    }

    /**
     * Add cacheable method
     */
    protected function addCacheableMethod(string $method, int $ttl = null, array $tags = []): void
    {
        $this->cacheConfig['cacheable_methods'][] = $method;
        
        if ($ttl !== null) {
            $this->cacheConfig['method_ttl'][$method] = $ttl;
        }
        
        if (!empty($tags)) {
            $this->cacheConfig['method_tags'][$method] = $tags;
        }
    }

    /**
     * Get service metrics
     */
    public function getMetrics(): array
    {
        return [
            'name' => $this->serviceName,
            'version' => $this->serviceVersion,
            'initialized' => $this->initialized,
            'healthy' => $this->isHealthy(),
            'dependencies' => $this->dependencies,
            'cache_config' => $this->cacheConfig,
        ];
    }
}
