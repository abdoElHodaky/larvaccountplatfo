<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;

/*
|--------------------------------------------------------------------------
| Inventory API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the Inventory module. These routes are loaded
| by the InventoryServiceProvider and are assigned the "api" middleware group.
|
*/

Route::middleware(['auth:sanctum', 'tenant.resolve'])->prefix('api/inventory')->group(function () {
    
    // Dashboard and Overview
    Route::get('/dashboard', [InventoryController::class, 'dashboard'])->name('api.inventory.dashboard');
    Route::get('/metadata', [InventoryController::class, 'metadata'])->name('api.inventory.metadata');

    // Products Management
    Route::prefix('products')->group(function () {
        Route::get('/', [InventoryController::class, 'products'])->name('api.inventory.products.index');
        Route::post('/', [InventoryController::class, 'createProduct'])->name('api.inventory.products.create');
        Route::get('/{id}', [InventoryController::class, 'showProduct'])->name('api.inventory.products.show');
        Route::put('/{id}', [InventoryController::class, 'updateProduct'])->name('api.inventory.products.update');
        Route::delete('/{id}', [InventoryController::class, 'deleteProduct'])->name('api.inventory.products.delete');
        
        // Product-specific stock operations
        Route::get('/{id}/stock-levels', [InventoryController::class, 'productStockLevels'])->name('api.inventory.products.stock_levels');
        Route::get('/{id}/movements', [InventoryController::class, 'productStockMovements'])->name('api.inventory.products.movements');
    });

    // Stock Management
    Route::prefix('stock')->group(function () {
        // Stock levels
        Route::get('/levels', [InventoryController::class, 'stockLevels'])->name('api.inventory.stock.levels');
        Route::get('/low-stock', [InventoryController::class, 'lowStockProducts'])->name('api.inventory.stock.low_stock');
        Route::get('/reorder-needed', [InventoryController::class, 'productsNeedingReorder'])->name('api.inventory.stock.reorder_needed');
        
        // Stock movements
        Route::get('/movements', [InventoryController::class, 'stockMovements'])->name('api.inventory.stock.movements');
        Route::post('/adjust', [InventoryController::class, 'adjustStock'])->name('api.inventory.stock.adjust');
        Route::post('/transfer', [InventoryController::class, 'transferStock'])->name('api.inventory.stock.transfer');
        
        // Stock reservations
        Route::post('/reserve', [InventoryController::class, 'reserveStock'])->name('api.inventory.stock.reserve');
        Route::post('/release-reservation', [InventoryController::class, 'releaseReservedStock'])->name('api.inventory.stock.release_reservation');
    });

    // Reports and Analytics
    Route::prefix('reports')->group(function () {
        Route::get('/valuation', [InventoryController::class, 'inventoryValuation'])->name('api.inventory.reports.valuation');
        Route::get('/aging', [InventoryController::class, 'inventoryAging'])->name('api.inventory.reports.aging');
        Route::get('/turnover', [InventoryController::class, 'stockTurnover'])->name('api.inventory.reports.turnover');
        Route::get('/movement-summary', [InventoryController::class, 'movementSummary'])->name('api.inventory.reports.movement_summary');
    });

    // Real-time endpoints for WebSocket integration
    Route::prefix('realtime')->group(function () {
        Route::get('/stock-status/{productId}', [InventoryController::class, 'realtimeStockStatus'])->name('api.inventory.realtime.stock_status');
        Route::get('/alerts', [InventoryController::class, 'realtimeAlerts'])->name('api.inventory.realtime.alerts');
        Route::post('/acknowledge-alert/{alertId}', [InventoryController::class, 'acknowledgeAlert'])->name('api.inventory.realtime.acknowledge_alert');
    });

    // Bulk operations
    Route::prefix('bulk')->group(function () {
        Route::post('/products/import', [InventoryController::class, 'bulkImportProducts'])->name('api.inventory.bulk.import_products');
        Route::post('/stock/adjust', [InventoryController::class, 'bulkStockAdjustment'])->name('api.inventory.bulk.adjust_stock');
        Route::post('/products/update-prices', [InventoryController::class, 'bulkUpdatePrices'])->name('api.inventory.bulk.update_prices');
    });

    // Integration endpoints for mobile apps
    Route::prefix('mobile')->group(function () {
        Route::get('/products/search', [InventoryController::class, 'mobileProductSearch'])->name('api.inventory.mobile.product_search');
        Route::post('/stock/quick-adjust', [InventoryController::class, 'mobileQuickStockAdjust'])->name('api.inventory.mobile.quick_adjust');
        Route::get('/barcode/{barcode}', [InventoryController::class, 'getProductByBarcode'])->name('api.inventory.mobile.barcode_lookup');
        Route::post('/stock/count', [InventoryController::class, 'mobileStockCount'])->name('api.inventory.mobile.stock_count');
    });
});

