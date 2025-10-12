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
        Schema::create('product_suppliers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('supplier_id');
            $table->string('supplier_sku', 100)->nullable();
            $table->decimal('cost_price', 15, 4);
            $table->integer('lead_time_days')->default(0);
            $table->decimal('minimum_order_quantity', 15, 2)->default(1);
            $table->timestamps();

            // Indexes
            $table->index(['product_id', 'supplier_id']);
            $table->index('supplier_sku');

            // Unique constraint
            $table->unique(['product_id', 'supplier_id']);

            // Foreign keys
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_suppliers');
    }
};
