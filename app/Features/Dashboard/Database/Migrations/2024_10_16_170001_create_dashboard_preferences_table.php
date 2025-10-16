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
        Schema::create('dashboard_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id');
            
            // Display preferences
            $table->boolean('auto_refresh')->default(true);
            $table->integer('refresh_interval')->default(300); // seconds
            $table->boolean('show_animations')->default(true);
            $table->boolean('compact_mode')->default(false);
            $table->boolean('show_tooltips')->default(true);
            
            // Format preferences
            $table->string('currency_format')->default('USD');
            $table->string('date_format')->default('MM/DD/YYYY');
            $table->string('time_format')->default('12h');
            $table->string('timezone')->default('UTC');
            $table->string('language')->default('en');
            
            // Notification preferences
            $table->boolean('email_alerts')->default(true);
            $table->boolean('browser_notifications')->default(false);
            $table->boolean('sound_alerts')->default(false);
            
            // Privacy preferences
            $table->boolean('share_analytics')->default(false);
            $table->boolean('track_usage')->default(true);
            
            // Accessibility preferences
            $table->boolean('high_contrast')->default(false);
            $table->boolean('large_text')->default(false);
            $table->boolean('reduced_motion')->default(false);
            $table->boolean('screen_reader_support')->default(false);
            
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
            $table->index(['organization_id', 'user_id']);
            $table->index('language');
            $table->index('timezone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboard_preferences');
    }
};

