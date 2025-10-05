<?php

use Illuminate\Support\Facades\Route;
use Modules\Organization\Http\Controllers\DashboardController;
use Modules\Organization\Http\Controllers\TenantSettingsController;

/*
|--------------------------------------------------------------------------
| Organization Module API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for the Organization module.
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

Route::middleware(['auth:sanctum', 'tenant'])->prefix('v1')->group(function () {
    
    // Dashboard API
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/stats', [DashboardController::class, 'getDashboardStats']);

    // Organization API
    Route::prefix('organization')->group(function () {
        
        // Settings API
        Route::get('/settings', function () {
            /** @var \App\Models\Tenant $tenant */
            $tenant = app('tenant');
            
            return response()->json([
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'subdomain' => $tenant->subdomain,
                    'plan' => $tenant->plan,
                    'status' => $tenant->status,
                    'settings' => $tenant->settings,
                    'enabled_modules' => $tenant->enabled_modules,
                ],
            ]);
        });

        Route::put('/settings/basic', [TenantSettingsController::class, 'updateBasicInfo']);
        Route::put('/settings/tax', [TenantSettingsController::class, 'updateTaxSettings']);
        Route::put('/settings/preferences', [TenantSettingsController::class, 'updatePreferences']);
        Route::put('/settings/modules', [TenantSettingsController::class, 'updateModules']);

        // Users API
        Route::get('/users', function () {
            /** @var \App\Models\Tenant $tenant */
            $tenant = app('tenant');
            
            $users = $tenant->users()
                ->withPivot(['role', 'permissions', 'is_active', 'invited_at', 'joined_at'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->pivot->role,
                        'permissions' => $user->pivot->permissions,
                        'is_active' => $user->pivot->is_active,
                        'invited_at' => $user->pivot->invited_at,
                        'joined_at' => $user->pivot->joined_at,
                        'last_login_at' => $user->last_login_at,
                    ];
                });

            return response()->json(['users' => $users]);
        });

        Route::post('/users/invite', [TenantSettingsController::class, 'inviteUser']);
        Route::put('/users/{user}', [TenantSettingsController::class, 'updateUser']);
        Route::delete('/users/{user}', [TenantSettingsController::class, 'removeUser']);

        // Module status API
        Route::get('/modules', function () {
            /** @var \App\Models\Tenant $tenant */
            $tenant = app('tenant');
            
            /** @var \App\Models\User $user */
            $user = auth()->user();
            
            $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
            $userPermissions = $userTenant?->pivot?->permissions ?? [];

            $enabledModules = $tenant->enabled_modules ?? [];
            $modules = [];

            $availableModules = [
                'accounting' => 'Accounting',
                'invoicing' => 'Invoicing', 
                'banking' => 'Banking',
                'inventory' => 'Inventory',
                'reporting' => 'Reporting',
            ];

            foreach ($availableModules as $key => $name) {
                $modules[$key] = [
                    'name' => $name,
                    'enabled' => in_array($key, $enabledModules),
                    'accessible' => in_array("access-{$key}", $userPermissions),
                ];
            }

            return response()->json(['modules' => $modules]);
        });
    });
});

// Public API routes (no authentication required)
Route::prefix('v1/public')->group(function () {
    
    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now(),
            'service' => 'organization-module',
        ]);
    });

    // Available currencies, timezones, etc.
    Route::get('/currencies', function () {
        return response()->json([
            'currencies' => [
                'USD' => 'US Dollar ($)',
                'EUR' => 'Euro (€)',
                'GBP' => 'British Pound (£)',
                'CAD' => 'Canadian Dollar (C$)',
                'AUD' => 'Australian Dollar (A$)',
                'JPY' => 'Japanese Yen (¥)',
                'CHF' => 'Swiss Franc (CHF)',
                'CNY' => 'Chinese Yuan (¥)',
                'INR' => 'Indian Rupee (₹)',
                'BRL' => 'Brazilian Real (R$)',
            ]
        ]);
    });

    Route::get('/timezones', function () {
        return response()->json([
            'timezones' => [
                'UTC' => 'UTC',
                'America/New_York' => 'Eastern Time (US & Canada)',
                'America/Chicago' => 'Central Time (US & Canada)',
                'America/Denver' => 'Mountain Time (US & Canada)',
                'America/Los_Angeles' => 'Pacific Time (US & Canada)',
                'Europe/London' => 'London',
                'Europe/Paris' => 'Paris',
                'Europe/Berlin' => 'Berlin',
                'Asia/Tokyo' => 'Tokyo',
                'Asia/Shanghai' => 'Shanghai',
                'Asia/Kolkata' => 'Mumbai',
                'Australia/Sydney' => 'Sydney',
            ]
        ]);
    });
});
