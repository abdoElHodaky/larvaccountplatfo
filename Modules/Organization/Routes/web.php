<?php

use Illuminate\Support\Facades\Route;
use Modules\Organization\Http\Controllers\DashboardController;
use Modules\Organization\Http\Controllers\TenantSettingsController;

/*
|--------------------------------------------------------------------------
| Organization Module Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for the Organization module.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group and tenant middleware.
|
*/

Route::middleware(['auth', 'tenant'])->group(function () {
    
    // Dashboard routes
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/overview', [DashboardController::class, 'overview'])->name('dashboard.overview');

    // Organization settings routes
    Route::prefix('organization')->name('organization.')->group(function () {
        
        // Settings
        Route::get('/settings', [TenantSettingsController::class, 'index'])->name('settings');
        Route::put('/settings/basic', [TenantSettingsController::class, 'updateBasicInfo'])->name('settings.basic');
        Route::put('/settings/tax', [TenantSettingsController::class, 'updateTaxSettings'])->name('settings.tax');
        Route::put('/settings/preferences', [TenantSettingsController::class, 'updatePreferences'])->name('settings.preferences');
        Route::put('/settings/modules', [TenantSettingsController::class, 'updateModules'])->name('settings.modules');

        // User management
        Route::get('/users', [TenantSettingsController::class, 'users'])->name('users');
        Route::post('/users/invite', [TenantSettingsController::class, 'inviteUser'])->name('users.invite');
        Route::put('/users/{user}', [TenantSettingsController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{user}', [TenantSettingsController::class, 'removeUser'])->name('users.remove');
    });
});

// Tenant selection routes (no tenant middleware)
Route::middleware(['auth'])->group(function () {
    Route::get('/tenant/select', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'selectTenant'])->name('tenant.select');
    Route::post('/tenant/switch', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'switchTenant'])->name('tenant.switch');
});
