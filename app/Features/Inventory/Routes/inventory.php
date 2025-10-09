<?php

use App\Features\Inventory\Controllers\InventoryController;
use App\Features\Inventory\Controllers\Api\InventoryApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Inventory Feature Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the Inventory feature module.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" and "api" middleware groups.
|
*/

// Web Routes
Route::middleware(['web', 'auth', 'tenant'])->prefix('inventory')->name('inventory.')->group(function () {
    
    // Dashboard
    Route::get('/', [InventoryController::class, 'index'])->name('dashboard');
    
    // Products
    Route::get('/products', [InventoryController::class, 'products'])->name('products.index');
    Route::post('/products', [InventoryController::class, 'store'])->name('products.store');
    Route::get('/products/{product}', [InventoryController::class, 'show'])->name('products.show');
    Route::put('/products/{product}', [InventoryController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [InventoryController::class, 'destroy'])->name('products.destroy');
    
    // Stock Management
    Route::post('/products/{product}/adjust-stock', [InventoryController::class, 'adjustStock'])->name('products.adjust-stock');
    
    // Stock Alerts
    Route::get('/alerts', [InventoryController::class, 'stockAlerts'])->name('alerts');
    
});

// API Routes
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api/inventory')->name('api.inventory.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [InventoryApiController::class, 'dashboard'])->name('dashboard');
    Route::get('/statistics', [InventoryApiController::class, 'getStatistics'])->name('statistics');
    
    // Products
    Route::get('/products', [InventoryApiController::class, 'getProducts'])->name('products.index');
    Route::post('/products', [InventoryApiController::class, 'createProduct'])->name('products.store');
    Route::get('/products/search', [InventoryApiController::class, 'searchProducts'])->name('products.search');
    Route::get('/products/{product}', [InventoryApiController::class, 'getProduct'])->name('products.show');
    Route::put('/products/{product}', [InventoryApiController::class, 'updateProduct'])->name('products.update');
    Route::delete('/products/{product}', [InventoryApiController::class, 'deleteProduct'])->name('products.destroy');
    
    // Stock Management
    Route::post('/products/{product}/adjust-stock', [InventoryApiController::class, 'adjustProductStock'])->name('products.adjust-stock');
    
    // Categories
    Route::get('/categories', [InventoryApiController::class, 'getCategories'])->name('categories');
    
    // Stock Alerts
    Route::get('/alerts', [InventoryApiController::class, 'getStockAlerts'])->name('alerts');
    
});

// Alternative API routes matching frontend expectations
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api')->group(function () {
    
    // Inventory items (matching frontend inventoryApi.getItems())
    Route::get('/inventory/items', [InventoryApiController::class, 'getProducts'])->name('api.inventory.items');
    Route::post('/inventory/items', [InventoryApiController::class, 'createProduct'])->name('api.inventory.items.create');
    Route::get('/inventory/items/{product}', [InventoryApiController::class, 'getProduct'])->name('api.inventory.items.show');
    Route::put('/inventory/items/{product}', [InventoryApiController::class, 'updateProduct'])->name('api.inventory.items.update');
    Route::delete('/inventory/items/{product}', [InventoryApiController::class, 'deleteProduct'])->name('api.inventory.items.delete');
    
    // Inventory dashboard (matching frontend inventoryApi.getDashboard())
    Route::get('/inventory/dashboard', [InventoryApiController::class, 'dashboard'])->name('api.inventory.dashboard');
    
    // Inventory statistics (matching frontend inventoryApi.getStatistics())
    Route::get('/inventory/statistics', [InventoryApiController::class, 'getStatistics'])->name('api.inventory.stats');
    
    // Stock adjustments (matching frontend inventoryApi.adjustStock())
    Route::post('/inventory/items/{product}/adjust', [InventoryApiController::class, 'adjustProductStock'])->name('api.inventory.adjust');
    
    // Categories (matching frontend inventoryApi.getCategories())
    Route::get('/inventory/categories', [InventoryApiController::class, 'getCategories'])->name('api.inventory.categories');
    
    // Alerts (matching frontend inventoryApi.getAlerts())
    Route::get('/inventory/alerts', [InventoryApiController::class, 'getStockAlerts'])->name('api.inventory.alerts');
    
    // Search (matching frontend inventoryApi.searchItems())
    Route::get('/inventory/search', [InventoryApiController::class, 'searchProducts'])->name('api.inventory.search');
    
});
