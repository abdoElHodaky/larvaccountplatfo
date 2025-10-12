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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('sku', 100)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['inventory', 'non_inventory', 'service', 'bundle'])->default('inventory');
            $table->enum('status', ['active', 'inactive', 'discontinued'])->default('active');
            $table->enum('unit_of_measure', ['piece', 'kg', 'g', 'l', 'm', 'cm', 'sqm', 'cbm'])->default('piece');
            $table->decimal('cost_price', 15, 4)->nullable();
            $table->decimal('selling_price', 15, 4)->nullable();
            $table->decimal('minimum_stock_level', 15, 2)->default(0);
            $table->decimal('maximum_stock_level', 15, 2)->default(0);
            $table->decimal('reorder_point', 15, 2)->default(0);
            $table->decimal('reorder_quantity', 15, 2)->default(0);
            $table->decimal('weight', 10, 3)->nullable();
            $table->json('dimensions')->nullable();
            $table->string('barcode')->nullable();
            $table->decimal('tax_rate', 5, 4)->default(0);
            $table->boolean('is_trackable')->default(true);
            $table->boolean('is_serialized')->default(false);
            $table->enum('valuation_method', ['fifo', 'lifo', 'weighted_average', 'specific_identification'])->default('weighted_average');
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'category_id']);
            $table->index(['organization_id', 'is_trackable']);
            $table->index('sku');
            $table->index('barcode');
            $table->index(['name', 'organization_id']);

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('product_categories')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
