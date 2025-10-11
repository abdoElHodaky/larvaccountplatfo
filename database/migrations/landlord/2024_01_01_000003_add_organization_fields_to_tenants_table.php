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
        Schema::table('tenants', function (Blueprint $table) {
            // Add organization-specific fields if they don't exist
            if (!Schema::hasColumn('tenants', 'status')) {
                $table->string('status')->default('active')->after('plan');
            }
            
            if (!Schema::hasColumn('tenants', 'enabled_modules')) {
                $table->json('enabled_modules')->nullable()->after('settings');
            }

            // Add index for status (plan and subdomain indexes already exist from create migration)
            if (!Schema::hasColumn('tenants', 'status')) {
                // Only add status index if we're adding the status column
                $table->index('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Remove status index only (plan and subdomain indexes are from create migration)
            if (Schema::hasColumn('tenants', 'status')) {
                $table->dropIndex(['status']);
            }

            // Remove columns if they exist
            if (Schema::hasColumn('tenants', 'enabled_modules')) {
                $table->dropColumn('enabled_modules');
            }
            
            if (Schema::hasColumn('tenants', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
