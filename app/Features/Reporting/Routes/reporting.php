<?php

use App\Features\Reporting\Controllers\ReportingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Reporting Feature Routes
|--------------------------------------------------------------------------
|
| Here is where you can register routes for the Reporting feature.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

Route::middleware(['auth'])->group(function () {
    Route::resource('reporting', ReportingController::class);
});
