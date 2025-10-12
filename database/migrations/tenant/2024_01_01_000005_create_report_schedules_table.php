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
        Schema::create('report_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('financial_report_id')->nullable(); // Template report
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
            $table->json('frequency_config')->nullable(); // Configuration for frequency (day of week, month, etc.)
            $table->json('recipients'); // Email addresses to send reports to
            $table->json('export_formats'); // Array of formats to export (pdf, excel, csv)
            $table->boolean('is_active')->default(true);
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->json('settings')->nullable(); // Additional settings
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'is_active']);
            $table->index(['is_active', 'next_run_at']);
            $table->index('frequency');

            // Foreign keys
            $table->foreign('financial_report_id')->references('id')->on('financial_reports')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_schedules');
    }
};
