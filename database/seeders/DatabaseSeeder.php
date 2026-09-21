<?php

namespace Database\Seeders;

use App\Models\GlobalUser;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
// Import module seeders explicitly to avoid Class Not Found errors
use Modules\Accounting\Database\Seeders\AccountingSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create a global admin user explicitly on the 'landlord' connection
        

        // 2. Create sample tenants
        $tenant1 = Tenant::factory()->create([
            'name' => 'Acme Corporation',
            'subdomain' => 'acme',
            'plan' => 'business',
            'database_strategy' => 'shared',
        ]);

        $tenant2 = Tenant::factory()->create([
            'name' => 'TechStart Inc',
            'subdomain' => 'techstart',
            'plan' => 'startup',
            'database_strategy' => 'shared',
        ]);
         GlobalUser::factory()->create([
            'name' => 'Global Admin',
            'email' => 'admin@example.com',
            'is_super_admin' => true,
        ]);
        // 3. Seed module-specific data if in development environment
        if (app()->environment('local', 'development', 'testing')) {
            // Loop through created tenants to seed tenant-scoped data
            foreach ([$tenant1, $tenant2] as $tenant) {
                // Bind current tenant context
                app()->instance('tenant', $tenant);

                $this->call([
                    // OrganizationSeeder::class,
                    AccountingSeeder::class,
                    // InventorySeeder::class,
                ]);

                // Clear tenant context after seeding
                app()->forgetInstance('tenant');
            }
        }
    }
}
