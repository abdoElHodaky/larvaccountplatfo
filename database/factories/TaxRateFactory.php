<?php

namespace Database\Factories;

use App\Features\Accounting\Models\TaxRate;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Accounting\Models\TaxRate>
 */
class TaxRateFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TaxRate::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $taxTypes = ['sales_tax', 'vat', 'gst', 'income_tax', 'payroll_tax', 'property_tax', 'excise_tax', 'custom_duty', 'other'];
        $taxType = $this->faker->randomElement($taxTypes);

        // Generate realistic tax rates based on type
        $rate = match ($taxType) {
            'sales_tax' => $this->faker->randomFloat(2, 3.0, 12.0),
            'vat' => $this->faker->randomElement([5.0, 10.0, 15.0, 20.0, 25.0]),
            'gst' => $this->faker->randomElement([5.0, 10.0, 15.0]),
            'income_tax' => $this->faker->randomFloat(2, 10.0, 45.0),
            'payroll_tax' => $this->faker->randomFloat(2, 1.0, 8.0),
            'property_tax' => $this->faker->randomFloat(2, 0.5, 3.0),
            'excise_tax' => $this->faker->randomFloat(2, 5.0, 50.0),
            'custom_duty' => $this->faker->randomFloat(2, 2.0, 25.0),
            default => $this->faker->randomFloat(2, 1.0, 15.0),
        };

        return [
            'organization_id' => 1,
            'name' => $this->generateTaxName($taxType),
            'code' => strtoupper($this->faker->lexify('???')).'_'.strtoupper(substr($taxType, 0, 3)),
            'description' => $this->faker->sentence(),
            'tax_type' => $taxType,
            'rate' => $rate,
            'is_compound' => $this->faker->boolean(10), // 10% chance of compound tax
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
            'effective_from' => $this->faker->optional(0.8)->dateTimeBetween('-2 years', 'now'),
            'effective_to' => $this->faker->optional(0.3)->dateTimeBetween('now', '+2 years'),
            'jurisdiction' => $this->faker->randomElement([
                'Federal', 'California', 'New York', 'Texas', 'Florida', 'UK', 'Canada', 'Australia', 'Germany',
            ]),
            'tax_authority' => $this->generateTaxAuthority(),
            'reporting_code' => $this->faker->optional(0.7)->regexify('[A-Z]{2}[0-9]{3}'),
            'metadata' => [
                'filing_frequency' => $this->faker->randomElement(['monthly', 'quarterly', 'annually']),
                'due_day' => $this->faker->numberBetween(1, 28),
                'penalty_rate' => $this->faker->randomFloat(2, 0.5, 5.0),
            ],
        ];
    }

    /**
     * Generate a realistic tax name based on type
     */
    private function generateTaxName(string $taxType): string
    {
        return match ($taxType) {
            'sales_tax' => 'Sales Tax - '.$this->faker->state(),
            'vat' => 'VAT - '.$this->faker->randomElement(['Standard Rate', 'Reduced Rate', 'Zero Rate']),
            'gst' => 'GST - '.$this->faker->randomElement(['Standard', 'Reduced', 'Exempt']),
            'income_tax' => $this->faker->randomElement(['Federal', 'State']).' Income Tax',
            'payroll_tax' => 'Payroll Tax - '.$this->faker->state(),
            'property_tax' => 'Property Tax - '.$this->faker->city(),
            'excise_tax' => 'Excise Tax - '.$this->faker->randomElement(['Fuel', 'Tobacco', 'Alcohol']),
            'custom_duty' => 'Custom Duty - '.$this->faker->randomElement(['Import', 'Export']),
            default => $this->faker->words(2, true).' Tax',
        };
    }

    /**
     * Generate a realistic tax authority name
     */
    private function generateTaxAuthority(): string
    {
        $authorities = [
            'Internal Revenue Service',
            'California Department of Tax and Fee Administration',
            'HM Revenue and Customs',
            'Canada Revenue Agency',
            'Australian Taxation Office',
            'Bundesfinanzministerium',
            'Department of Revenue',
            'Tax Administration',
            'Ministry of Finance',
        ];

        return $this->faker->randomElement($authorities);
    }

    /**
     * Indicate that the tax rate is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'effective_from' => Carbon::now()->subMonths(rand(1, 12)),
            'effective_to' => null,
        ]);
    }

    /**
     * Indicate that the tax rate is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'effective_to' => Carbon::now()->subDays(rand(1, 30)),
        ]);
    }

    /**
     * Create a sales tax rate.
     */
    public function salesTax(): static
    {
        return $this->state(fn (array $attributes) => [
            'tax_type' => 'sales_tax',
            'name' => 'Sales Tax - '.$this->faker->state(),
            'rate' => $this->faker->randomFloat(2, 3.0, 12.0),
            'is_compound' => false,
        ]);
    }

    /**
     * Create a VAT rate.
     */
    public function vat(): static
    {
        return $this->state(fn (array $attributes) => [
            'tax_type' => 'vat',
            'name' => 'VAT - Standard Rate',
            'rate' => $this->faker->randomElement([15.0, 20.0, 25.0]),
            'jurisdiction' => 'UK',
            'tax_authority' => 'HM Revenue and Customs',
        ]);
    }

    /**
     * Create a compound tax rate.
     */
    public function compound(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_compound' => true,
            'name' => 'Compound '.$attributes['name'],
        ]);
    }
}
