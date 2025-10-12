<?php

use App\Features\Purchase\Controllers\PurchaseController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Purchase Feature Routes
|--------------------------------------------------------------------------
|
| Here is where you can register routes for the Purchase feature.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

Route::middleware(['auth'])->group(function () {
    Route::resource('purchase', PurchaseController::class);
});
