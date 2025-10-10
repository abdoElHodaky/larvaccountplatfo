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
        Schema::table('transactions', function (Blueprint $table) {
            // Add tax-related columns
            $table->unsignedBigInteger('tax_rate_id')->nullable()->after('total_amount');
            $table->decimal('tax_amount', 15, 2)->default(0)->after('tax_rate_id');
            $table->decimal('subtotal_amount', 15, 2)->nullable()->after('tax_amount');
            $table->json('tax_breakdown')->nullable()->after('subtotal_amount');
            
            // Add indexes for tax-related queries
            $table->index(['organization_id', 'tax_rate_id']);
            $table->index(['transaction_date', 'tax_rate_id']);
            
            // Add foreign key constraint
            $table->foreign('tax_rate_id')->references('id')->on('tax_rates')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['tax_rate_id']);
            
            // Drop indexes
            $table->dropIndex(['organization_id', 'tax_rate_id']);
            $table->dropIndex(['transaction_date', 'tax_rate_id']);
            
            // Drop columns
            $table->dropColumn([
                'tax_rate_id',
                'tax_amount',
                'subtotal_amount',
                'tax_breakdown'
            ]);
        });
    }
};
