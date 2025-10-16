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
        Schema::create('dashboard_layouts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id');
            $table->integer('grid_columns')->default(12);
            $table->string('grid_rows')->default('auto');
            $table->json('widget_positions')->nullable();
            $table->string('theme')->default('default');
            $table->boolean('sidebar_collapsed')->default(false);
            $table->boolean('header_visible')->default(true);
            $table->boolean('footer_visible')->default(true);
            $table->text('custom_css')->nullable();
            $table->json('responsive_breakpoints')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
            $table->index(['organization_id', 'user_id']);
            $table->index('theme');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboard_layouts');
    }
};

