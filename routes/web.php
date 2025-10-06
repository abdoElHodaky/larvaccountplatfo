<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\DashboardController;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\TransactionController;
use Modules\Accounting\Http\Controllers\JournalEntryController;
use Modules\Accounting\Http\Controllers\ReportController;

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
    
    // Accounting Module Routes
    Route::prefix('accounting')->name('accounting.')->group(function () {
        // Chart of Accounts
        Route::resource('accounts', AccountController::class);
        Route::get('accounts/{account}/balance-history', [AccountController::class, 'balanceHistory'])
            ->name('accounts.balance-history');
        Route::post('accounts/{account}/recalculate-balance', [AccountController::class, 'recalculateBalance'])
            ->name('accounts.recalculate-balance');
        Route::get('accounts-tree', [AccountController::class, 'tree'])
            ->name('accounts.tree');
        
        // Transactions
        Route::resource('transactions', TransactionController::class);
        Route::post('transactions/{transaction}/post', [TransactionController::class, 'post'])
            ->name('transactions.post');
        Route::post('transactions/{transaction}/reverse', [TransactionController::class, 'reverse'])
            ->name('transactions.reverse');
        Route::get('transactions/{transaction}/duplicate', [TransactionController::class, 'duplicate'])
            ->name('transactions.duplicate');
        
        // Journal Entries
        Route::resource('journal-entries', JournalEntryController::class);
        Route::get('journal-entries/create/quick', [JournalEntryController::class, 'createQuick'])
            ->name('journal-entries.create-quick');
        Route::post('journal-entries/validate', [JournalEntryController::class, 'validate'])
            ->name('journal-entries.validate');
        
        // Reports
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', [ReportController::class, 'index'])->name('index');
            Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
            Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance-sheet');
            Route::get('/income-statement', [ReportController::class, 'incomeStatement'])->name('income-statement');
            Route::get('/cash-flow', [ReportController::class, 'cashFlow'])->name('cash-flow');
            Route::get('/general-ledger', [ReportController::class, 'generalLedger'])->name('general-ledger');
            Route::get('/account-activity', [ReportController::class, 'accountActivity'])->name('account-activity');
        });
    });
    
    // API routes for AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        // Dashboard data
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity'])->name('dashboard.recent-activity');
        
        // Account search and autocomplete
        Route::get('/accounts/search', [AccountController::class, 'search'])->name('accounts.search');
        Route::get('/accounts/autocomplete', [AccountController::class, 'autocomplete'])->name('accounts.autocomplete');
        
        // Transaction validation
        Route::post('/transactions/validate-entries', [TransactionController::class, 'validateEntries'])->name('transactions.validate-entries');
        
        // Quick actions
        Route::post('/quick-journal-entry', [JournalEntryController::class, 'quickEntry'])->name('quick-journal-entry');
    });
});

// Fallback route for SPA
Route::fallback(function () {
    return Inertia::render('Error', [
        'status' => 404,
        'message' => 'Page not found'
    ]);
});
