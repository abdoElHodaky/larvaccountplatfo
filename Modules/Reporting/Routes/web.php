<?php

use Illuminate\Support\Facades\Route;
use Modules\Reporting\Http\Controllers\ReportingController;

/*
|--------------------------------------------------------------------------
| Reporting Module Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for the reporting module.
| These routes are loaded by the ReportingServiceProvider within a group
| which contains the "web" middleware group.
|
*/

Route::middleware(['web', 'auth', 'tenant'])->prefix('reporting')->name('reporting.')->group(function () {
    
    // Dashboard
    Route::get('/', [ReportingController::class, 'dashboard'])->name('dashboard');
    
    // Financial Reports
    Route::get('/balance-sheet', [ReportingController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/income-statement', [ReportingController::class, 'incomeStatement'])->name('income-statement');
    Route::get('/cash-flow-statement', [ReportingController::class, 'cashFlowStatement'])->name('cash-flow-statement');
    Route::get('/trial-balance', [ReportingController::class, 'trialBalance'])->name('trial-balance');
    
    // Analytics
    Route::get('/analytics', [ReportingController::class, 'analytics'])->name('analytics');
    
    // Report Management
    Route::get('/reports', [ReportingController::class, 'reports'])->name('reports');
    Route::get('/reports/{report}', [ReportingController::class, 'showReport'])->name('reports.show');
    Route::delete('/reports/{report}', [ReportingController::class, 'deleteReport'])->name('reports.delete');
    
    // Report Schedules
    Route::get('/schedules', [ReportingController::class, 'schedules'])->name('schedules');
    Route::post('/schedules', [ReportingController::class, 'createSchedule'])->name('schedules.create');
    Route::get('/schedules/create', function () {
        return view('reporting::create-schedule');
    })->name('schedules.create-form');
    
    // Cache Management
    Route::post('/cache/clear', [ReportingController::class, 'clearCache'])->name('cache.clear');
    
});

