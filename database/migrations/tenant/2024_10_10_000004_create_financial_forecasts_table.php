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
        Schema::create('financial_forecasts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('forecast_type', [
                'revenue', 'expense', 'cash_flow', 
                'profit_loss', 'balance_sheet', 'comprehensive'
            ]);
            $table->enum('period_type', ['monthly', 'quarterly', 'yearly']);
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('base_year');
            $table->enum('methodology', [
                'historical_trend', 'regression_analysis', 'seasonal_adjustment',
                'market_based', 'bottom_up', 'top_down', 'scenario_based'
            ]);
            $table->decimal('confidence_level', 5, 2)->default(75.00); // 0.00 to 100.00
            $table->enum('status', ['draft', 'in_review', 'approved', 'active', 'archived'])->default('draft');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->json('assumptions')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'forecast_type']);
            $table->index(['organization_id', 'methodology']);
            $table->index(['start_date', 'end_date']);
            $table->index(['created_by']);
            $table->index(['approved_by']);
            $table->index(['base_year']);

            // Foreign key constraints
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_forecasts');
    }
};
