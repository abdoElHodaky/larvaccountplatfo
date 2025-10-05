<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountingController;

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
    
    // Chart of Accounts
    Route::get('/chart-of-accounts', [AccountingController::class, 'chartOfAccounts'])->name('chart-of-accounts');
    Route::get('/accounts/create', [AccountingController::class, 'createAccount'])->name('accounts.create');
    Route::post('/accounts', [AccountingController::class, 'storeAccount'])->name('accounts.store');
    Route::get('/accounts/{account}/edit', [AccountingController::class, 'editAccount'])->name('accounts.edit');
    Route::put('/accounts/{account}', [AccountingController::class, 'updateAccount'])->name('accounts.update');
    Route::delete('/accounts/{account}', [AccountingController::class, 'deleteAccount'])->name('accounts.delete');
    
    // Default Chart of Accounts
    Route::post('/chart-of-accounts/create-default', [AccountingController::class, 'createDefaultChart'])->name('chart.create-default');
    Route::get('/chart-of-accounts/export', [AccountingController::class, 'exportChart'])->name('chart.export');
    
    // Journal Entries
    Route::get('/journal-entries', [AccountingController::class, 'journalEntries'])->name('journal-entries');
    Route::get('/journal-entries/create', [AccountingController::class, 'createJournalEntry'])->name('journal-entries.create');
    Route::post('/journal-entries', [AccountingController::class, 'storeJournalEntry'])->name('journal-entries.store');
    Route::get('/journal-entries/{journalEntry}', [AccountingController::class, 'showJournalEntry'])->name('journal-entries.show');
    Route::post('/journal-entries/{journalEntry}/post', [AccountingController::class, 'postJournalEntry'])->name('journal-entries.post');
    Route::post('/journal-entries/{journalEntry}/reverse', [AccountingController::class, 'reverseJournalEntry'])->name('journal-entries.reverse');
    
    // Account Ledger
    Route::get('/accounts/{account}/ledger', [AccountingController::class, 'accountLedger'])->name('accounts.ledger');
    
    // Trial Balance
    Route::get('/trial-balance', [AccountingController::class, 'trialBalance'])->name('trial-balance');
    
});

