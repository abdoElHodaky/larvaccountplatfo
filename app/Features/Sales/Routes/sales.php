<?php

use App\Features\Sales\Controllers\Api\SalesApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Sales Feature Routes
|--------------------------------------------------------------------------
*/

// API Routes
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api/sales')->name('api.sales.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [SalesApiController::class, 'dashboard'])->name('dashboard');
    
    // Customers
    Route::get('/customers', [SalesApiController::class, 'getCustomers'])->name('customers.index');
    Route::post('/customers', [SalesApiController::class, 'createCustomer'])->name('customers.store');
    
    // Sales Orders
    Route::get('/orders', [SalesApiController::class, 'getSalesOrders'])->name('orders.index');
    Route::post('/orders', [SalesApiController::class, 'createSalesOrder'])->name('orders.store');
    Route::get('/orders/{salesOrder}', [SalesApiController::class, 'getSalesOrder'])->name('orders.show');
    Route::post('/orders/{salesOrder}/confirm', [SalesApiController::class, 'confirmSalesOrder'])->name('orders.confirm');
    
});

// Alternative API routes matching frontend expectations
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api')->group(function () {
    
    // Sales dashboard
    Route::get('/sales/dashboard', [SalesApiController::class, 'dashboard'])->name('api.sales.dashboard');
    
    // Customers
    Route::get('/sales/customers', [SalesApiController::class, 'getCustomers'])->name('api.sales.customers');
    Route::post('/sales/customers', [SalesApiController::class, 'createCustomer'])->name('api.sales.customers.create');
    
    // Sales orders
    Route::get('/sales/orders', [SalesApiController::class, 'getSalesOrders'])->name('api.sales.orders');
    Route::post('/sales/orders', [SalesApiController::class, 'createSalesOrder'])->name('api.sales.orders.create');
    Route::get('/sales/orders/{salesOrder}', [SalesApiController::class, 'getSalesOrder'])->name('api.sales.orders.show');
    Route::post('/sales/orders/{salesOrder}/confirm', [SalesApiController::class, 'confirmSalesOrder'])->name('api.sales.orders.confirm');
    
});
