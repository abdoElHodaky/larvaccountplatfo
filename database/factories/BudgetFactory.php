<?php

namespace Database\Factories;

use App\Features\Accounting\Models\Budget;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Accounting\Models\Budget>
 */
class BudgetFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Budget::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', '+1 year');
        $endDate = (clone $startDate)->modify('+1 year');

        return [
            'organization_id' => 1,
            'name' => $this->faker->words(3, true).' Budget',
            'description' => $this->faker->sentence(),
            'budget_type' => $this->faker->randomElement(['operational', 'capital', 'project', 'department']),
            'period_type' => $this->faker->randomElement(['monthly', 'quarterly', 'yearly', 'custom']),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_amount' => $this->faker->randomFloat(2, 10000, 1000000),
            'status' => $this->faker->randomElement(['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled']),
            'created_by' => 1,
            'approved_by' => $this->faker->optional(0.7)->randomElement([1, 2, 3]),
            'approved_at' => $this->faker->optional(0.7)->dateTimeBetween('-6 months', 'now'),
            'metadata' => [
                'department' => $this->faker->randomElement(['Sales', 'Marketing', 'Operations', 'IT']),
                'priority' => $this->faker->randomElement(['high', 'medium', 'low']),
                'tags' => $this->faker->words(3),
            ],
        ];
    }

    /**
     * Indicate that the budget is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(rand(1, 30)),
        ]);
    }

    /**
     * Indicate that the budget is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
        ]);
    }

    /**
     * Indicate that the budget is operational.
     */
    public function operational(): static
    {
        return $this->state(fn (array $attributes) => [
            'budget_type' => 'operational',
            'name' => 'Operational Budget '.$this->faker->year(),
        ]);
    }

    /**
     * Indicate that the budget is for a specific year.
     */
    public function forYear(int $year): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => Carbon::create($year, 1, 1),
            'end_date' => Carbon::create($year, 12, 31),
            'name' => $year.' '.$this->faker->words(2, true).' Budget',
        ]);
    }
}
