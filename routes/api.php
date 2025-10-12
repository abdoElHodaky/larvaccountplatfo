<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| Feature Module API Routes
|--------------------------------------------------------------------------
|
| Routes are organized by feature modules for better maintainability.
| Each module has its own route file that is included here.
|
*/

// Inventory Module Routes
Route::prefix('inventory')
    ->middleware(['auth:sanctum'])
    ->group(base_path('app/Features/Inventory/Routes/inventory.php'));

// Accounting Module Routes
Route::prefix('accounting')
    ->middleware(['auth:sanctum'])
    ->group(base_path('app/Features/Accounting/Routes/accounting.php'));

// Dashboard Module Routes
Route::prefix('dashboard')
    ->middleware(['auth:sanctum'])
    ->group(base_path('app/Features/Dashboard/Routes/dashboard.php'));

/*
|--------------------------------------------------------------------------
| GraphQL Endpoint
|--------------------------------------------------------------------------
|
| GraphQL endpoint is handled by Laravel Lighthouse
| Available at /graphql with GraphQL Playground at /graphql-playground
|
*/

// GraphQL routes are automatically registered by Lighthouse
