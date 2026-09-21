<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Force this migration to run on the landlord connection.
     */
    protected $connection = 'landlord';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Guard check: Only proceed if the 'tenants' table actually exists
        if (! Schema::connection('landlord')->hasTable('tenants')) {
            return;
        }

        Schema::table('tenants', function (Blueprint $table) {
            // 2. Safe column additions
          //  if (! Schema::connection('landlord')->hasColumn('tenants', 'status')) {
                $table->string('status')->default('active')->after('plan');
           // }

         //   if (! Schema::connection('landlord')->hasColumn('tenants', 'enabled_modules')) {
                $table->json('enabled_modules')->nullable()->after('settings');
           // }

            // 3. Add indexes
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
        if (! Schema::connection('landlord')->hasTable('tenants')) {
            return;
        }

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['plan']);
            $table->dropIndex(['subdomain']);

         //   if (Schema::connection('landlord')->hasColumn('tenants', 'enabled_modules')) {
                $table->dropColumn('enabled_modules');
          //  }

           // if (Schema::connection('landlord')->hasColumn('tenants', 'status')) {
                $table->dropColumn('status');
           // }
        });
    }
};
