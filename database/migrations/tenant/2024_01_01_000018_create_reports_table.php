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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['financial', 'operational', 'analytical', 'compliance', 'custom']);
            $table->enum('category', [
                'profit_loss', 'balance_sheet', 'cash_flow', 'trial_balance', 'general_ledger',
                'accounts_receivable', 'accounts_payable', 'inventory', 'sales', 'expenses',
                'tax', 'budget', 'kpi', 'dashboard',
            ]);
            $table->json('query_config')->nullable();
            $table->json('filters')->nullable();
            $table->json('columns')->nullable();
            $table->json('sorting')->nullable();
            $table->json('grouping')->nullable();
            $table->json('aggregations')->nullable();
            $table->json('chart_config')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_scheduled')->default(false);
            $table->json('schedule_config')->nullable();
            $table->timestamp('last_generated_at')->nullable();
            $table->integer('cache_duration')->default(60); // minutes
            $table->unsignedBigInteger('created_by')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'category']);
            $table->index(['organization_id', 'is_public']);
            $table->index(['organization_id', 'is_scheduled']);
            $table->index('last_generated_at');

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
