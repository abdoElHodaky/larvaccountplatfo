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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            // Account hierarchy
            $table->string('code', 20)->index(); // Account code (e.g., 1000, 1100, 1110)
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->onDelete('cascade');

            // Account classification
            $table->enum('type', [
                'asset',
                'liability',
                'equity',
                'revenue',
                'expense',
            ])->index();

            $table->enum('subtype', [
                // Assets
                'current_asset',
                'fixed_asset',
                'other_asset',
                // Liabilities
                'current_liability',
                'long_term_liability',
                'other_liability',
                // Equity
                'owner_equity',
                'retained_earnings',
                // Revenue
                'operating_revenue',
                'other_revenue',
                // Expenses
                'operating_expense',
                'other_expense',
                'cost_of_goods_sold',
            ])->index();

            // Account properties
            $table->enum('normal_balance', ['debit', 'credit'])->index();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_system')->default(false); // System accounts cannot be deleted
            $table->boolean('allow_manual_entries')->default(true);

            // Financial properties
            $table->string('currency', 3)->default('USD');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);

            // Tax and reporting
            $table->string('tax_code')->nullable();
            $table->json('reporting_categories')->nullable(); // For financial statement categorization

            // Metadata
            $table->json('metadata')->nullable(); // Additional properties
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'subtype']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'code']);
            $table->unique(['tenant_id', 'code']); // Unique account codes per tenant
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
