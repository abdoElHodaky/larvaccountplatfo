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
        Schema::create('financial_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->enum('report_type', [
                'balance_sheet',
                'income_statement', 
                'cash_flow',
                'trial_balance',
                'general_ledger',
                'account_aging',
                'custom'
            ]);
            $table->string('report_name');
            $table->enum('period_type', ['monthly', 'quarterly', 'yearly', 'custom'])->default('custom');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('comparison_start_date')->nullable();
            $table->date('comparison_end_date')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->longText('data')->nullable(); // JSON data for the report
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('generated_by')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->string('file_path')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->enum('export_format', ['pdf', 'excel', 'csv', 'json'])->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'report_type']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'start_date', 'end_date']);
            $table->index('generated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_reports');
    }
};

