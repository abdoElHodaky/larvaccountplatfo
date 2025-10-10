<?php

use Illuminate\Support\Facades\Route;
use App\Features\Dashboard\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the Dashboard feature module.
|
*/

Route::middleware(['auth', 'verified', 'tenant'])->group(function () {
    // Dashboard main page
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Dashboard API endpoints
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity'])->name('dashboard.recent-activity');
    });
});
