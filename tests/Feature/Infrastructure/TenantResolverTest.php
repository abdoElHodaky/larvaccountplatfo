<?php

namespace Tests\Feature\Infrastructure;

use App\Infrastructure\Database\TenantResolver;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TenantResolverTest extends TestCase
{
    use RefreshDatabase;

    private TenantResolver $tenantResolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenantResolver = app(TenantResolver::class);
    }

    /** @test */
    public function itDeterminesDedicatedStrategyForEnterprisePlan()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'enterprise',
            'user_count' => 500,
            'monthly_transaction_count' => 50000,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('dedicated', $strategy);
    }

    /** @test */
    public function itDeterminesDedicatedStrategyForHighUserCount()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'standard',
            'user_count' => 1500,
            'monthly_transaction_count' => 50000,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('dedicated', $strategy);
    }

    /** @test */
    public function itDeterminesDedicatedStrategyForHighTransactionCount()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'standard',
            'user_count' => 500,
            'monthly_transaction_count' => 150000,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('dedicated', $strategy);
    }

    /** @test */
    public function itDeterminesDedicatedStrategyForDataIsolationRequirement()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'standard',
            'user_count' => 100,
            'monthly_transaction_count' => 10000,
            'requires_data_isolation' => true,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('dedicated', $strategy);
    }

    /** @test */
    public function itDeterminesClusteredStrategyForRegionalTenant()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'standard',
            'user_count' => 100,
            'monthly_transaction_count' => 10000,
            'region' => 'us-east-1',
            'requires_data_isolation' => false,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('clustered', $strategy);
    }

    /** @test */
    public function itDeterminesSharedStrategyForSmallTenant()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'basic',
            'user_count' => 50,
            'monthly_transaction_count' => 5000,
            'region' => null,
            'requires_data_isolation' => false,
        ]);

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('shared', $strategy);
    }

    /** @test */
    public function itGetsCorrectConnectionNameForDedicatedTenant()
    {
        $tenant = Tenant::factory()->create(['id' => 123, 'plan' => 'enterprise']);

        $connectionName = $this->tenantResolver->getConnectionName($tenant);

        $this->assertEquals('tenant_123', $connectionName);
    }

    /** @test */
    public function itGetsCorrectConnectionNameForSharedTenant()
    {
        $tenant = Tenant::factory()->create(['id' => 8, 'plan' => 'basic']);

        $connectionName = $this->tenantResolver->getConnectionName($tenant);

        // Shard number = (8 % 4) + 1 = 1
        $this->assertEquals('shared_shard_1', $connectionName);
    }

    /** @test */
    public function itGetsCorrectConnectionNameForClusteredTenant()
    {
        $tenant = Tenant::factory()->create([
            'plan' => 'standard',
            'user_count' => 100,
            'region' => 'eu-west-1',
        ]);

        $connectionName = $this->tenantResolver->getConnectionName($tenant);

        $this->assertEquals('cluster_eu-west-1', $connectionName);
    }

    /** @test */
    public function itSetsTenantConnectionAndUpdatesConfig()
    {
        $tenant = Tenant::factory()->create(['id' => 456, 'plan' => 'enterprise']);

        $this->tenantResolver->setTenantConnection($tenant);

        $this->assertEquals('tenant_456', config('database.default'));
    }

    /** @test */
    public function itResolvesTenantFromAuthenticatedUser()
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['current_tenant_id' => $tenant->id]);

        $this->actingAs($user);

        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertEquals($tenant->id, $resolvedTenant->id);
    }

    /** @test */
    public function itResolvesTenantFromSubdomain()
    {
        $tenant = Tenant::factory()->create(['subdomain' => 'acme']);

        $this->app['request']->server->set('HTTP_HOST', 'acme.example.com');

        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertEquals($tenant->id, $resolvedTenant->id);
    }

    /** @test */
    public function itResolvesTenantFromHeader()
    {
        $tenant = Tenant::factory()->create();

        $this->withHeaders(['X-Tenant-ID' => $tenant->id]);

        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertEquals($tenant->id, $resolvedTenant->id);
    }

    /** @test */
    public function itCachesTenantResolutionResults()
    {
        $tenant = Tenant::factory()->create();

        Cache::shouldReceive('remember')
            ->once()
            ->with("tenant_db_strategy_{$tenant->id}", 300, \Closure::class)
            ->andReturn('shared');

        $strategy = $this->tenantResolver->determineDatabaseStrategy($tenant);

        $this->assertEquals('shared', $strategy);
    }

    /** @test */
    public function itCreatesDedicatedConnectionConfiguration()
    {
        $tenant = Tenant::factory()->create(['id' => 789]);

        $config = $this->tenantResolver->createDedicatedConnection($tenant);

        $this->assertEquals('mysql', $config['driver']);
        $this->assertEquals('tenant_789', $config['database']);
        $this->assertEquals('utf8mb4', $config['charset']);
        $this->assertEquals('utf8mb4_unicode_ci', $config['collation']);
    }

    /** @test */
    public function itReturnsNullWhenNoTenantContextAvailable()
    {
        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertNull($resolvedTenant);
    }

    /** @test */
    public function itHandlesInvalidSubdomainGracefully()
    {
        $this->app['request']->server->set('HTTP_HOST', 'www.example.com');

        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertNull($resolvedTenant);
    }

    /** @test */
    public function itHandlesNonexistentTenantIdInHeader()
    {
        $this->withHeaders(['X-Tenant-ID' => 99999]);

        $resolvedTenant = $this->tenantResolver->resolveTenantFromRequest();

        $this->assertNull($resolvedTenant);
    }
}
