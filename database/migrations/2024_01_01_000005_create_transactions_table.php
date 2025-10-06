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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Transaction identification
            $table->string('transaction_number')->index(); // Auto-generated unique number
            $table->string('reference')->nullable(); // External reference (invoice #, check #, etc.)
            $table->enum('type', [
                'journal_entry',
                'invoice',
                'payment',
                'receipt',
                'transfer',
                'adjustment',
                'opening_balance',
                'closing_entry'
            ])->index();
            
            // Transaction details
            $table->date('transaction_date')->index();
            $table->text('description');
            $table->text('notes')->nullable();
            
            // Financial information
            $table->decimal('total_amount', 15, 2); // Total transaction amount
            $table->string('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 10, 6)->default(1.000000); // For multi-currency
            
            // Status and workflow
            $table->enum('status', [
                'draft',
                'pending',
                'approved',
                'posted',
                'cancelled',
                'reversed'
            ])->default('draft')->index();
            
            // Relationships
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('reversed_by')->nullable()->constrained('users');
            $table->foreignId('reversal_of')->nullable()->constrained('transactions'); // If this reverses another transaction
            
            // Source tracking
            $table->string('source_type')->nullable(); // Model class that created this transaction
            $table->unsignedBigInteger('source_id')->nullable(); // ID of the source model
            $table->index(['source_type', 'source_id']);
            
            // Audit trail
            $table->timestamp('posted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable(); // Additional properties
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['tenant_id', 'transaction_date']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_by']);
            $table->unique(['tenant_id', 'transaction_number']); // Unique transaction numbers per tenant
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
