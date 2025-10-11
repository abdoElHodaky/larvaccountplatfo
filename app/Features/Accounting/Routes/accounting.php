<?php

use App\Features\Accounting\Controllers\AccountingController;
use App\Features\Accounting\Controllers\Api\AccountingApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Accounting Feature Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the Accounting feature module.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" and "api" middleware groups.
|
*/

// Web Routes
Route::middleware(['web', 'auth', 'tenant'])->prefix('accounting')->name('accounting.')->group(function () {
    
    // Dashboard
    Route::get('/', [AccountingController::class, 'index'])->name('dashboard');
    
    // Chart of Accounts
    Route::get('/chart-of-accounts', [AccountingController::class, 'chartOfAccounts'])->name('chart-of-accounts');
    Route::post('/accounts', [AccountingController::class, 'createAccount'])->name('accounts.store');
    Route::get('/accounts/{account}', [AccountingController::class, 'showAccount'])->name('accounts.show');
    Route::put('/accounts/{account}', [AccountingController::class, 'updateAccount'])->name('accounts.update');
    
    // Journal Entries
    Route::post('/journal-entries', [AccountingController::class, 'createJournalEntry'])->name('journal-entries.store');
    
    // Transactions
    Route::get('/transactions', [AccountingController::class, 'transactions'])->name('transactions.index');
    Route::get('/transactions/{transaction}', [AccountingController::class, 'showTransaction'])->name('transactions.show');
    Route::post('/transactions/{transaction}/approve', [AccountingController::class, 'approveTransaction'])->name('transactions.approve');
    Route::post('/transactions/{transaction}/post', [AccountingController::class, 'postTransaction'])->name('transactions.post');
    
    // Reports
    Route::get('/trial-balance', [AccountingController::class, 'trialBalance'])->name('trial-balance');
    Route::get('/accounts/{account}/general-ledger', [AccountingController::class, 'generalLedger'])->name('general-ledger');
    
});

/*
|--------------------------------------------------------------------------
| Accounting Module API Routes (New Organized Structure)
|--------------------------------------------------------------------------
|
| These routes follow the new modular organization pattern.
| They are included from the main api.php file with proper prefixing.
|
*/

// Dashboard and Analytics
Route::get('/dashboard', [AccountingApiController::class, 'dashboard'])
    ->name('accounting.dashboard');

Route::get('/financial-summary', [AccountingApiController::class, 'getFinancialSummary'])
    ->name('accounting.financial-summary');

Route::get('/analytics', [AccountingApiController::class, 'analytics'])
    ->name('accounting.analytics');

// Chart of Accounts
Route::apiResource('accounts', AccountingApiController::class);
Route::get('/chart-of-accounts', [AccountingApiController::class, 'getChartOfAccounts'])
    ->name('accounting.chart-of-accounts');

Route::get('/accounts/type/{type}', [AccountingApiController::class, 'getAccountsByType'])
    ->name('accounting.accounts.by-type');

Route::get('/accounts/search', [AccountingApiController::class, 'searchAccounts'])
    ->name('accounting.accounts.search');

Route::get('/accounts/{account}/balance', [AccountingApiController::class, 'getAccountBalance'])
    ->name('accounting.accounts.balance');

Route::get('/accounts/{account}/transactions', [AccountingApiController::class, 'getAccountTransactions'])
    ->name('accounting.accounts.transactions');

// Journal Entries
Route::apiResource('journal-entries', AccountingApiController::class . '@journalEntries');
Route::post('/journal-entries/{journalEntry}/post', [AccountingApiController::class, 'postJournalEntry'])
    ->name('accounting.journal-entries.post');

Route::post('/journal-entries/{journalEntry}/reverse', [AccountingApiController::class, 'reverseJournalEntry'])
    ->name('accounting.journal-entries.reverse');

// Transactions Management
Route::apiResource('transactions', AccountingApiController::class . '@transactions');
Route::get('/transactions/search', [AccountingApiController::class, 'searchTransactions'])
    ->name('accounting.transactions.search');

Route::post('/transactions/{transaction}/approve', [AccountingController::class, 'approveTransaction'])
    ->name('accounting.transactions.approve');

Route::post('/transactions/{transaction}/post', [AccountingController::class, 'postTransaction'])
    ->name('accounting.transactions.post');

// Financial Reports
Route::get('/reports/balance-sheet', [AccountingApiController::class, 'balanceSheet'])
    ->name('accounting.reports.balance-sheet');

Route::get('/reports/profit-loss', [AccountingApiController::class, 'profitLoss'])
    ->name('accounting.reports.profit-loss');

Route::get('/reports/cash-flow', [AccountingApiController::class, 'cashFlow'])
    ->name('accounting.reports.cash-flow');

Route::get('/reports/trial-balance', [AccountingApiController::class, 'getTrialBalance'])
    ->name('accounting.reports.trial-balance');

Route::get('/reports/general-ledger', [AccountingApiController::class, 'getGeneralLedger'])
    ->name('accounting.reports.general-ledger');

// Alternative API routes matching frontend expectations
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api')->group(function () {
    
    // Accounting dashboard (matching frontend accountingApi.getDashboard())
    Route::get('/accounting/dashboard', [AccountingApiController::class, 'dashboard'])->name('api.accounting.dashboard');
    
    // Financial summary (matching frontend accountingApi.getFinancialSummary())
    Route::get('/accounting/summary', [AccountingApiController::class, 'getFinancialSummary'])->name('api.accounting.summary');
    
    // Chart of accounts (matching frontend accountingApi.getChartOfAccounts())
    Route::get('/accounting/accounts', [AccountingApiController::class, 'getChartOfAccounts'])->name('api.accounting.accounts');
    Route::post('/accounting/accounts', [AccountingApiController::class, 'createAccountApi'])->name('api.accounting.accounts.create');
    Route::get('/accounting/accounts/{account}', [AccountingApiController::class, 'getAccount'])->name('api.accounting.accounts.show');
    Route::put('/accounting/accounts/{account}', [AccountingApiController::class, 'updateAccountApi'])->name('api.accounting.accounts.update');
    
    // Account search (matching frontend accountingApi.searchAccounts())
    Route::get('/accounting/accounts/search', [AccountingApiController::class, 'searchAccounts'])->name('api.accounting.accounts.search');
    
    // Accounts by type (matching frontend accountingApi.getAccountsByType())
    Route::get('/accounting/accounts/type/{type}', [AccountingApiController::class, 'getAccountsByType'])->name('api.accounting.accounts.type');
    
    // Journal entries (matching frontend accountingApi.createJournalEntry())
    Route::post('/accounting/journal-entries', [AccountingApiController::class, 'createJournalEntryApi'])->name('api.accounting.journal-entries');
    
    // Transactions (matching frontend accountingApi.getTransactions())
    Route::get('/accounting/transactions', [AccountingApiController::class, 'getTransactions'])->name('api.accounting.transactions');
    Route::get('/accounting/transactions/{transaction}', [AccountingApiController::class, 'getTransaction'])->name('api.accounting.transactions.show');
    
    // Transaction workflow (matching frontend accountingApi.approveTransaction(), postTransaction())
    Route::post('/accounting/transactions/{transaction}/approve', [AccountingController::class, 'approveTransaction'])->name('api.accounting.transactions.approve');
    Route::post('/accounting/transactions/{transaction}/post', [AccountingController::class, 'postTransaction'])->name('api.accounting.transactions.post');
    
    // Reports (matching frontend accountingApi.getTrialBalance(), getGeneralLedger())
    Route::get('/accounting/trial-balance', [AccountingApiController::class, 'getTrialBalance'])->name('api.accounting.trial-balance');
    Route::get('/accounting/accounts/{account}/ledger', [AccountingApiController::class, 'getGeneralLedger'])->name('api.accounting.ledger');
    
});
