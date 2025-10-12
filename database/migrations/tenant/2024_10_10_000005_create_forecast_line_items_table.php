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
        Schema::create('forecast_line_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('financial_forecast_id');
            $table->unsignedBigInteger('account_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('forecasted_amount', 15, 2);
            $table->decimal('actual_amount', 15, 2)->nullable();
            $table->decimal('growth_rate', 8, 4)->nullable(); // Percentage growth rate
            $table->decimal('seasonality_factor', 8, 4)->nullable(); // Seasonal adjustment factor
            $table->decimal('confidence_level', 5, 2)->nullable(); // 0.00 to 100.00
            $table->string('methodology', 50)->nullable();
            $table->json('assumptions')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['organization_id', 'financial_forecast_id']);
            $table->index(['organization_id', 'account_id']);
            $table->index(['financial_forecast_id', 'account_id']);
            $table->index(['period_start', 'period_end']);
            $table->index(['methodology']);

            // Foreign key constraints
            $table->foreign('financial_forecast_id')->references('id')->on('financial_forecasts')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forecast_line_items');
    }
};
