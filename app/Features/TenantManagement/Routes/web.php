<?php

use Illuminate\Support\Facades\Route;
use App\Features\TenantManagement\Controllers\TenantController;

/*
|--------------------------------------------------------------------------
| Tenant Management Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the Tenant Management feature module.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Tenant selection and switching
    Route::get('/tenant/select', [TenantController::class, 'select'])->name('tenant.select');
    Route::post('/tenant/switch', [TenantController::class, 'switch'])->name('tenant.switch');
});

Route::middleware(['auth', 'verified', 'tenant'])->group(function () {
    // Tenant settings and management
    Route::get('/tenant/settings', [TenantController::class, 'settings'])->name('tenant.settings');
    Route::put('/tenant/settings', [TenantController::class, 'updateSettings'])->name('tenant.settings.update');
    
    // Tenant users management
    Route::get('/tenant/users', [TenantController::class, 'users'])->name('tenant.users');
    Route::post('/tenant/users/invite', [TenantController::class, 'inviteUser'])->name('tenant.users.invite');
});
