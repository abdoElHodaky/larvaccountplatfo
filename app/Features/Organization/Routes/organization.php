<?php

use Illuminate\Support\Facades\Route;
use App\Features\Organization\Controllers\OrganizationController;

/*
|--------------------------------------------------------------------------
| Organization Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the Organization feature module.
| These routes handle organization management, settings, and tenant operations.
|
*/

Route::middleware(['auth', 'tenant'])->group(function () {
    
    // Organization Dashboard
    Route::get('/dashboard', [OrganizationController::class, 'dashboard'])
        ->name('dashboard');
    
    // Organization Management
    Route::get('/settings', [OrganizationController::class, 'settings'])
        ->name('settings');
    
    Route::put('/settings', [OrganizationController::class, 'updateSettings'])
        ->name('settings.update');
    
    // Organization Profile
    Route::get('/profile', [OrganizationController::class, 'profile'])
        ->name('profile');
    
    Route::put('/profile', [OrganizationController::class, 'updateProfile'])
        ->name('profile.update');
    
    // Team Management
    Route::get('/teams', [OrganizationController::class, 'teams'])
        ->name('teams');
    
    Route::post('/teams', [OrganizationController::class, 'createTeam'])
        ->name('teams.create');
    
    Route::put('/teams/{team}', [OrganizationController::class, 'updateTeam'])
        ->name('teams.update');
    
    Route::delete('/teams/{team}', [OrganizationController::class, 'deleteTeam'])
        ->name('teams.delete');
    
    // User Management
    Route::get('/users', [OrganizationController::class, 'users'])
        ->name('users');
    
    Route::post('/users/invite', [OrganizationController::class, 'inviteUser'])
        ->name('users.invite');
    
    Route::put('/users/{user}/role', [OrganizationController::class, 'updateUserRole'])
        ->name('users.role.update');
    
    Route::delete('/users/{user}', [OrganizationController::class, 'removeUser'])
        ->name('users.remove');
});

// API Routes for Organization
Route::middleware(['api', 'auth:sanctum', 'tenant'])->prefix('api')->group(function () {
    
    // Organization API endpoints
    Route::get('/organization/stats', [OrganizationController::class, 'getStats'])
        ->name('api.organization.stats');
    
    Route::get('/organization/activity', [OrganizationController::class, 'getActivity'])
        ->name('api.organization.activity');
    
    Route::get('/organization/members', [OrganizationController::class, 'getMembers'])
        ->name('api.organization.members');
    
    Route::get('/organization/teams', [OrganizationController::class, 'getTeams'])
        ->name('api.organization.teams');
});
