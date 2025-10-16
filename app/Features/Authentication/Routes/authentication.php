<?php

use App\Features\Authentication\Controllers\AuthenticationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Feature Routes
|--------------------------------------------------------------------------
|
| Here is where you can register routes for the Authentication feature.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

Route::middleware(['auth'])->group(function () {
    Route::resource('authentication', AuthenticationController::class);
});
