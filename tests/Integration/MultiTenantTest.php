<?php

namespace Tests\Integration;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Tests\Shared\TenantTestCase;

class MultiTenantTest extends TenantTestCase
{
    use RefreshDatabase;

    /**
     * Test that tenant context is properly set.
     */
    public function testTenantContextIsSet(): void
    {
        $this->assertCurrentTenant($this->tenant);
        $this->assertEquals('test-tenant', $this->tenant->subdomain);
    }

    /**
     * Test tenant data isolation between different tenants.
     */
    public function testTenantDataIsolation(): void
    {
        // Create two different tenants
        $tenant1 = Tenant::factory()->create(['subdomain' => 'tenant1']);
        $tenant2 = Tenant::factory()->create(['subdomain' => 'tenant2']);

        // Create users for each tenant
        $user1 = User::factory()->create(['tenant_id' => $tenant1->id, 'email' => 'user1@test.com']);
        $user2 = User::factory()->create(['tenant_id' => $tenant2->id, 'email' => 'user2@test.com']);

        // Switch to tenant1 context
        $this->switchTenant($tenant1);

        // Verify only tenant1's user is visible
        $visibleUsers = User::all();
        $this->assertCount(1, $visibleUsers);
        $this->assertEquals($user1->id, $visibleUsers->first()->id);

        // Switch to tenant2 context
        $this->switchTenant($tenant2);

        // Verify only tenant2's user is visible
        $visibleUsers = User::all();
        $this->assertCount(1, $visibleUsers);
        $this->assertEquals($user2->id, $visibleUsers->first()->id);
    }

    /**
     * Test that module data is properly isolated between tenants.
     */
    public function testModuleDataIsolation(): void
    {
        // Skip if Account model doesn't exist yet
        if (! class_exists(Account::class)) {
            $this->markTestSkipped('Account model not available yet');
        }

        $this->assertTenantDataIsolation(
            Account::class,
            [
                'code' => '1000',
                'name' => 'Cash - Tenant 1',
                'type' => 'asset',
                'subtype' => 'current_asset',
            ],
            [
                'code' => '1000',
                'name' => 'Cash - Tenant 2',
                'type' => 'asset',
                'subtype' => 'current_asset',
            ]
        );
    }

    /**
     * Test database strategy switching.
     */
    public function testDatabaseStrategySwitching(): void
    {
        // Test shared database strategy
        $sharedTenant = Tenant::factory()->create([
            'database_strategy' => 'shared',
            'database_name' => 'shared_shard_1',
        ]);

        $this->switchTenant($sharedTenant);
        $this->assertEquals('shared', $sharedTenant->database_strategy);

        // Test dedicated database strategy
        $dedicatedTenant = Tenant::factory()->create([
            'database_strategy' => 'dedicated',
            'database_name' => 'tenant_dedicated_123',
        ]);

        $this->switchTenant($dedicatedTenant);
        $this->assertEquals('dedicated', $dedicatedTenant->database_strategy);
    }

    /**
     * Test tenant module enablement.
     */
    public function testTenantModuleEnablement(): void
    {
        $tenant = Tenant::factory()->create([
            'enabled_modules' => ['Accounting', 'Inventory'],
        ]);

        $this->assertTrue($tenant->hasModule('Accounting'));
        $this->assertTrue($tenant->hasModule('Inventory'));
        $this->assertFalse($tenant->hasModule('Reporting'));
    }

    /**
     * Test tenant user authentication.
     */
    public function testTenantUserAuthentication(): void
    {
        $user = $this->createTestUser();

        $this->actingAsTenantUser($user);

        $this->assertAuthenticated();
        $this->assertEquals($user->id, auth()->id());
        $this->assertEquals($this->tenant->id, auth()->user()->tenant_id);
    }

    /**
     * Test global user authentication.
     */
    public function testGlobalUserAuthentication(): void
    {
        $globalUser = $this->createTestGlobalUser(['is_super_admin' => true]);

        $this->actingAsGlobalUser($globalUser);

        $this->assertAuthenticated('global');
        $this->assertEquals($globalUser->id, auth('global')->id());
        $this->assertTrue(auth('global')->user()->is_super_admin);
    }
}
