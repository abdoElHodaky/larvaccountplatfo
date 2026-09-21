<?php 

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Database\Factories\UserFactory;
/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class GlobalUserFactory extends UserFactory {

        public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => bcrypt('password'),
            // Automatically creates or assigns a tenant if none is provided
            'tenant_id' => Tenant::factory(),
            'is_super_admin' => false,
        ];
    }





}
