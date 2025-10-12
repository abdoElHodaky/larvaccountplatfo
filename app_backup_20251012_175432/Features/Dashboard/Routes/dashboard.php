<?php

use App\Features\Dashboard\Controllers\AdvancedDashboardController;
use App\Features\Dashboard\Controllers\DashboardApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard Module API Routes
|--------------------------------------------------------------------------
|
| All routes related to dashboard and analytics functionality.
| These routes are prefixed with 'dashboard' and require authentication.
|
*/

// Main Dashboard
Route::get('/', [DashboardApiController::class, 'index'])
    ->name('dashboard.index');

Route::get('/overview', [DashboardApiController::class, 'overview'])
    ->name('dashboard.overview');

// Widget Data
Route::get('/widgets/financial-summary', [DashboardApiController::class, 'financialSummaryWidget'])
    ->name('dashboard.widgets.financial-summary');

Route::get('/widgets/inventory-status', [DashboardApiController::class, 'inventoryStatusWidget'])
    ->name('dashboard.widgets.inventory-status');

Route::get('/widgets/recent-transactions', [DashboardApiController::class, 'recentTransactionsWidget'])
    ->name('dashboard.widgets.recent-transactions');

Route::get('/widgets/cash-flow', [DashboardApiController::class, 'cashFlowWidget'])
    ->name('dashboard.widgets.cash-flow');

Route::get('/widgets/top-products', [DashboardApiController::class, 'topProductsWidget'])
    ->name('dashboard.widgets.top-products');

Route::get('/widgets/alerts', [DashboardApiController::class, 'alertsWidget'])
    ->name('dashboard.widgets.alerts');

// Analytics
Route::get('/analytics/revenue-trends', [DashboardApiController::class, 'revenueTrends'])
    ->name('dashboard.analytics.revenue-trends');

Route::get('/analytics/expense-breakdown', [DashboardApiController::class, 'expenseBreakdown'])
    ->name('dashboard.analytics.expense-breakdown');

Route::get('/analytics/inventory-turnover', [DashboardApiController::class, 'inventoryTurnover'])
    ->name('dashboard.analytics.inventory-turnover');

Route::get('/analytics/profit-margins', [DashboardApiController::class, 'profitMargins'])
    ->name('dashboard.analytics.profit-margins');

// KPIs (Key Performance Indicators)
Route::get('/kpis/financial', [DashboardApiController::class, 'financialKPIs'])
    ->name('dashboard.kpis.financial');

Route::get('/kpis/operational', [DashboardApiController::class, 'operationalKPIs'])
    ->name('dashboard.kpis.operational');

Route::get('/kpis/inventory', [DashboardApiController::class, 'inventoryKPIs'])
    ->name('dashboard.kpis.inventory');

// Reports Summary
Route::get('/reports/summary', [DashboardApiController::class, 'reportsSummary'])
    ->name('dashboard.reports.summary');

Route::get('/reports/quick-stats', [DashboardApiController::class, 'quickStats'])
    ->name('dashboard.reports.quick-stats');

// Notifications and Alerts
Route::get('/notifications', [DashboardApiController::class, 'notifications'])
    ->name('dashboard.notifications');

Route::get('/alerts/critical', [DashboardApiController::class, 'criticalAlerts'])
    ->name('dashboard.alerts.critical');

Route::post('/alerts/{alert}/dismiss', [DashboardApiController::class, 'dismissAlert'])
    ->name('dashboard.alerts.dismiss');

// User Preferences
Route::get('/preferences', [DashboardApiController::class, 'getUserPreferences'])
    ->name('dashboard.preferences.get');

Route::post('/preferences', [DashboardApiController::class, 'updateUserPreferences'])
    ->name('dashboard.preferences.update');

// Export Data
Route::get('/export/summary', [DashboardApiController::class, 'exportSummary'])
    ->name('dashboard.export.summary');

Route::get('/export/analytics', [DashboardApiController::class, 'exportAnalytics'])
    ->name('dashboard.export.analytics');

/*
|--------------------------------------------------------------------------
| Advanced Dashboard Routes (v2)
|--------------------------------------------------------------------------
|
| Enhanced dashboard functionality with widget management and advanced
| analytics. These routes provide comprehensive dashboard capabilities.
|
*/

Route::prefix('v2')->name('v2.')->group(function () {
    // Dashboard overview
    Route::get('/overview', [AdvancedDashboardController::class, 'overview'])
        ->name('overview');

    Route::get('/financial-summary', [AdvancedDashboardController::class, 'financialSummary'])
        ->name('financial-summary');

    Route::get('/performance-metrics', [AdvancedDashboardController::class, 'performanceMetrics'])
        ->name('performance-metrics');

    Route::get('/budget-overview', [AdvancedDashboardController::class, 'budgetOverview'])
        ->name('budget-overview');

    // Widget management
    Route::prefix('widgets')->name('widgets.')->group(function () {
        Route::get('/', [AdvancedDashboardController::class, 'widgets'])
            ->name('index');

        Route::post('/', [AdvancedDashboardController::class, 'createWidget'])
            ->name('create');

        Route::get('/types', [AdvancedDashboardController::class, 'widgetTypes'])
            ->name('types');

        Route::get('/{widgetId}/data', [AdvancedDashboardController::class, 'widgetData'])
            ->name('data');

        Route::put('/{widgetId}', [AdvancedDashboardController::class, 'updateWidget'])
            ->name('update');

        Route::delete('/{widgetId}', [AdvancedDashboardController::class, 'deleteWidget'])
            ->name('delete');

        Route::patch('/positions', [AdvancedDashboardController::class, 'updateWidgetPositions'])
            ->name('update-positions');
    });
});
