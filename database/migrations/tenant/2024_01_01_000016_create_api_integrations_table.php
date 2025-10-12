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
        Schema::create('api_integrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->enum('type', [
                'bank', 'payment_processor', 'accounting_software', 'erp', 'crm',
                'ecommerce', 'inventory', 'payroll', 'tax', 'custom',
            ]);
            $table->string('provider');
            $table->enum('status', ['pending', 'connected', 'error', 'disconnected', 'suspended'])->default('pending');
            $table->json('configuration')->nullable();
            $table->text('credentials')->nullable(); // Encrypted
            $table->string('webhook_url')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->enum('sync_frequency', ['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'manual'])->default('daily');
            $table->boolean('is_active')->default(true);
            $table->integer('error_count')->default(0);
            $table->text('last_error')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'provider']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'is_active']);
            $table->index('last_sync_at');

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
        Schema::dropIfExists('api_integrations');
    }
};
