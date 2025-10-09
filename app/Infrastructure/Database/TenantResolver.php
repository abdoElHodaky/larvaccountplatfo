<?php

namespace App\Infrastructure\Database;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * Tenant Resolver Service
 * Implements intelligent tenant routing based on business rules
 */
class TenantResolver
{
    private const ENTERPRISE_USER_THRESHOLD = 1000;
    private const ENTERPRISE_TRANSACTION_THRESHOLD = 100000;
    private const HIGH_VOLUME_PLANS = ['enterprise', 'premium'];
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Determine the optimal database strategy for a tenant
     */
    public function determineDatabaseStrategy(Tenant $tenant): string
    {
        $cacheKey = "tenant_db_strategy_{$tenant->id}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenant) {
            // Rule 1: Enterprise plans → Dedicated database
            if (in_array($tenant->plan, self::HIGH_VOLUME_PLANS)) {
                return 'dedicated';
            }
            
            // Rule 2: High user count → Dedicated database  
            if ($tenant->user_count >= self::ENTERPRISE_USER_THRESHOLD) {
                return 'dedicated';
            }
            
            // Rule 3: High transaction volume → Dedicated database
            if ($tenant->monthly_transaction_count >= self::ENTERPRISE_TRANSACTION_THRESHOLD) {
                return 'dedicated';
            }
            
            // Rule 4: Compliance requirements → Dedicated database
            if ($tenant->requires_data_isolation) {
                return 'dedicated';
            }
            
            // Rule 5: Geographic clustering → Regional shared database
            if ($tenant->region && $this->hasRegionalCluster($tenant->region)) {
                return 'clustered';
            }
            
            // Default: Shared database with tenant isolation
            return 'shared';
        });
    }

    /**
     * Get the appropriate database connection for a tenant
     */
    public function getConnectionName(Tenant $tenant): string
    {
        $strategy = $this->determineDatabaseStrategy($tenant);
        
        return match ($strategy) {
            'dedicated' => $this->getDedicatedConnection($tenant),
            'clustered' => $this->getClusteredConnection($tenant),
            'shared' => $this->getSharedConnection($tenant),
            default => 'landlord'
        };
    }

    /**
     * Set the database connection for the current tenant
     */
    public function setTenantConnection(Tenant $tenant): void
    {
        $connectionName = $this->getConnectionName($tenant);
        Config::set('database.default', $connectionName);
        
        // Clear any existing connection to force reconnection
        app('db')->purge($connectionName);
    }

    /**
     * Get dedicated database connection name
     */
    private function getDedicatedConnection(Tenant $tenant): string
    {
        return "tenant_{$tenant->id}";
    }

    /**
     * Get clustered database connection name based on region
     */
    private function getClusteredConnection(Tenant $tenant): string
    {
        $region = $tenant->region ?? 'us-east-1';
        return "cluster_{$region}";
    }

    /**
     * Get shared database connection using modulo-based sharding
     */
    private function getSharedConnection(Tenant $tenant): string
    {
        $shardNumber = ($tenant->id % 4) + 1;
        return "shared_shard_{$shardNumber}";
    }

    /**
     * Check if a regional cluster exists for the given region
     */
    private function hasRegionalCluster(string $region): bool
    {
        $availableRegions = [
            'us-east-1',
            'us-west-2', 
            'eu-west-1',
            'ap-southeast-1'
        ];
        
        return in_array($region, $availableRegions);
    }

    /**
     * Create dedicated database connection configuration
     */
    public function createDedicatedConnection(Tenant $tenant): array
    {
        return [
            'driver' => 'mysql',
            'host' => env('DB_DEDICATED_HOST', env('DB_HOST', '127.0.0.1')),
            'port' => env('DB_DEDICATED_PORT', env('DB_PORT', '3306')),
            'database' => "tenant_{$tenant->id}",
            'username' => env('DB_DEDICATED_USERNAME', env('DB_USERNAME', 'forge')),
            'password' => env('DB_DEDICATED_PASSWORD', env('DB_PASSWORD', '')),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                \PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ];
    }

    /**
     * Get tenant from current context
     */
    public function getCurrentTenant(): ?Tenant
    {
        if (auth()->check() && auth()->user()->current_tenant_id) {
            return Cache::remember(
                "tenant_" . auth()->user()->current_tenant_id,
                self::CACHE_TTL,
                fn() => Tenant::find(auth()->user()->current_tenant_id)
            );
        }
        
        return null;
    }

    /**
     * Resolve tenant from request context
     */
    public function resolveTenantFromRequest(): ?Tenant
    {
        // Try to get tenant from authenticated user
        if ($tenant = $this->getCurrentTenant()) {
            return $tenant;
        }
        
        // Try to get tenant from subdomain
        if ($tenant = $this->resolveTenantFromSubdomain()) {
            return $tenant;
        }
        
        // Try to get tenant from header (for API requests)
        if ($tenant = $this->resolveTenantFromHeader()) {
            return $tenant;
        }
        
        return null;
    }

    /**
     * Resolve tenant from subdomain
     */
    private function resolveTenantFromSubdomain(): ?Tenant
    {
        $host = request()->getHost();
        $subdomain = explode('.', $host)[0] ?? null;
        
        if ($subdomain && $subdomain !== 'www') {
            return Cache::remember(
                "tenant_subdomain_{$subdomain}",
                self::CACHE_TTL,
                fn() => Tenant::where('subdomain', $subdomain)->first()
            );
        }
        
        return null;
    }

    /**
     * Resolve tenant from API header
     */
    private function resolveTenantFromHeader(): ?Tenant
    {
        $tenantId = request()->header('X-Tenant-ID');
        
        if ($tenantId) {
            return Cache::remember(
                "tenant_header_{$tenantId}",
                self::CACHE_TTL,
                fn() => Tenant::find($tenantId)
            );
        }
        
        return null;
    }
}
