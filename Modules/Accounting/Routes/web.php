<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountingController;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\TransactionController;
use Modules\Accounting\Http\Controllers\JournalEntryController;

/*
|--------------------------------------------------------------------------
| Accounting Module Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for the accounting module.
| These routes are loaded by the AccountingServiceProvider within a group
| which contains the "web" middleware group.
|
*/

Route::middleware(['web', 'auth', 'tenant'])->prefix('accounting')->name('accounting.')->group(function () {
    
    // Dashboard
    Route::get('/', [AccountingController::class, 'dashboard'])->name('dashboard');
    
    // Accounts Resource Routes
    Route::resource('accounts', AccountController::class);
    
    // Additional Account Routes
    Route::get('/accounts/{account}/tree', [AccountController::class, 'tree'])->name('accounts.tree');
    Route::get('/accounts/{account}/balance-history', [AccountController::class, 'balanceHistory'])->name('accounts.balance-history');
    Route::post('/accounts/{account}/recalculate-balance', [AccountController::class, 'recalculateBalance'])->name('accounts.recalculate-balance');
    
    // Transactions Resource Routes
    Route::resource('transactions', TransactionController::class);
    
    // Additional Transaction Routes
    Route::post('/transactions/{transaction}/duplicate', [TransactionController::class, 'duplicate'])->name('transactions.duplicate');
    Route::post('/transactions/{transaction}/reverse', [TransactionController::class, 'reverse'])->name('transactions.reverse');
    Route::post('/transactions/{transaction}/post', [TransactionController::class, 'post'])->name('transactions.post');
    Route::get('/transactions/summary', [TransactionController::class, 'summary'])->name('transactions.summary');
    
    // Journal Entries Resource Routes (using Transaction model)
    Route::resource('journal-entries', JournalEntryController::class, [
        'parameters' => ['journal-entries' => 'journalEntry']
    ]);
    
    // Additional Journal Entry Routes
    Route::post('/journal-entries/{journalEntry}/post', [JournalEntryController::class, 'post'])->name('journal-entries.post');
    Route::post('/journal-entries/{journalEntry}/reverse', [JournalEntryController::class, 'reverse'])->name('journal-entries.reverse');
    Route::get('/journal-entries/templates', [JournalEntryController::class, 'templates'])->name('journal-entries.templates');
    Route::post('/journal-entries/validate-balance', [JournalEntryController::class, 'validateBalance'])->name('journal-entries.validate-balance');
    
    // Legacy routes for backward compatibility
    Route::get('/chart-of-accounts', [AccountController::class, 'index'])->name('chart-of-accounts');
    Route::post('/chart-of-accounts/create-default', [AccountingController::class, 'createDefaultChart'])->name('chart.create-default');
    Route::get('/chart-of-accounts/export', [AccountingController::class, 'exportChart'])->name('chart.export');
    
    // Account Ledger
    Route::get('/accounts/{account}/ledger', [AccountingController::class, 'accountLedger'])->name('accounts.ledger');
    
    // Trial Balance
    Route::get('/trial-balance', [AccountingController::class, 'trialBalance'])->name('trial-balance');
    
});
