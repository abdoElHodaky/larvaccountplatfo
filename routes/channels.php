<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Default Laravel channel (can be removed if not needed)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
|--------------------------------------------------------------------------
| Real-time Integration Channels (Simplified)
|--------------------------------------------------------------------------
|
| Simplified channels for Alova.js + GraphQL + Socket.io integration
|
*/

// Organization-based channels (simplified)
Broadcast::channel('organization.{organizationId}', function ($user, $organizationId) {
    return $user && $user->organizations()->where('id', $organizationId)->exists();
});

// Accounting updates
Broadcast::channel('accounting', function ($user) {
    return $user !== null;
});

// Inventory updates
Broadcast::channel('inventory', function ($user) {
    return $user !== null;
});

// Dashboard updates
Broadcast::channel('dashboard', function ($user) {
    return $user !== null;
});

// Legacy tenant channels (keeping for compatibility)
Broadcast::channel('tenant.{tenantId}.accounts', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId;
});

// Specific account channels
Broadcast::channel('tenant.{tenantId}.account.{accountId}', function ($user, $tenantId, $accountId) {
    return $user && $user->tenant_id === $tenantId;
});

// Balance update channels
Broadcast::channel('tenant.{tenantId}.balances', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId;
});

// Specific account balance channels
Broadcast::channel('tenant.{tenantId}.account.{accountId}.balance', function ($user, $tenantId, $accountId) {
    return $user && $user->tenant_id === $tenantId;
});

// Trial balance channels
Broadcast::channel('tenant.{tenantId}.trial-balance', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId;
});

/*
|--------------------------------------------------------------------------
| Performance Monitoring Channels
|--------------------------------------------------------------------------
|
| Channels for broadcasting performance metrics and monitoring data.
| These require appropriate permissions for viewing system metrics.
|
*/

// Performance metrics channels
Broadcast::channel('tenant.{tenantId}.performance', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId && $user->can('view-performance-metrics');
});

// Slow operations alerts
Broadcast::channel('tenant.{tenantId}.slow-operations', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId && $user->can('view-performance-metrics');
});

// System alerts
Broadcast::channel('tenant.{tenantId}.alerts', function ($user, $tenantId) {
    return $user && $user->tenant_id === $tenantId && $user->can('view-system-alerts');
});

/*
|--------------------------------------------------------------------------
| Private Channels
|--------------------------------------------------------------------------
|
| Private channels for user-specific notifications and sensitive data.
|
*/

// User-specific notifications
Broadcast::channel('private-tenant.{tenantId}.user.{userId}', function ($user, $tenantId, $userId) {
    return $user && $user->tenant_id === $tenantId && $user->id == $userId;
});

/*
|--------------------------------------------------------------------------
| Presence Channels
|--------------------------------------------------------------------------
|
| Presence channels for multi-user collaboration features.
| These show who is currently online and active in specific areas.
|
*/

// Accounting workspace presence
Broadcast::channel('presence-tenant.{tenantId}.workspace', function ($user, $tenantId) {
    if ($user && $user->tenant_id === $tenantId) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_url ?? null,
            'role' => $user->role ?? 'user',
            'joined_at' => now()->toISOString(),
        ];
    }

    return false;
});

// Account editing presence
Broadcast::channel('presence-tenant.{tenantId}.account.{accountId}', function ($user, $tenantId, $accountId) {
    if ($user && $user->tenant_id === $tenantId) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_url ?? null,
            'role' => $user->role ?? 'user',
            'editing_account' => $accountId,
            'joined_at' => now()->toISOString(),
        ];
    }

    return false;
});

/*
|--------------------------------------------------------------------------
| Admin Channels
|--------------------------------------------------------------------------
|
| Channels for administrative functions and system-wide monitoring.
|
*/

// System-wide performance monitoring (admin only)
Broadcast::channel('admin.system.performance', function ($user) {
    return $user && $user->hasRole('admin');
});

// System-wide alerts (admin only)
Broadcast::channel('admin.system.alerts', function ($user) {
    return $user && $user->hasRole('admin');
});

// Tenant management (admin only)
Broadcast::channel('admin.tenants', function ($user) {
    return $user && $user->hasRole('admin');
});

/*
|--------------------------------------------------------------------------
| Development Channels
|--------------------------------------------------------------------------
|
| Channels for development and debugging purposes.
| These should be disabled in production.
|
*/

if (app()->environment(['local', 'development', 'staging'])) {
    // Debug channel for development
    Broadcast::channel('debug.{tenantId}', function ($user, $tenantId) {
        return $user && ($user->tenant_id === $tenantId || $user->hasRole('admin'));
    });

    // Telescope integration channel
    Broadcast::channel('telescope.{tenantId}', function ($user, $tenantId) {
        return $user && ($user->tenant_id === $tenantId || $user->hasRole('admin'));
    });
}
