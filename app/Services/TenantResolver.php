<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TenantResolver
{
    private const ENTERPRISE_USER_THRESHOLD = 1000;

    private const ENTERPRISE_TRANSACTION_THRESHOLD = 100000;

    private const HIGH_VOLUME_PLANS = ['enterprise', 'premium'];

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Resolve tenant by subdomain
     */
    public function resolveBySubdomain(string $subdomain): ?Tenant
    {
        return Cache::remember(
            "tenant:subdomain:{$subdomain}",
            self::CACHE_TTL,
            fn () => Tenant::where('subdomain', $subdomain)
                ->where('is_active', true)
                ->first()
        );
    }

    /**
     * Resolve tenant by domain
     */
    public function resolveByDomain(string $domain): ?Tenant
    {
        // Extract subdomain from domain
        $parts = explode('.', $domain);
        if (count($parts) >= 2) {
            $subdomain = $parts[0];

            return $this->resolveBySubdomain($subdomain);
        }

        return null;
    }

    /**
     * Determine optimal database strategy for tenant
     */
    public function determineDatabaseStrategy(Tenant $tenant): string
    {
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
    }

    /**
     * Check if tenant should be promoted to dedicated database
     */
    public function shouldPromoteTenant(Tenant $tenant): bool
    {
        $currentStrategy = $tenant->database_strategy;
        $optimalStrategy = $this->determineDatabaseStrategy($tenant);

        return $currentStrategy === 'shared' && $optimalStrategy === 'dedicated';
    }

    /**
     * Get database connection name for tenant
     */
    public function getDatabaseConnection(Tenant $tenant): string
    {
        switch ($tenant->database_strategy) {
            case 'dedicated':
                return "tenant_{$tenant->id}";

            case 'clustered':
                return "cluster_{$tenant->region}";

            case 'shared':
            default:
                return $this->getSharedDatabaseConnection($tenant);
        }
    }

    /**
     * Get shared database connection based on tenant distribution
     */
    private function getSharedDatabaseConnection(Tenant $tenant): string
    {
        // Distribute tenants across 4 shared shards based on tenant ID
        $shardNumber = ($tenant->id % 4) + 1;

        return "shared_shard_{$shardNumber}";
    }

    /**
     * Check if regional cluster exists
     */
    private function hasRegionalCluster(string $region): bool
    {
        $supportedRegions = [
            'us-east-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1',
        ];

        return in_array($region, $supportedRegions);
    }

    /**
     * Update tenant statistics for promotion evaluation
     */
    public function updateTenantStats(Tenant $tenant): void
    {
        $connection = $this->getDatabaseConnection($tenant);

        // Update user count
        $userCount = DB::connection($connection)
            ->table('users')
            ->where('organization_id', $tenant->id)
            ->count();

        // Update monthly transaction count
        $transactionCount = DB::connection($connection)
            ->table('transactions')
            ->where('organization_id', $tenant->id)
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        // Update storage usage (approximate)
        $storageUsage = $this->calculateStorageUsage($tenant, $connection);

        $tenant->update([
            'user_count' => $userCount,
            'monthly_transaction_count' => $transactionCount,
            'storage_usage_mb' => $storageUsage,
            'stats_updated_at' => now(),
        ]);

        // Clear cache
        Cache::forget("tenant:subdomain:{$tenant->subdomain}");
    }

    /**
     * Calculate approximate storage usage for tenant
     */
    private function calculateStorageUsage(Tenant $tenant, string $connection): float
    {
        // This is a simplified calculation - in production you'd want more accurate metrics
        $tables = ['users', 'transactions', 'invoices', 'documents'];
        $totalRows = 0;

        foreach ($tables as $table) {
            try {
                $count = DB::connection($connection)
                    ->table($table)
                    ->where('organization_id', $tenant->id)
                    ->count();
                $totalRows += $count;
            } catch (\Exception $e) {
                // Table might not exist yet
                continue;
            }
        }

        // Rough estimate: 1KB per row average
        return $totalRows * 1024 / (1024 * 1024); // Convert to MB
    }

    /**
     * Get tenants eligible for promotion
     */
    public function getPromotionCandidates(): \Illuminate\Database\Eloquent\Collection
    {
        return Tenant::where('database_strategy', 'shared')
            ->where(function ($query) {
                $query->where('user_count', '>=', self::ENTERPRISE_USER_THRESHOLD)
                    ->orWhere('monthly_transaction_count', '>=', self::ENTERPRISE_TRANSACTION_THRESHOLD)
                    ->orWhereIn('plan', self::HIGH_VOLUME_PLANS)
                    ->orWhere('requires_data_isolation', true);
            })
            ->get();
    }

    /**
     * Configure database connection for a tenant.
     */
    public function configureDatabaseForTenant(Tenant $tenant): void
    {
        $strategy = $this->determineDatabaseStrategy($tenant);

        switch ($strategy) {
            case 'dedicated':
                $this->configureDedicatedDatabase($tenant);
                break;
            case 'clustered':
                $this->configureClusteredDatabase($tenant);
                break;
            case 'shared':
            default:
                $this->configureSharedDatabase($tenant);
                break;
        }
    }

    /**
     * Configure dedicated database for enterprise tenant.
     */
    protected function configureDedicatedDatabase(Tenant $tenant): void
    {
        $connectionName = "tenant_{$tenant->id}";

        // Check if connection already exists
        if (array_key_exists($connectionName, config('database.connections', []))) {
            DB::setDefaultConnection($connectionName);

            return;
        }

        // Create dedicated database configuration
        $config = [
            'driver' => env('DB_CONNECTION', 'mysql'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => "tenant_{$tenant->id}",
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
        ];

        // Add the connection configuration
        config(["database.connections.{$connectionName}" => $config]);

        // Set as default connection
        DB::setDefaultConnection($connectionName);

        // Purge any existing connection
        DB::purge($connectionName);
    }

    /**
     * Configure clustered database for regional tenant.
     */
    protected function configureClusteredDatabase(Tenant $tenant): void
    {
        $region = $tenant->region ?? 'us-east-1';
        $connectionName = "cluster_{$region}";

        // Check if connection already exists
        if (array_key_exists($connectionName, config('database.connections', []))) {
            DB::setDefaultConnection($connectionName);

            return;
        }

        // Get regional database configuration
        $config = $this->getRegionalDatabaseConfig($region);

        // Add the connection configuration
        config(["database.connections.{$connectionName}" => $config]);

        // Set as default connection
        DB::setDefaultConnection($connectionName);

        // Purge any existing connection
        DB::purge($connectionName);
    }

    /**
     * Configure shared database for small/medium tenants.
     */
    protected function configureSharedDatabase(Tenant $tenant): void
    {
        // Determine shard based on tenant ID
        $shardNumber = ($tenant->id % 4) + 1; // 4 shards: 1, 2, 3, 4
        $connectionName = "shared_shard_{$shardNumber}";

        // Check if connection already exists
        if (array_key_exists($connectionName, config('database.connections', []))) {
            DB::setDefaultConnection($connectionName);

            return;
        }

        // Create shared database configuration
        $config = [
            'driver' => env('DB_CONNECTION', 'mysql'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel')."_shard_{$shardNumber}",
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
        ];

        // Add the connection configuration
        config(["database.connections.{$connectionName}" => $config]);

        // Set as default connection
        DB::setDefaultConnection($connectionName);

        // Purge any existing connection
        DB::purge($connectionName);
    }

    /**
     * Get regional database configuration.
     */
    protected function getRegionalDatabaseConfig(string $region): array
    {
        $regionConfigs = [
            'us-east-1' => [
                'host' => env('DB_HOST_US_EAST', env('DB_HOST', '127.0.0.1')),
                'database' => env('DB_DATABASE_US_EAST', env('DB_DATABASE', 'laravel').'_us_east'),
            ],
            'us-west-2' => [
                'host' => env('DB_HOST_US_WEST', env('DB_HOST', '127.0.0.1')),
                'database' => env('DB_DATABASE_US_WEST', env('DB_DATABASE', 'laravel').'_us_west'),
            ],
            'eu-west-1' => [
                'host' => env('DB_HOST_EU_WEST', env('DB_HOST', '127.0.0.1')),
                'database' => env('DB_DATABASE_EU_WEST', env('DB_DATABASE', 'laravel').'_eu_west'),
            ],
            'ap-southeast-1' => [
                'host' => env('DB_HOST_ASIA_PACIFIC', env('DB_HOST', '127.0.0.1')),
                'database' => env('DB_DATABASE_ASIA_PACIFIC', env('DB_DATABASE', 'laravel').'_asia_pacific'),
            ],
        ];

        $regionConfig = $regionConfigs[$region] ?? $regionConfigs['us-east-1'];

        return [
            'driver' => env('DB_CONNECTION', 'mysql'),
            'host' => $regionConfig['host'],
            'port' => env('DB_PORT', '3306'),
            'database' => $regionConfig['database'],
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
        ];
    }
}
