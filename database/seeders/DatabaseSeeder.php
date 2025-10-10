<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a global admin user
        \App\Models\GlobalUser::factory()->create([
            'name' => 'Global Admin',
            'email' => 'admin@example.com',
            'is_super_admin' => true,
        ]);

        // Create sample tenants
        $tenant1 = \App\Models\Tenant::factory()->create([
            'name' => 'Acme Corporation',
            'subdomain' => 'acme',
            'plan' => 'business',
            'database_strategy' => 'shared',
        ]);

        $tenant2 = \App\Models\Tenant::factory()->create([
            'name' => 'TechStart Inc',
            'subdomain' => 'techstart',
            'plan' => 'startup',
            'database_strategy' => 'shared',
        ]);

        // Seed module-specific data if in development
        if (app()->environment('local', 'development')) {
            $this->call([
                // Add module seeders here when they're created
                // OrganizationSeeder::class,
                AccountingSeeder::class,
                // InventorySeeder::class,
            ]);
        }
    }
}
