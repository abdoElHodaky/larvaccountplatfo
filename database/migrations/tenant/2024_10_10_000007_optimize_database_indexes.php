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
        // Optimize accounts table indexes
        Schema::table('accounts', function (Blueprint $table) {
            // Add composite indexes for common query patterns
            $table->index(['organization_id', 'type', 'is_active'], 'accounts_org_type_active_idx');
            $table->index(['organization_id', 'parent_id', 'is_active'], 'accounts_org_parent_active_idx');
            $table->index(['code', 'organization_id'], 'accounts_code_org_idx');
            $table->index(['name', 'organization_id'], 'accounts_name_org_idx');
            $table->index(['level', 'type'], 'accounts_level_type_idx');
        });

        // Optimize transactions table indexes
        Schema::table('transactions', function (Blueprint $table) {
            // Add composite indexes for reporting and analysis
            $table->index(['organization_id', 'transaction_date', 'status'], 'transactions_org_date_status_idx');
            $table->index(['organization_id', 'type', 'transaction_date'], 'transactions_org_type_date_idx');
            $table->index(['organization_id', 'status', 'total_amount'], 'transactions_org_status_amount_idx');
            $table->index(['transaction_date', 'type'], 'transactions_date_type_idx');
            $table->index(['reference', 'organization_id'], 'transactions_ref_org_idx');
        });

        // Optimize journal_entries table indexes
        Schema::table('journal_entries', function (Blueprint $table) {
            // Add composite indexes for balance calculations
            $table->index(['account_id', 'transaction_id'], 'journal_entries_account_transaction_idx');
            $table->index(['organization_id', 'account_id', 'amount'], 'journal_entries_org_account_amount_idx');
            $table->index(['transaction_id', 'type'], 'journal_entries_transaction_type_idx');
        });

        // Add indexes to existing tables that might not have optimal indexing
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['organization_id', 'is_active'], 'products_org_active_idx');
                $table->index(['organization_id', 'category_id'], 'products_org_category_idx');
                $table->index(['sku', 'organization_id'], 'products_sku_org_idx');
            });
        }

        if (Schema::hasTable('stock_movements')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->index(['organization_id', 'product_id', 'movement_date'], 'stock_movements_org_product_date_idx');
                $table->index(['warehouse_id', 'movement_date'], 'stock_movements_warehouse_date_idx');
                $table->index(['movement_type', 'movement_date'], 'stock_movements_type_date_idx');
            });
        }

        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->index(['organization_id', 'status', 'order_date'], 'purchase_orders_org_status_date_idx');
                $table->index(['supplier_id', 'status'], 'purchase_orders_supplier_status_idx');
                $table->index(['order_date', 'status'], 'purchase_orders_date_status_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop accounts table indexes
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex('accounts_org_type_active_idx');
            $table->dropIndex('accounts_org_parent_active_idx');
            $table->dropIndex('accounts_code_org_idx');
            $table->dropIndex('accounts_name_org_idx');
            $table->dropIndex('accounts_level_type_idx');
        });

        // Drop transactions table indexes
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_org_date_status_idx');
            $table->dropIndex('transactions_org_type_date_idx');
            $table->dropIndex('transactions_org_status_amount_idx');
            $table->dropIndex('transactions_date_type_idx');
            $table->dropIndex('transactions_ref_org_idx');
        });

        // Drop journal_entries table indexes
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropIndex('journal_entries_account_transaction_idx');
            $table->dropIndex('journal_entries_org_account_amount_idx');
            $table->dropIndex('journal_entries_transaction_type_idx');
        });

        // Drop product-related indexes if they exist
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex('products_org_active_idx');
                $table->dropIndex('products_org_category_idx');
                $table->dropIndex('products_sku_org_idx');
            });
        }

        if (Schema::hasTable('stock_movements')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropIndex('stock_movements_org_product_date_idx');
                $table->dropIndex('stock_movements_warehouse_date_idx');
                $table->dropIndex('stock_movements_type_date_idx');
            });
        }

        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->dropIndex('purchase_orders_org_status_date_idx');
                $table->dropIndex('purchase_orders_supplier_status_idx');
                $table->dropIndex('purchase_orders_date_status_idx');
            });
        }
    }
};
