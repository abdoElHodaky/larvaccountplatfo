<?php

use App\Features\Dashboard\Controllers\Api\DashboardApiController;
use App\Features\Dashboard\Controllers\Api\WidgetApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the Dashboard module
|
*/

Route::middleware(['auth:sanctum'])->prefix('api/dashboard')->group(function () {
    
    // Dashboard routes
    Route::get('/', [DashboardApiController::class, 'getDashboard'])->name('api.dashboard.get');
    Route::post('/refresh', [DashboardApiController::class, 'refreshDashboard'])->name('api.dashboard.refresh');
    Route::get('/performance', [DashboardApiController::class, 'getPerformanceInsights'])->name('api.dashboard.performance');
    Route::get('/recommendations', [DashboardApiController::class, 'getWidgetRecommendations'])->name('api.dashboard.recommendations');
    Route::put('/customize', [DashboardApiController::class, 'customizeDashboard'])->name('api.dashboard.customize');
    Route::post('/export', [DashboardApiController::class, 'exportDashboard'])->name('api.dashboard.export');
    Route::post('/reports', [DashboardApiController::class, 'generateReport'])->name('api.dashboard.reports');

    // Widget routes
    Route::prefix('widgets')->group(function () {
        Route::get('/', [WidgetApiController::class, 'index'])->name('api.widgets.index');
        Route::post('/', [WidgetApiController::class, 'store'])->name('api.widgets.store');
        Route::get('/types', [WidgetApiController::class, 'getAvailableTypes'])->name('api.widgets.types');
        Route::get('/types/{widgetType}/schema', [WidgetApiController::class, 'getConfigurationSchema'])->name('api.widgets.schema');
        Route::post('/reorder', [WidgetApiController::class, 'reorder'])->name('api.widgets.reorder');
        
        Route::prefix('{widget}')->group(function () {
            Route::get('/', [WidgetApiController::class, 'show'])->name('api.widgets.show');
            Route::put('/', [WidgetApiController::class, 'update'])->name('api.widgets.update');
            Route::delete('/', [WidgetApiController::class, 'destroy'])->name('api.widgets.destroy');
            Route::post('/duplicate', [WidgetApiController::class, 'duplicate'])->name('api.widgets.duplicate');
            Route::put('/configuration', [WidgetApiController::class, 'updateConfiguration'])->name('api.widgets.configuration');
            Route::post('/refresh', [WidgetApiController::class, 'refresh'])->name('api.widgets.refresh');
        });
    });
});

