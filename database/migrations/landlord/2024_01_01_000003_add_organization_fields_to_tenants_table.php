<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'status')) {
                $table->string('status')->default('active')->after('plan');
            }

            if (! Schema::hasColumn('tenants', 'enabled_modules')) {
                $table->json('enabled_modules')->nullable()->after('settings');
            }

            $table->index('status');
            $table->index('plan');
            $table->index('subdomain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Remove indexes
            $table->dropIndex(['status']);
            $table->dropIndex(['plan']);
            $table->dropIndex(['subdomain']);

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
