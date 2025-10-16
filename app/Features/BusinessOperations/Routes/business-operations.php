<?php

use App\Features\BusinessOperations\Controllers\BusinessOperationsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Business Operations Routes
|--------------------------------------------------------------------------
|
| Consolidated routes for organization, purchase, and reporting operations
|
*/

Route::middleware(['auth'])->prefix('business')->group(function () {
    Route::get('/organizations', [BusinessOperationsController::class, 'organizations']);
    Route::get('/purchases', [BusinessOperationsController::class, 'purchases']);
    Route::get('/reports', [BusinessOperationsController::class, 'reports']);
});
