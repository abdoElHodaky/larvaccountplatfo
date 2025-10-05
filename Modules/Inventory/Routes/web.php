<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;

/*
|--------------------------------------------------------------------------
| Inventory Web Routes
|--------------------------------------------------------------------------
|
| Here are the web routes for the Inventory module. These routes are loaded
| by the InventoryServiceProvider and are assigned the "web" middleware group.
|
*/

Route::middleware(['auth', 'tenant.resolve'])->prefix('inventory')->group(function () {
    
    // Dashboard
    Route::get('/', [InventoryController::class, 'dashboard'])->name('inventory.dashboard');
    Route::get('/dashboard', [InventoryController::class, 'dashboard'])->name('inventory.dashboard.show');

    // Products Management
    Route::prefix('products')->group(function () {
        Route::get('/', [InventoryController::class, 'products'])->name('inventory.products.index');
        Route::get('/create', [InventoryController::class, 'createProductForm'])->name('inventory.products.create');
        Route::post('/', [InventoryController::class, 'createProduct'])->name('inventory.products.store');
        Route::get('/{id}', [InventoryController::class, 'showProduct'])->name('inventory.products.show');
        Route::get('/{id}/edit', [InventoryController::class, 'editProductForm'])->name('inventory.products.edit');
        Route::put('/{id}', [InventoryController::class, 'updateProduct'])->name('inventory.products.update');
        Route::delete('/{id}', [InventoryController::class, 'deleteProduct'])->name('inventory.products.destroy');
        
        // Product categories
        Route::get('/categories', [InventoryController::class, 'productCategories'])->name('inventory.products.categories');
        Route::post('/categories', [InventoryController::class, 'createProductCategory'])->name('inventory.products.categories.store');
    });

    // Stock Management
    Route::prefix('stock')->group(function () {
        Route::get('/', [InventoryController::class, 'stockLevels'])->name('inventory.stock.index');
        Route::get('/levels', [InventoryController::class, 'stockLevels'])->name('inventory.stock.levels');
        Route::get('/movements', [InventoryController::class, 'stockMovements'])->name('inventory.stock.movements');
        Route::get('/low-stock', [InventoryController::class, 'lowStockProducts'])->name('inventory.stock.low_stock');
        
        // Stock operations
        Route::get('/adjust', [InventoryController::class, 'stockAdjustmentForm'])->name('inventory.stock.adjust_form');
        Route::post('/adjust', [InventoryController::class, 'adjustStock'])->name('inventory.stock.adjust');
        Route::get('/transfer', [InventoryController::class, 'stockTransferForm'])->name('inventory.stock.transfer_form');
        Route::post('/transfer', [InventoryController::class, 'transferStock'])->name('inventory.stock.transfer');
        
        // Stock counting
        Route::get('/count', [InventoryController::class, 'stockCountForm'])->name('inventory.stock.count_form');
        Route::post('/count', [InventoryController::class, 'performStockCount'])->name('inventory.stock.count');
    });

    // Warehouses Management
    Route::prefix('warehouses')->group(function () {
        Route::get('/', [InventoryController::class, 'warehouses'])->name('inventory.warehouses.index');
        Route::get('/create', [InventoryController::class, 'createWarehouseForm'])->name('inventory.warehouses.create');
        Route::post('/', [InventoryController::class, 'createWarehouse'])->name('inventory.warehouses.store');
        Route::get('/{id}', [InventoryController::class, 'showWarehouse'])->name('inventory.warehouses.show');
        Route::get('/{id}/edit', [InventoryController::class, 'editWarehouseForm'])->name('inventory.warehouses.edit');
        Route::put('/{id}', [InventoryController::class, 'updateWarehouse'])->name('inventory.warehouses.update');
        Route::delete('/{id}', [InventoryController::class, 'deleteWarehouse'])->name('inventory.warehouses.destroy');
    });

    // Suppliers Management
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [InventoryController::class, 'suppliers'])->name('inventory.suppliers.index');
        Route::get('/create', [InventoryController::class, 'createSupplierForm'])->name('inventory.suppliers.create');
        Route::post('/', [InventoryController::class, 'createSupplier'])->name('inventory.suppliers.store');
        Route::get('/{id}', [InventoryController::class, 'showSupplier'])->name('inventory.suppliers.show');
        Route::get('/{id}/edit', [InventoryController::class, 'editSupplierForm'])->name('inventory.suppliers.edit');
        Route::put('/{id}', [InventoryController::class, 'updateSupplier'])->name('inventory.suppliers.update');
        Route::delete('/{id}', [InventoryController::class, 'deleteSupplier'])->name('inventory.suppliers.destroy');
    });

    // Purchase Orders Management
    Route::prefix('purchase-orders')->group(function () {
        Route::get('/', [InventoryController::class, 'purchaseOrders'])->name('inventory.purchase_orders.index');
        Route::get('/create', [InventoryController::class, 'createPurchaseOrderForm'])->name('inventory.purchase_orders.create');
        Route::post('/', [InventoryController::class, 'createPurchaseOrder'])->name('inventory.purchase_orders.store');
        Route::get('/{id}', [InventoryController::class, 'showPurchaseOrder'])->name('inventory.purchase_orders.show');
        Route::get('/{id}/edit', [InventoryController::class, 'editPurchaseOrderForm'])->name('inventory.purchase_orders.edit');
        Route::put('/{id}', [InventoryController::class, 'updatePurchaseOrder'])->name('inventory.purchase_orders.update');
        Route::delete('/{id}', [InventoryController::class, 'deletePurchaseOrder'])->name('inventory.purchase_orders.destroy');
        
        // Purchase order actions
        Route::post('/{id}/approve', [InventoryController::class, 'approvePurchaseOrder'])->name('inventory.purchase_orders.approve');
        Route::post('/{id}/send', [InventoryController::class, 'sendPurchaseOrder'])->name('inventory.purchase_orders.send');
        Route::post('/{id}/cancel', [InventoryController::class, 'cancelPurchaseOrder'])->name('inventory.purchase_orders.cancel');
        Route::get('/{id}/receive', [InventoryController::class, 'receivePurchaseOrderForm'])->name('inventory.purchase_orders.receive_form');
        Route::post('/{id}/receive', [InventoryController::class, 'receivePurchaseOrder'])->name('inventory.purchase_orders.receive');
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/', [InventoryController::class, 'reportsIndex'])->name('inventory.reports.index');
        Route::get('/valuation', [InventoryController::class, 'inventoryValuationReport'])->name('inventory.reports.valuation');
        Route::get('/aging', [InventoryController::class, 'inventoryAgingReport'])->name('inventory.reports.aging');
        Route::get('/movement-summary', [InventoryController::class, 'movementSummaryReport'])->name('inventory.reports.movement_summary');
        Route::get('/stock-turnover', [InventoryController::class, 'stockTurnoverReport'])->name('inventory.reports.turnover');
        Route::get('/reorder-report', [InventoryController::class, 'reorderReport'])->name('inventory.reports.reorder');
        
        // Export reports
        Route::get('/export/valuation', [InventoryController::class, 'exportValuationReport'])->name('inventory.reports.export.valuation');
        Route::get('/export/aging', [InventoryController::class, 'exportAgingReport'])->name('inventory.reports.export.aging');
        Route::get('/export/movements', [InventoryController::class, 'exportMovementsReport'])->name('inventory.reports.export.movements');
    });

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [InventoryController::class, 'inventorySettings'])->name('inventory.settings.index');
        Route::post('/', [InventoryController::class, 'updateInventorySettings'])->name('inventory.settings.update');
        Route::get('/valuation-methods', [InventoryController::class, 'valuationMethodsSettings'])->name('inventory.settings.valuation_methods');
        Route::get('/alerts', [InventoryController::class, 'alertSettings'])->name('inventory.settings.alerts');
    });

    // Real-time monitoring (for admin users)
    Route::prefix('monitoring')->middleware('can:admin_inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'realtimeMonitoring'])->name('inventory.monitoring.index');
        Route::get('/stock-levels', [InventoryController::class, 'realtimeStockLevels'])->name('inventory.monitoring.stock_levels');
        Route::get('/alerts', [InventoryController::class, 'realtimeAlerts'])->name('inventory.monitoring.alerts');
        Route::get('/movements', [InventoryController::class, 'realtimeMovements'])->name('inventory.monitoring.movements');
    });
});

