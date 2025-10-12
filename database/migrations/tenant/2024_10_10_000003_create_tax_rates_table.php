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
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();
            $table->enum('tax_type', [
                'sales_tax', 'vat', 'gst', 'income_tax',
                'payroll_tax', 'property_tax', 'excise_tax',
                'custom_duty', 'other',
            ]);
            $table->decimal('rate', 8, 4); // Supports up to 9999.9999%
            $table->boolean('is_compound')->default(false);
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->string('jurisdiction', 100)->nullable();
            $table->string('tax_authority', 100)->nullable();
            $table->string('reporting_code', 50)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['organization_id', 'is_active']);
            $table->index(['organization_id', 'tax_type']);
            $table->index(['organization_id', 'jurisdiction']);
            $table->index(['effective_from', 'effective_to']);
            $table->index(['is_active', 'effective_from', 'effective_to']);
            $table->unique(['organization_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_rates');
    }
};
