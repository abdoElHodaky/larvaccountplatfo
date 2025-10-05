<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subdomain')->unique();
            $table->string('database_name')->unique();
            $table->enum('database_strategy', ['shared', 'dedicated', 'clustered'])->default('shared');
            $table->enum('plan', ['basic', 'professional', 'enterprise'])->default('basic');
            $table->string('region')->nullable();
            $table->string('database_host')->nullable();
            $table->integer('user_count')->default(0);
            $table->integer('monthly_transaction_count')->default(0);
            $table->decimal('storage_usage_mb', 10, 2)->default(0);
            $table->boolean('requires_data_isolation')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamp('migrated_at')->nullable();
            $table->timestamp('stats_updated_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['subdomain']);
            $table->index(['database_name']);
            $table->index(['database_strategy']);
            $table->index(['plan']);
            $table->index(['region']);
            $table->index(['is_active']);
            $table->index(['user_count']);
            $table->index(['monthly_transaction_count']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};

