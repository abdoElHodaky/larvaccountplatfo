<?php

use Illuminate\Support\Facades\Route;
use Modules\Reporting\Http\Controllers\ReportingController;

/*
|--------------------------------------------------------------------------
| Reporting Module API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for the reporting module.
| These routes are loaded by the ReportingServiceProvider within a group
| which is assigned the "api" middleware group.
|
*/

Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api/v1/reporting')->name('api.reporting.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [ReportingController::class, 'dashboard'])->name('dashboard');
    
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
    Route::get('/schedules/{schedule}', [ReportingController::class, 'showSchedule'])->name('schedules.show');
    Route::put('/schedules/{schedule}', [ReportingController::class, 'updateSchedule'])->name('schedules.update');
    Route::delete('/schedules/{schedule}', [ReportingController::class, 'deleteSchedule'])->name('schedules.delete');
    Route::post('/schedules/{schedule}/activate', [ReportingController::class, 'activateSchedule'])->name('schedules.activate');
    Route::post('/schedules/{schedule}/deactivate', [ReportingController::class, 'deactivateSchedule'])->name('schedules.deactivate');
    
    // Export Endpoints
    Route::post('/export/balance-sheet', [ReportingController::class, 'exportBalanceSheet'])->name('export.balance-sheet');
    Route::post('/export/income-statement', [ReportingController::class, 'exportIncomeStatement'])->name('export.income-statement');
    Route::post('/export/cash-flow-statement', [ReportingController::class, 'exportCashFlowStatement'])->name('export.cash-flow-statement');
    Route::post('/export/trial-balance', [ReportingController::class, 'exportTrialBalance'])->name('export.trial-balance');
    
    // Cache Management
    Route::post('/cache/clear', [ReportingController::class, 'clearCache'])->name('cache.clear');
    
    // Report Metadata
    Route::get('/metadata/report-types', function () {
        return response()->json([
            'report_types' => \Modules\Reporting\Models\FinancialReport::getReportTypes(),
        ]);
    })->name('metadata.report-types');
    
    Route::get('/metadata/export-formats', function () {
        return response()->json([
            'export_formats' => \Modules\Reporting\Models\FinancialReport::getExportFormats(),
        ]);
    })->name('metadata.export-formats');
    
    Route::get('/metadata/frequencies', function () {
        return response()->json([
            'frequencies' => \Modules\Reporting\Models\ReportSchedule::getFrequencies(),
        ]);
    })->name('metadata.frequencies');
    
});

