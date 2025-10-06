<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\Api\AccountController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('v1')->middleware(['api', 'tenant'])->group(function () {
    
    // Account Management Routes
    Route::prefix('accounts')->name('api.accounts.')->group(function () {
        
        // Standard CRUD operations
        Route::get('/', [AccountController::class, 'index'])->name('index');
        Route::post('/', [AccountController::class, 'store'])->name('store');
        Route::get('/{id}', [AccountController::class, 'show'])->name('show');
        Route::put('/{id}', [AccountController::class, 'update'])->name('update');
        Route::delete('/{id}', [AccountController::class, 'destroy'])->name('destroy');
        
        // Specialized account operations
        Route::get('/hierarchy/tree', [AccountController::class, 'hierarchy'])->name('hierarchy');
        Route::get('/reports/trial-balance', [AccountController::class, 'trialBalance'])->name('trial_balance');
        Route::get('/validation/chart', [AccountController::class, 'validateChart'])->name('validate_chart');
        Route::get('/metadata/types', [AccountController::class, 'types'])->name('types');
        Route::get('/monitoring/metrics', [AccountController::class, 'metrics'])->name('metrics');
        
    });
    
});

// Performance monitoring routes with Telescope integration
Route::prefix('v1/monitoring')->middleware(['api', 'tenant', 'auth:api'])->group(function () {
    
    Route::get('/performance/summary', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        $minutes = request()->query('minutes', 60);
        
        return response()->json([
            'data' => $telescopeAdapter->getUnifiedPerformanceSummary($minutes),
            'meta' => [
                'period_minutes' => $minutes,
                'monitoring_type' => 'unified_telescope_custom',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.performance.summary');
    
    Route::get('/performance/slow-operations', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        $threshold = (int) request()->query('threshold', 1000);
        $limit = (int) request()->query('limit', 50);
        
        return response()->json([
            'data' => $telescopeAdapter->getUnifiedSlowOperations($threshold, $limit),
            'meta' => [
                'threshold_ms' => $threshold,
                'limit' => $limit,
                'monitoring_type' => 'unified_telescope_custom',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.performance.slow_operations');
    
    Route::get('/performance/status', function () {
        $performanceMonitor = app(\Modules\Shared\Services\PerformanceMonitor::class);
        
        return response()->json([
            'data' => $performanceMonitor->getCurrentStatus(),
            'meta' => [
                'monitoring_type' => 'custom_only',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.performance.status');

    // New Telescope-specific endpoints
    Route::get('/telescope/database-performance', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        $minutes = request()->query('minutes', 60);
        $since = now()->subMinutes($minutes);
        
        return response()->json([
            'data' => $telescopeAdapter->getDatabasePerformanceFromTelescope($since),
            'meta' => [
                'period_minutes' => $minutes,
                'monitoring_type' => 'telescope_only',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.telescope.database_performance');

    Route::get('/telescope/request-performance', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        $minutes = request()->query('minutes', 60);
        $since = now()->subMinutes($minutes);
        
        return response()->json([
            'data' => $telescopeAdapter->getRequestPerformanceFromTelescope($since),
            'meta' => [
                'period_minutes' => $minutes,
                'monitoring_type' => 'telescope_only',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.telescope.request_performance');

    Route::get('/telescope/domain-events', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        $minutes = request()->query('minutes', 60);
        $since = now()->subMinutes($minutes);
        
        return response()->json([
            'data' => $telescopeAdapter->getDomainEventMetricsFromTelescope($since),
            'meta' => [
                'period_minutes' => $minutes,
                'monitoring_type' => 'telescope_only',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.telescope.domain_events');

    Route::get('/alerts', function () {
        $telescopeAdapter = app(\Modules\Shared\Services\TelescopePerformanceAdapter::class);
        
        return response()->json([
            'data' => $telescopeAdapter->getPerformanceAlerts(),
            'meta' => [
                'monitoring_type' => 'unified_alerts',
                'generated_at' => now(),
            ],
        ]);
    })->name('api.monitoring.performance.alerts');
    
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
        'modules' => [
            'accounting' => 'active',
            'shared' => 'active',
        ],
    ]);
})->name('api.health');
