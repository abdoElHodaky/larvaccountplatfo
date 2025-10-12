<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class Extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');

            // Period information
            $table->date('period_date')->index(); // End date of the period (daily, monthly, yearly)
            $table->enum('period_type', ['daily', 'monthly', 'quarterly', 'yearly'])->index();

            // Balance information
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('debit_total', 15, 2)->default(0);
            $table->decimal('credit_total', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->default(0);

            // Multi-currency support
            $table->string('currency', 3)->default('USD');
            $table->decimal('opening_balance_base', 15, 2)->default(0); // In tenant's base currency
            $table->decimal('debit_total_base', 15, 2)->default(0);
            $table->decimal('credit_total_base', 15, 2)->default(0);
            $table->decimal('closing_balance_base', 15, 2)->default(0);

            // Reconciliation status
            $table->boolean('is_reconciled')->default(false)->index();
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users');

            // Audit information
            $table->timestamp('calculated_at')->nullable(); // When balance was last calculated
            $table->foreignId('calculated_by')->nullable()->constrained('users');

            // Metadata
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'account_id', 'period_date']);
            $table->index(['tenant_id', 'period_type', 'period_date']);
            $table->index(['tenant_id', 'is_reconciled']);
            $table->unique(['tenant_id', 'account_id', 'period_date', 'period_type']); // One balance per account per period
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_balances');
    }
};
