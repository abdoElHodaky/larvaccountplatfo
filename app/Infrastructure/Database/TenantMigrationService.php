<?php

namespace App\Infrastructure\Database;

use App\Models\Tenant;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Tenant Migration Service
 * Handles automatic tenant promotion and database migrations
 */
class TenantMigrationService
{
    public function __construct(
        private TenantResolver $tenantResolver
    ) {}

    /**
     * Check for tenants that need auto-promotion to dedicated databases
     */
    public function checkForAutoPromotion(): void
    {
        $candidates = Tenant::where('database_strategy', 'shared')
            ->where(function($query) {
                $query->where('user_count', '>=', TenantResolver::ENTERPRISE_USER_THRESHOLD)
                    ->orWhere('monthly_transaction_count', '>=', TenantResolver::ENTERPRISE_TRANSACTION_THRESHOLD)
                    ->orWhereIn('plan', TenantResolver::HIGH_VOLUME_PLANS)
                    ->orWhere('requires_data_isolation', true);
            })
            ->get();

        foreach ($candidates as $tenant) {
            $this->promoteTenantToDedicated($tenant);
        }
    }

    /**
     * Promote a tenant from shared to dedicated database
     */
    public function promoteTenantToDedicated(Tenant $tenant): bool
    {
        try {
            Log::info("Starting tenant promotion to dedicated database", [
                'tenant_id' => $tenant->id,
                'current_strategy' => $tenant->database_strategy
            ]);

            // Step 1: Create dedicated database
            $this->createDedicatedDatabase($tenant);

            // Step 2: Run migrations on dedicated database
            $this->runMigrationsForTenant($tenant);

            // Step 3: Migrate data from shared to dedicated
            $this->migrateDataToDedicated($tenant);

            // Step 4: Update tenant strategy
            $tenant->update([
                'database_strategy' => 'dedicated',
                'promoted_at' => now()
            ]);

            // Step 5: Verify data integrity
            $this->verifyDataIntegrity($tenant);

            Log::info("Tenant promotion completed successfully", [
                'tenant_id' => $tenant->id
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("Tenant promotion failed", [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Rollback if possible
            $this->rollbackPromotion($tenant);

            return false;
        }
    }

    /**
     * Create dedicated database for tenant
     */
    private function createDedicatedDatabase(Tenant $tenant): void
    {
        $databaseName = "tenant_{$tenant->id}";
        
        // Connect to MySQL without specifying database
        $connection = config('database.connections.landlord');
        unset($connection['database']);
        
        Config::set('database.connections.temp_admin', $connection);
        
        // Create database
        DB::connection('temp_admin')->statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Add dedicated connection configuration
        $dedicatedConfig = $this->tenantResolver->createDedicatedConnection($tenant);
        Config::set("database.connections.tenant_{$tenant->id}", $dedicatedConfig);
        
        Log::info("Created dedicated database", [
            'tenant_id' => $tenant->id,
            'database_name' => $databaseName
        ]);
    }

    /**
     * Run migrations for tenant's dedicated database
     */
    private function runMigrationsForTenant(Tenant $tenant): void
    {
        $connectionName = "tenant_{$tenant->id}";
        
        // Run migrations on dedicated database
        Artisan::call('migrate', [
            '--database' => $connectionName,
            '--force' => true
        ]);
        
        Log::info("Migrations completed for tenant", [
            'tenant_id' => $tenant->id,
            'connection' => $connectionName
        ]);
    }

    /**
     * Migrate data from shared to dedicated database
     */
    private function migrateDataToDedicated(Tenant $tenant): void
    {
        $sourceConnection = $this->tenantResolver->getSharedConnection($tenant);
        $targetConnection = "tenant_{$tenant->id}";
        
        // Get all tables that need migration
        $tables = $this->getTenantTables();
        
        foreach ($tables as $table) {
            $this->migrateTableData($tenant, $table, $sourceConnection, $targetConnection);
        }
        
        Log::info("Data migration completed", [
            'tenant_id' => $tenant->id,
            'tables_migrated' => count($tables)
        ]);
    }

    /**
     * Migrate data for a specific table
     */
    private function migrateTableData(Tenant $tenant, string $table, string $sourceConnection, string $targetConnection): void
    {
        // Get data from source
        $data = DB::connection($sourceConnection)
            ->table($table)
            ->where('organization_id', $tenant->organization_id)
            ->get();
        
        if ($data->isNotEmpty()) {
            // Insert into target database
            DB::connection($targetConnection)
                ->table($table)
                ->insert($data->toArray());
            
            Log::debug("Migrated table data", [
                'tenant_id' => $tenant->id,
                'table' => $table,
                'records' => $data->count()
            ]);
        }
    }

    /**
     * Get list of tables that contain tenant data
     */
    private function getTenantTables(): array
    {
        return [
            'accounts',
            'transactions',
            'journal_entries',
            'invoices',
            'customers',
            'vendors',
            'products',
            'inventory_items',
            'reports',
            'users',
            'user_permissions',
            'audit_logs',
            'attachments',
            'settings'
        ];
    }

    /**
     * Verify data integrity after migration
     */
    private function verifyDataIntegrity(Tenant $tenant): void
    {
        $sourceConnection = $this->tenantResolver->getSharedConnection($tenant);
        $targetConnection = "tenant_{$tenant->id}";
        
        $tables = $this->getTenantTables();
        $discrepancies = [];
        
        foreach ($tables as $table) {
            $sourceCount = DB::connection($sourceConnection)
                ->table($table)
                ->where('organization_id', $tenant->organization_id)
                ->count();
            
            $targetCount = DB::connection($targetConnection)
                ->table($table)
                ->count();
            
            if ($sourceCount !== $targetCount) {
                $discrepancies[] = [
                    'table' => $table,
                    'source_count' => $sourceCount,
                    'target_count' => $targetCount
                ];
            }
        }
        
        if (!empty($discrepancies)) {
            throw new \Exception("Data integrity check failed: " . json_encode($discrepancies));
        }
        
        Log::info("Data integrity verification passed", [
            'tenant_id' => $tenant->id,
            'tables_verified' => count($tables)
        ]);
    }

    /**
     * Rollback promotion in case of failure
     */
    private function rollbackPromotion(Tenant $tenant): void
    {
        try {
            $databaseName = "tenant_{$tenant->id}";
            
            // Drop dedicated database if it exists
            $connection = config('database.connections.landlord');
            unset($connection['database']);
            Config::set('database.connections.temp_admin', $connection);
            
            DB::connection('temp_admin')->statement("DROP DATABASE IF EXISTS `{$databaseName}`");
            
            Log::info("Rollback completed", [
                'tenant_id' => $tenant->id
            ]);
            
        } catch (\Exception $e) {
            Log::error("Rollback failed", [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Clean up old data from shared database after successful migration
     */
    public function cleanupSharedData(Tenant $tenant): void
    {
        if ($tenant->database_strategy !== 'dedicated') {
            throw new \Exception("Can only cleanup data for tenants with dedicated databases");
        }
        
        $sourceConnection = $this->tenantResolver->getSharedConnection($tenant);
        $tables = $this->getTenantTables();
        
        DB::connection($sourceConnection)->transaction(function () use ($tenant, $tables, $sourceConnection) {
            foreach ($tables as $table) {
                DB::connection($sourceConnection)
                    ->table($table)
                    ->where('organization_id', $tenant->organization_id)
                    ->delete();
            }
        });
        
        Log::info("Cleaned up shared database data", [
            'tenant_id' => $tenant->id,
            'tables_cleaned' => count($tables)
        ]);
    }

    /**
     * Get migration status for all tenants
     */
    public function getMigrationStatus(): array
    {
        return Tenant::select('id', 'name', 'database_strategy', 'user_count', 'monthly_transaction_count', 'promoted_at')
            ->get()
            ->map(function ($tenant) {
                $recommendedStrategy = $this->tenantResolver->determineDatabaseStrategy($tenant);
                
                return [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'current_strategy' => $tenant->database_strategy,
                    'recommended_strategy' => $recommendedStrategy,
                    'needs_promotion' => $tenant->database_strategy !== $recommendedStrategy,
                    'user_count' => $tenant->user_count,
                    'transaction_count' => $tenant->monthly_transaction_count,
                    'promoted_at' => $tenant->promoted_at
                ];
            })
            ->toArray();
    }
}
