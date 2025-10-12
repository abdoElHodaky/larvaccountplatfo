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
        Schema::create('dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Null for global widgets
            $table->string('widget_type', 50);
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(6); // Grid width (1-12)
            $table->integer('height')->default(4); // Grid height
            $table->json('configuration')->nullable(); // Widget-specific configuration
            $table->boolean('is_active')->default(true);
            $table->integer('refresh_interval')->default(300); // Seconds
            $table->string('data_source', 50)->nullable(); // accounting, budget, forecast, etc.
            $table->json('filters')->nullable(); // Data filtering options
            $table->json('display_options')->nullable(); // Display customization
            $table->json('permissions')->nullable(); // Access control
            $table->json('metadata')->nullable(); // Additional metadata
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['organization_id', 'is_active']);
            $table->index(['organization_id', 'user_id']);
            $table->index(['widget_type', 'is_active']);
            $table->index(['data_source']);
            $table->index(['position_x', 'position_y']);

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboard_widgets');
    }
};
