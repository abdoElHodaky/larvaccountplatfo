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
        Schema::create('domain_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->unique();
            $table->string('event_type');
            $table->string('aggregate_id');
            $table->string('aggregate_type');
            $table->integer('version')->default(1);
            $table->timestamp('occurred_at');
            $table->json('payload');
            $table->json('metadata')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->boolean('is_processed')->default(false);
            $table->text('processing_error')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamps();

            // Indexes for efficient querying
            $table->index(['event_type']);
            $table->index(['aggregate_id', 'aggregate_type']);
            $table->index(['occurred_at']);
            $table->index(['is_processed']);
            $table->index(['aggregate_id', 'version']);

            // Composite index for event sourcing
            $table->index(['aggregate_id', 'aggregate_type', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_events');
    }
};
