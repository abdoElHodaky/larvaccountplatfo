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
        Schema::create('performance_metrics', function (Blueprint $table) {
            $table->id();
            $table->timestamp('timestamp');
            $table->json('metrics'); // Complete metrics data
            $table->integer('alerts_count')->default(0);
            $table->float('response_time')->nullable(); // Average response time
            $table->float('memory_usage_percentage')->nullable(); // Memory usage %
            $table->float('cache_hit_rate')->nullable(); // Cache hit rate
            $table->integer('database_queries')->nullable(); // Number of DB queries
            $table->float('cpu_usage')->nullable(); // CPU usage %
            $table->bigInteger('disk_usage')->nullable(); // Disk usage in bytes
            $table->json('alerts')->nullable(); // Alert details
            $table->timestamps();

            // Indexes for performance
            $table->index('timestamp');
            $table->index('alerts_count');
            $table->index(['timestamp', 'alerts_count']);
            $table->index('response_time');
            $table->index('memory_usage_percentage');
            $table->index('cache_hit_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_metrics');
    }
};
