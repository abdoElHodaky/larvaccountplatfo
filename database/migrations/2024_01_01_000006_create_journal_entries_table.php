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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            
            // Entry details
            $table->enum('type', ['debit', 'credit'])->index();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 10, 6)->default(1.000000);
            $table->decimal('base_amount', 15, 2); // Amount in tenant's base currency
            
            // Entry description and reference
            $table->text('description')->nullable();
            $table->string('reference')->nullable(); // Line-specific reference
            
            // Reconciliation
            $table->boolean('is_reconciled')->default(false)->index();
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users');
            
            // Dimensions for reporting (optional)
            $table->string('department')->nullable();
            $table->string('project')->nullable();
            $table->string('cost_center')->nullable();
            $table->json('dimensions')->nullable(); // Additional custom dimensions
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['tenant_id', 'transaction_id']);
            $table->index(['tenant_id', 'account_id']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'is_reconciled']);
            $table->index(['tenant_id', 'account_id', 'type']); // For balance calculations
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
