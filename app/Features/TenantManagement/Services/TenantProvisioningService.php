<?php

namespace App\Features\TenantManagement\Services;

use App\Models\Tenant;
use App\Models\GlobalUser;
use Modules\Shared\Models\Organization;
use Modules\Shared\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class TenantProvisioningService
{
    /**
     * The tenant resolver service.
     */
    protected $tenantResolver;

    /**
     * The database initialization service.
     */
    protected $databaseInitService;

    /**
     * Create a new tenant provisioning service instance.
     */
    public function __construct(TenantResolver $tenantResolver, DatabaseInitializationService $databaseInitService)
    {
        $this->tenantResolver = $tenantResolver;
        $this->databaseInitService = $databaseInitService;
    }

    /**
     * Provision a new tenant with complete setup.
     */
    public function provisionTenant(array $tenantData, array $organizationData, array $adminUserData): array
    {
        DB::connection('landlord')->beginTransaction();

        try {
            // Step 1: Determine optimal database strategy
            $databaseStrategy = $this->determineDatabaseStrategy($tenantData);

            // Step 2: Create tenant record
            $tenant = $this->createTenant($tenantData, $databaseStrategy);

            // Step 3: Initialize database infrastructure
            $this->databaseInitService->initializeTenantDatabase($tenant);

            // Step 4: Create organization
            $organization = $this->createOrganization($tenant, $organizationData);

            // Step 5: Create admin user
            $adminUser = $this->createAdminUser($tenant, $organization, $adminUserData);

            // Step 6: Create global user for cross-tenant access
            $globalUser = $this->createGlobalUser($tenant, $adminUserData);

            // Step 7: Seed default data
            $this->seedDefaultData($tenant, $organization);

            // Step 8: Run post-provisioning tasks
            $this->runPostProvisioningTasks($tenant);

            DB::connection('landlord')->commit();

            return [
                'success' => true,
                'tenant' => $tenant,
                'organization' => $organization,
                'admin_user' => $adminUser,
                'global_user' => $globalUser,
                'database_strategy' => $databaseStrategy,
                'message' => 'Tenant provisioned successfully',
            ];
        } catch (\Exception $e) {
            DB::connection('landlord')->rollBack();
            
            // Cleanup any partially created resources
            $this->cleanupFailedProvisioning($tenant ?? null);

            throw new \Exception("Tenant provisioning failed: " . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Determine the optimal database strategy for the tenant.
     */
    protected function determineDatabaseStrategy(array $tenantData): string
    {
        // Check if strategy is explicitly requested
        if (!empty($tenantData['database_strategy'])) {
            return $tenantData['database_strategy'];
        }

        // Business rules for automatic strategy determination
        $plan = $tenantData['plan'] ?? 'basic';
        $region = $tenantData['region'] ?? null;
        $requiresIsolation = $tenantData['requires_data_isolation'] ?? false;
        $expectedUsers = $tenantData['expected_users'] ?? 0;
        $expectedTransactions = $tenantData['expected_transactions'] ?? 0;

        // Rule 1: Compliance requirements → Dedicated database
        if ($requiresIsolation) {
            return 'dedicated';
        }

        // Rule 2: Enterprise plans → Dedicated database
        if (in_array($plan, ['enterprise', 'premium'])) {
            return 'dedicated';
        }

        // Rule 3: High expected usage → Dedicated database
        if ($expectedUsers >= 1000 || $expectedTransactions >= 100000) {
            return 'dedicated';
        }

        // Rule 4: Regional clustering → Clustered database
        if ($region && $this->hasRegionalCluster($region)) {
            return 'clustered';
        }

        // Default: Shared database
        return 'shared';
    }

    /**
     * Create tenant record in landlord database.
     */
    protected function createTenant(array $tenantData, string $databaseStrategy): Tenant
    {
        // Generate unique subdomain if not provided
        if (empty($tenantData['subdomain'])) {
            $tenantData['subdomain'] = $this->generateUniqueSubdomain($tenantData['name']);
        }

        // Set database configuration based on strategy
        $tenantData['database_strategy'] = $databaseStrategy;
        $tenantData['database_name'] = $this->generateDatabaseName($tenantData['subdomain'], $databaseStrategy);
        
        if ($databaseStrategy === 'dedicated') {
            $tenantData['database_host'] = $this->getDedicatedDatabaseHost($tenantData['region'] ?? null);
        }

        return Tenant::create($tenantData);
    }

    /**
     * Create organization in tenant database.
     */
    protected function createOrganization(Tenant $tenant, array $organizationData): Organization
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        // Set organization data
        $organizationData['slug'] = $organizationData['slug'] ?? Str::slug($organizationData['name']);
        
        // For shared databases, the organization ID should match the tenant ID
        if ($tenant->database_strategy === 'shared') {
            $organizationData['id'] = $tenant->id;
        }

        $organization = new Organization();
        $organization->setConnection($connectionName);
        
        return $organization->create($organizationData);
    }

    /**
     * Create admin user in tenant database.
     */
    protected function createAdminUser(Tenant $tenant, Organization $organization, array $adminUserData): User
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        $userData = [
            'organization_id' => $organization->id,
            'name' => $adminUserData['name'],
            'email' => $adminUserData['email'],
            'password' => Hash::make($adminUserData['password']),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ];

        $user = new User();
        $user->setConnection($connectionName);
        
        return $user->create($userData);
    }

    /**
     * Create global user for cross-tenant access.
     */
    protected function createGlobalUser(Tenant $tenant, array $adminUserData): GlobalUser
    {
        return GlobalUser::create([
            'tenant_id' => $tenant->id,
            'name' => $adminUserData['name'],
            'email' => $adminUserData['email'],
            'password' => Hash::make($adminUserData['password']),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Seed default data for the tenant.
     */
    protected function seedDefaultData(Tenant $tenant, Organization $organization): void
    {
        $connectionName = $this->tenantResolver->getDatabaseConnection($tenant);

        // Run tenant-specific seeders
        Artisan::call('db:seed', [
            '--class' => 'TenantDefaultSeeder',
            '--database' => $connectionName,
        ]);
    }

    /**
     * Run post-provisioning tasks.
     */
    protected function runPostProvisioningTasks(Tenant $tenant): void
    {
        // Update tenant statistics
        $this->tenantResolver->updateTenantStats($tenant);

        // Send welcome email (implement as needed)
        // $this->sendWelcomeEmail($tenant);

        // Log successful provisioning
        \Log::info('Tenant provisioned successfully', [
            'tenant_id' => $tenant->id,
            'subdomain' => $tenant->subdomain,
            'database_strategy' => $tenant->database_strategy,
        ]);
    }

    /**
     * Generate unique subdomain for tenant.
     */
    protected function generateUniqueSubdomain(string $name): string
    {
        $baseSubdomain = Str::slug($name);
        $subdomain = $baseSubdomain;
        $counter = 1;

        while (Tenant::where('subdomain', $subdomain)->exists()) {
            $subdomain = $baseSubdomain . '-' . $counter;
            $counter++;
        }

        return $subdomain;
    }

    /**
     * Generate database name based on strategy.
     */
    protected function generateDatabaseName(string $subdomain, string $strategy): string
    {
        switch ($strategy) {
            case 'dedicated':
                return "tenant_{$subdomain}_dedicated";
            case 'clustered':
                return "cluster_" . $this->getRegionFromSubdomain($subdomain);
            case 'shared':
            default:
                return "shared_shard_" . ((crc32($subdomain) % 4) + 1);
        }
    }

    /**
     * Get dedicated database host for region.
     */
    protected function getDedicatedDatabaseHost(?string $region): string
    {
        $hosts = [
            'us-east-1' => env('DB_HOST_US_EAST', env('DB_HOST', '127.0.0.1')),
            'us-west-2' => env('DB_HOST_US_WEST', env('DB_HOST', '127.0.0.1')),
            'eu-west-1' => env('DB_HOST_EU_WEST', env('DB_HOST', '127.0.0.1')),
            'ap-southeast-1' => env('DB_HOST_AP_SOUTHEAST', env('DB_HOST', '127.0.0.1')),
        ];

        return $hosts[$region] ?? env('DB_HOST', '127.0.0.1');
    }

    /**
     * Check if regional cluster exists.
     */
    protected function hasRegionalCluster(string $region): bool
    {
        $supportedRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
        return in_array($region, $supportedRegions);
    }

    /**
     * Get region from subdomain (simplified implementation).
     */
    protected function getRegionFromSubdomain(string $subdomain): string
    {
        // This is a simplified implementation
        // In practice, you might determine region based on user location or preferences
        return 'us-east-1';
    }

    /**
     * Cleanup resources after failed provisioning.
     */
    protected function cleanupFailedProvisioning(?Tenant $tenant): void
    {
        if (!$tenant) {
            return;
        }

        try {
            // Remove tenant database if it was created
            if ($tenant->database_strategy === 'dedicated') {
                $this->databaseInitService->dropTenantDatabase($tenant);
            }

            // Remove tenant record
            $tenant->delete();

            \Log::info('Cleaned up failed tenant provisioning', [
                'tenant_id' => $tenant->id,
                'subdomain' => $tenant->subdomain,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to cleanup after provisioning failure', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Promote tenant to dedicated database.
     */
    public function promoteTenantToDedicated(Tenant $tenant): array
    {
        if ($tenant->database_strategy === 'dedicated') {
            throw new \Exception('Tenant is already using dedicated database.');
        }

        DB::connection('landlord')->beginTransaction();

        try {
            $oldConnectionName = $this->tenantResolver->getDatabaseConnection($tenant);

            // Create dedicated database
            $this->databaseInitService->createDedicatedDatabase($tenant);

            // Migrate data from shared/clustered to dedicated
            $this->migrateDataToDedicated($tenant, $oldConnectionName);

            // Update tenant record
            $tenant->update([
                'database_strategy' => 'dedicated',
                'database_name' => "tenant_{$tenant->subdomain}_dedicated",
                'database_host' => $this->getDedicatedDatabaseHost($tenant->region),
                'migrated_at' => now(),
            ]);

            DB::connection('landlord')->commit();

            \Log::info('Tenant promoted to dedicated database', [
                'tenant_id' => $tenant->id,
                'subdomain' => $tenant->subdomain,
            ]);

            return [
                'success' => true,
                'tenant' => $tenant->fresh(),
                'message' => 'Tenant successfully promoted to dedicated database',
            ];
        } catch (\Exception $e) {
            DB::connection('landlord')->rollBack();
            throw new \Exception("Tenant promotion failed: " . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Migrate data from shared/clustered to dedicated database.
     */
    protected function migrateDataToDedicated(Tenant $tenant, string $oldConnectionName): void
    {
        $newConnectionName = "tenant_{$tenant->id}";

        // Get all tables to migrate
        $tables = ['organizations', 'users']; // Add more tables as needed

        foreach ($tables as $table) {
            $this->migrateTableData($table, $oldConnectionName, $newConnectionName, $tenant->id);
        }
    }

    /**
     * Migrate data for a specific table.
     */
    protected function migrateTableData(string $table, string $fromConnection, string $toConnection, int $organizationId): void
    {
        $query = DB::connection($fromConnection)->table($table);

        // For shared databases, filter by organization_id
        if (str_contains($fromConnection, 'shared_shard')) {
            $query->where('organization_id', $organizationId);
        }

        $data = $query->get()->toArray();

        if (!empty($data)) {
            DB::connection($toConnection)->table($table)->insert($data);
        }
    }

    /**
     * Get tenant provisioning status.
     */
    public function getProvisioningStatus(Tenant $tenant): array
    {
        return [
            'tenant_id' => $tenant->id,
            'subdomain' => $tenant->subdomain,
            'database_strategy' => $tenant->database_strategy,
            'is_active' => $tenant->is_active,
            'created_at' => $tenant->created_at,
            'migrated_at' => $tenant->migrated_at,
            'user_count' => $tenant->user_count,
            'monthly_transaction_count' => $tenant->monthly_transaction_count,
            'storage_usage_mb' => $tenant->storage_usage_mb,
            'last_stats_update' => $tenant->stats_updated_at,
        ];
    }

    /**
     * Validate tenant provisioning data.
     */
    public function validateProvisioningData(array $tenantData, array $organizationData, array $adminUserData): array
    {
        $errors = [];

        // Validate tenant data
        if (empty($tenantData['name'])) {
            $errors[] = 'Tenant name is required';
        }

        if (!empty($tenantData['subdomain']) && !preg_match('/^[a-z0-9-]+$/', $tenantData['subdomain'])) {
            $errors[] = 'Subdomain must contain only lowercase letters, numbers, and hyphens';
        }

        if (!empty($tenantData['subdomain']) && Tenant::where('subdomain', $tenantData['subdomain'])->exists()) {
            $errors[] = 'Subdomain is already taken';
        }

        // Validate organization data
        if (empty($organizationData['name'])) {
            $errors[] = 'Organization name is required';
        }

        // Validate admin user data
        if (empty($adminUserData['name'])) {
            $errors[] = 'Admin user name is required';
        }

        if (empty($adminUserData['email']) || !filter_var($adminUserData['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Valid admin user email is required';
        }

        if (empty($adminUserData['password']) || strlen($adminUserData['password']) < 8) {
            $errors[] = 'Admin user password must be at least 8 characters';
        }

        return $errors;
    }
}
