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
        Schema::table('accounts', function (Blueprint $table) {
            // Add balance tracking in cents for precision
            $table->bigInteger('balance_amount_cents')->default(0)->after('current_balance');
            $table->string('balance_currency', 3)->default('USD')->after('balance_amount_cents');

            // Add domain-driven design fields
            $table->string('aggregate_id')->nullable()->after('id');
            $table->integer('version')->default(1)->after('aggregate_id');

            // Add audit fields for domain events
            $table->timestamp('last_transaction_at')->nullable()->after('updated_at');
            $table->json('domain_events')->nullable()->after('last_transaction_at');

            // Add indexes for new fields
            $table->index(['aggregate_id']);
            $table->index(['version']);
            $table->index(['balance_amount_cents']);
            $table->index(['last_transaction_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex(['last_transaction_at']);
            $table->dropIndex(['balance_amount_cents']);
            $table->dropIndex(['version']);
            $table->dropIndex(['aggregate_id']);

            $table->dropColumn([
                'balance_amount_cents',
                'balance_currency',
                'aggregate_id',
                'version',
                'last_transaction_at',
                'domain_events',
            ]);
        });
    }
};
