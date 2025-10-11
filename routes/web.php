<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Features\TenantManagement\Controllers\TenantController;
use App\Features\Dashboard\Controllers\DashboardController;
use App\Features\Accounting\Controllers\AccountingController;
use App\Features\Inventory\Controllers\InventoryController;
use App\Features\Organization\Controllers\OrganizationController;
use App\Features\Sales\Controllers\SalesController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Public routes
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

// Authentication routes (guest only)
Route::middleware('guest')->group(function () {
    // Login
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    
    // Register
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
    
    // Password Reset (if needed)
    Route::get('/forgot-password', function () {
        return Inertia::render('Auth/ForgotPassword');
    })->name('password.request');
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Logout
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
    
    // Tenant selection (for users with multiple tenants)
    Route::get('/tenant-select', [TenantController::class, 'select'])->name('tenant.select');
    Route::post('/tenant-switch', [TenantController::class, 'switch'])->name('tenant.switch');
});

// Tenant-scoped routes (require tenant context)
Route::middleware(['auth', 'verified', 'tenant'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Profile management
    Route::get('/profile', function () {
        return Inertia::render('Profile/Show');
    })->name('profile.show');
    
    // Tenant management
    Route::prefix('tenant')->name('tenant.')->group(function () {
        Route::get('/settings', [TenantController::class, 'settings'])->name('settings');
        Route::put('/settings', [TenantController::class, 'updateSettings'])->name('settings.update');
        Route::get('/users', [TenantController::class, 'users'])->name('users');
        Route::post('/users/invite', [TenantController::class, 'inviteUser'])->name('users.invite');
    });
    
    // Feature Module Routes
    
    // Accounting
    Route::prefix('accounting')->name('accounting.')->group(function () {
        Route::get('/', [AccountingController::class, 'index'])->name('index');
        Route::get('/dashboard', [AccountingController::class, 'index'])->name('dashboard');
    });
    
    // Inventory
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::get('/dashboard', [InventoryController::class, 'index'])->name('dashboard');
        Route::get('/products/{product}', [InventoryController::class, 'show'])->name('products.show');
    });
    
    // Sales
    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [SalesController::class, 'index'])->name('index');
        Route::get('/dashboard', [SalesController::class, 'index'])->name('dashboard');
        Route::get('/customers', [SalesController::class, 'customers'])->name('customers');
        Route::get('/customers/create', [SalesController::class, 'createCustomer'])->name('customers.create');
        Route::get('/orders', [SalesController::class, 'orders'])->name('orders');
        Route::get('/orders/create', [SalesController::class, 'createOrder'])->name('orders.create');
    });
    
    // Organization
    Route::prefix('organization')->name('organization.')->group(function () {
        Route::get('/', [OrganizationController::class, 'index'])->name('index');
        Route::get('/dashboard', [OrganizationController::class, 'dashboard'])->name('dashboard');
        Route::get('/settings', [OrganizationController::class, 'settings'])->name('settings');
        Route::get('/profile', [OrganizationController::class, 'profile'])->name('profile');
    });
    
    // API routes for AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        // Dashboard data
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity'])->name('dashboard.recent-activity');
        
        // Accounting API endpoints
        Route::get('/accounting/dashboard', [AccountingController::class, 'dashboardData'])->name('accounting.dashboard');
        
        // Inventory API endpoints
        Route::get('/inventory/dashboard', [InventoryController::class, 'dashboardData'])->name('inventory.dashboard');
        Route::get('/inventory/products/{product}', [InventoryController::class, 'productData'])->name('inventory.products.data');
        
        // Organization API endpoints
        Route::put('/organization/settings', [OrganizationController::class, 'updateSettings'])->name('organization.settings.update');
        Route::put('/organization/profile', [OrganizationController::class, 'updateProfile'])->name('organization.profile.update');
    });
});

// Fallback route for SPA
Route::fallback(function () {
    return Inertia::render('Error', [
        'status' => 404,
        'message' => 'Page not found'
    ]);
});
