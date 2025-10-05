<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountingController;

/*
|--------------------------------------------------------------------------
| Accounting Module API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for the accounting module.
| These routes are loaded by the AccountingServiceProvider within a group
| which is assigned the "api" middleware group.
|
*/

Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api/v1/accounting')->name('api.accounting.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [AccountingController::class, 'dashboard'])->name('dashboard');
    
    // Chart of Accounts
    Route::get('/chart-of-accounts', [AccountingController::class, 'chartOfAccounts'])->name('chart-of-accounts');
    Route::post('/accounts', [AccountingController::class, 'storeAccount'])->name('accounts.store');
    Route::get('/accounts/{account}', [AccountingController::class, 'showAccount'])->name('accounts.show');
    Route::put('/accounts/{account}', [AccountingController::class, 'updateAccount'])->name('accounts.update');
    Route::delete('/accounts/{account}', [AccountingController::class, 'deleteAccount'])->name('accounts.delete');
    
    // Default Chart of Accounts
    Route::post('/chart-of-accounts/create-default', [AccountingController::class, 'createDefaultChart'])->name('chart.create-default');
    Route::get('/chart-of-accounts/export', [AccountingController::class, 'exportChart'])->name('chart.export');
    
    // Journal Entries
    Route::get('/journal-entries', [AccountingController::class, 'journalEntries'])->name('journal-entries');
    Route::post('/journal-entries', [AccountingController::class, 'storeJournalEntry'])->name('journal-entries.store');
    Route::get('/journal-entries/{journalEntry}', [AccountingController::class, 'showJournalEntry'])->name('journal-entries.show');
    Route::post('/journal-entries/{journalEntry}/post', [AccountingController::class, 'postJournalEntry'])->name('journal-entries.post');
    Route::post('/journal-entries/{journalEntry}/reverse', [AccountingController::class, 'reverseJournalEntry'])->name('journal-entries.reverse');
    
    // Account Ledger
    Route::get('/accounts/{account}/ledger', [AccountingController::class, 'accountLedger'])->name('accounts.ledger');
    
    // Trial Balance
    Route::get('/trial-balance', [AccountingController::class, 'trialBalance'])->name('trial-balance');
    
    // Quick Entry Endpoints
    Route::post('/entries/cash-receipt', [AccountingController::class, 'createCashReceipt'])->name('entries.cash-receipt');
    Route::post('/entries/cash-payment', [AccountingController::class, 'createCashPayment'])->name('entries.cash-payment');
    Route::post('/entries/credit-sale', [AccountingController::class, 'createCreditSale'])->name('entries.credit-sale');
    Route::post('/entries/credit-purchase', [AccountingController::class, 'createCreditPurchase'])->name('entries.credit-purchase');
    
});

