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
            'subdomain' => $this->faker->unique()->slug(2),
            'database_name' => 'tenant_' . $this->faker->unique()->randomNumber(5),
            'database_strategy' => $this->faker->randomElement(['shared', 'dedicated', 'clustered']),
            'plan' => $this->faker->randomElement(['free', 'basic', 'premium', 'enterprise']),
            'status' => $this->faker->randomElement(['active', 'inactive', 'suspended', 'pending']),
            'region' => $this->faker->randomElement(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']),
            'database_host' => $this->faker->ipv4(),
            'user_count' => $this->faker->numberBetween(1, 10000),
            'monthly_transaction_count' => $this->faker->numberBetween(0, 1000000),
            'storage_usage_mb' => $this->faker->randomFloat(2, 0, 10000),
            'requires_data_isolation' => $this->faker->boolean(20), // 20% chance of requiring isolation
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
            'settings' => [
                'timezone' => $this->faker->timezone(),
                'currency' => $this->faker->currencyCode(),
                'date_format' => $this->faker->randomElement(['Y-m-d', 'd/m/Y', 'm/d/Y']),
                'notifications' => [
                    'email' => $this->faker->boolean(),
                    'sms' => $this->faker->boolean(),
                    'push' => $this->faker->boolean(),
                ],
            ],
            'enabled_modules' => $this->faker->randomElements([
                'accounting',
                'inventory',
                'sales',
                'purchase',
                'reporting',
                'dashboard',
                'auth',
                'organization'
            ], $this->faker->numberBetween(3, 8)),
            'migrated_at' => $this->faker->optional(0.3)->dateTimeBetween('-1 year', 'now'),
            'stats_updated_at' => $this->faker->optional(0.8)->dateTimeBetween('-1 week', 'now'),
        ];
    }

    /**
     * Indicate that the tenant is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'status' => 'active',
        ]);
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
     * Indicate that the tenant uses a shared database strategy.
     */
    public function shared(): static
    {
        return $this->state(fn (array $attributes) => [
            'database_strategy' => 'shared',
            'database_name' => null,
            'database_host' => null,
        ]);
    }

    /**
     * Indicate that the tenant uses a dedicated database strategy.
     */
    public function dedicated(): static
    {
        return $this->state(fn (array $attributes) => [
            'database_strategy' => 'dedicated',
            'database_name' => 'tenant_' . $this->faker->unique()->randomNumber(5) . '_dedicated',
            'requires_data_isolation' => true,
        ]);
    }

    /**
     * Indicate that the tenant uses a clustered database strategy.
     */
    public function clustered(): static
    {
        return $this->state(fn (array $attributes) => [
            'database_strategy' => 'clustered',
            'database_name' => null,
        ]);
    }

    /**
     * Indicate that the tenant is on the enterprise plan.
     */
    public function enterprise(): static
    {
        return $this->state(fn (array $attributes) => [
            'plan' => 'enterprise',
            'user_count' => $this->faker->numberBetween(1000, 50000),
            'monthly_transaction_count' => $this->faker->numberBetween(100000, 10000000),
            'requires_data_isolation' => true,
        ]);
    }

    /**
     * Indicate that the tenant is on the free plan.
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'plan' => 'free',
            'user_count' => $this->faker->numberBetween(1, 10),
            'monthly_transaction_count' => $this->faker->numberBetween(0, 1000),
            'storage_usage_mb' => $this->faker->randomFloat(2, 0, 100),
        ]);
    }

    /**
     * Indicate that the tenant needs stats update.
     */
    public function needsStatsUpdate(): static
    {
        return $this->state(fn (array $attributes) => [
            'stats_updated_at' => $this->faker->dateTimeBetween('-1 month', '-1 week'),
        ]);
    }

    /**
     * Indicate that the tenant is a promotion candidate.
     */
    public function promotionCandidate(): static
    {
        return $this->state(fn (array $attributes) => [
            'database_strategy' => 'shared',
            'user_count' => $this->faker->numberBetween(1000, 5000),
            'monthly_transaction_count' => $this->faker->numberBetween(100000, 500000),
            'plan' => $this->faker->randomElement(['premium', 'enterprise']),
            'requires_data_isolation' => $this->faker->boolean(70),
        ]);
    }
}
