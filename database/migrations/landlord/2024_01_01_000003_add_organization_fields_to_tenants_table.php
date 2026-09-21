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
        // Alter existing tenants table
        Schema::connection('landlord')->table('tenants', function (Blueprint $table) {
            // Add columns safely (will skip if column already exists)
            $table->string('status')->default('active')->after('plan')->change(); // Use change() if modifying, or use simple add:
            // $table->string('status')->default('active')->after('plan');
            
            $table->json('enabled_modules')->nullable()->after('settings');

            // Add indexes
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
        Schema::connection('landlord')->table('tenants', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['status']);
            $table->dropIndex(['plan']);
            $table->dropIndex(['subdomain']);

            // Drop columns
            $table->dropColumn(['enabled_modules', 'status']);
        });
    }
};
