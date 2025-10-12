<?php

namespace Tests\Shared;

use App\Models\GlobalUser;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

abstract class TenantTestCase extends TestCase
{
    use RefreshDatabase;

    protected ?Tenant $tenant = null;

    protected ?User $user = null;

    protected ?GlobalUser $globalUser = null;

    /**
     * Setup the test environment with tenant context.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Set up test databases
        $this->setUpTestDatabases();

        // Create default tenant for testing
        $this->createTestTenant();

        // Set tenant context
        $this->setTenantContext();
    }

    /**
     * Set up test databases for multi-tenant testing.
     */
    protected function setUpTestDatabases(): void
    {
        // Configure test database connections
        config([
            'database.connections.landlord.database' => ':memory:',
            'database.connections.shared_shard_1.database' => ':memory:',
            'database.connections.testing.database' => ':memory:',
        ]);
    }

    /**
     * Create a test tenant.
     */
    protected function createTestTenant(array $attributes = []): Tenant
    {
        $this->tenant = Tenant::factory()->create(array_merge([
            'name' => 'Test Tenant',
            'subdomain' => 'test-tenant',
            'database_strategy' => 'shared',
            'database_name' => 'shared_shard_1',
            'is_active' => true,
            'enabled_modules' => ['Accounting', 'Inventory', 'Reporting'],
        ], $attributes));

        return $this->tenant;
    }

    /**
     * Create a test user for the tenant.
     */
    protected function createTestUser(array $attributes = []): User
    {
        $this->user = User::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
            'email' => 'test@example.com',
            'name' => 'Test User',
        ], $attributes));

        return $this->user;
    }

    /**
     * Create a test global user.
     */
    protected function createTestGlobalUser(array $attributes = []): GlobalUser
    {
        $this->globalUser = GlobalUser::factory()->create(array_merge([
            'email' => 'admin@example.com',
            'name' => 'Global Admin',
            'is_super_admin' => false,
        ], $attributes));

        return $this->globalUser;
    }

    /**
     * Set the tenant context for the application.
     */
    protected function setTenantContext(): void
    {
        if ($this->tenant) {
            app()->instance('tenant', $this->tenant);

            // Set the default database connection for tenant data
            DB::setDefaultConnection($this->tenant->database_name);
        }
    }

    /**
     * Act as a tenant user.
     */
    protected function actingAsTenantUser(?User $user = null): self
    {
        $user = $user ?: $this->createTestUser();

        return $this->actingAs($user);
    }

    /**
     * Act as a global user.
     */
    protected function actingAsGlobalUser(?GlobalUser $user = null): self
    {
        $user = $user ?: $this->createTestGlobalUser();

        return $this->actingAs($user, 'global');
    }

    /**
     * Switch to a different tenant context.
     */
    protected function switchTenant(Tenant $tenant): void
    {
        $this->tenant = $tenant;
        $this->setTenantContext();
    }

    /**
     * Assert that the current tenant matches the expected tenant.
     */
    protected function assertCurrentTenant(Tenant $expectedTenant): void
    {
        $currentTenant = app('tenant');

        $this->assertNotNull($currentTenant, 'No tenant is currently set');
        $this->assertEquals($expectedTenant->id, $currentTenant->id);
    }

    /**
     * Assert that a database table exists in the current tenant's database.
     */
    protected function assertTenantTableExists(string $tableName): void
    {
        $this->assertTrue(
            DB::getSchemaBuilder()->hasTable($tableName),
            "Table '{$tableName}' does not exist in tenant database"
        );
    }

    /**
     * Assert that tenant data is properly isolated.
     */
    protected function assertTenantDataIsolation(string $model, array $tenantData, array $otherTenantData): void
    {
        // Create another tenant
        $otherTenant = Tenant::factory()->create([
            'subdomain' => 'other-tenant',
            'database_strategy' => 'shared',
            'database_name' => 'shared_shard_1',
        ]);

        // Create data for current tenant
        $currentTenantModel = $model::create(array_merge($tenantData, [
            'tenant_id' => $this->tenant->id,
        ]));

        // Switch to other tenant and create data
        $this->switchTenant($otherTenant);
        $otherTenantModel = $model::create(array_merge($otherTenantData, [
            'tenant_id' => $otherTenant->id,
        ]));

        // Switch back to original tenant
        $this->switchTenant($this->tenant);

        // Assert that only current tenant's data is visible
        $visibleRecords = $model::all();
        $this->assertCount(1, $visibleRecords);
        $this->assertEquals($currentTenantModel->id, $visibleRecords->first()->id);
    }

    /**
     * Clean up tenant context after test.
     */
    protected function tearDown(): void
    {
        // Reset tenant context
        app()->forgetInstance('tenant');
        DB::setDefaultConnection('testing');

        parent::tearDown();
    }
}
