<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Tenant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'subdomain' => $this->faker->unique()->slug(),
            'database_name' => 'shared_shard_1',
            'database_strategy' => 'shared',
            'plan' => 'basic',
            'status' => 'active',
            'region' => 'us-east-1',
            'database_host' => 'localhost',
            'user_count' => $this->faker->numberBetween(1, 100),
            'monthly_transaction_count' => $this->faker->numberBetween(0, 10000),
            'storage_usage_mb' => $this->faker->randomFloat(2, 0, 1000),
            'requires_data_isolation' => false,
            'is_active' => true,
            'settings' => [],
            'enabled_modules' => ['Accounting', 'Inventory', 'Reporting'],
            'migrated_at' => now(),
            'stats_updated_at' => now(),
        ];
    }

    /**
     * Indicate that the tenant is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the tenant requires data isolation.
     */
    public function isolated(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_data_isolation' => true,
            'database_strategy' => 'dedicated',
            'database_name' => 'tenant_' . $this->faker->unique()->slug(),
        ]);
    }
}

