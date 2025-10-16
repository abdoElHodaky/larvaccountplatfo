<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Jetstream\HasTeams;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use HasProfilePhoto;
    use HasTeams;
    use Notifiable;
    use SoftDeletes;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'role',
        'is_active',
        'last_login_at',
        'timezone',
        'locale',
        'phone',
        'job_title',
        'department',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'two_factor_recovery_codes' => 'array',
        'password' => 'hashed',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'profile_photo_url',
        'display_name',
        'initials',
    ];

    /**
     * Available user roles for accounting operations.
     */
    const ACCOUNTING_ROLES = [
        'admin' => 'Administrator',
        'accountant' => 'Accountant',
        'bookkeeper' => 'Bookkeeper',
        'auditor' => 'Auditor',
        'viewer' => 'Viewer',
        'manager' => 'Manager',
    ];

    /**
     * Role permissions mapping for accounting operations.
     */
    const ACCOUNTING_PERMISSIONS = [
        'admin' => [
            'accounts:create', 'accounts:read', 'accounts:update', 'accounts:delete',
            'reports:read', 'reports:generate', 'reports:export',
            'users:manage', 'teams:manage', 'settings:manage',
            'audit:read', 'system:admin',
        ],
        'accountant' => [
            'accounts:create', 'accounts:read', 'accounts:update',
            'reports:read', 'reports:generate', 'reports:export',
            'transactions:create', 'transactions:read', 'transactions:update',
        ],
        'bookkeeper' => [
            'accounts:create', 'accounts:read', 'accounts:update',
            'transactions:create', 'transactions:read', 'transactions:update',
            'reports:read',
        ],
        'auditor' => [
            'accounts:read', 'reports:read', 'reports:generate',
            'audit:read', 'transactions:read',
        ],
        'manager' => [
            'accounts:read', 'reports:read', 'reports:generate', 'reports:export',
            'users:view', 'teams:view',
        ],
        'viewer' => [
            'accounts:read', 'reports:read',
        ],
    ];

    /**
     * Get the user's accounting tokens with specific scopes.
     */
    public function accountingTokens()
    {
        return $this->tokens()->where('name', 'like', 'accounting-%');
    }

    /**
     * Check if user has a specific accounting role.
     */
    public function hasAccountingRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user has any of the given accounting roles.
     */
    public function hasAnyAccountingRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    /**
     * Check if user has a specific accounting permission.
     */
    public function hasAccountingPermission(string $permission): bool
    {
        $rolePermissions = self::ACCOUNTING_PERMISSIONS[$this->role] ?? [];

        return in_array($permission, $rolePermissions);
    }

    /**
     * Check if user has any of the given accounting permissions.
     */
    public function hasAnyAccountingPermission(array $permissions): bool
    {
        $rolePermissions = self::ACCOUNTING_PERMISSIONS[$this->role] ?? [];

        return ! empty(array_intersect($permissions, $rolePermissions));
    }

    /**
     * Check if user has all of the given accounting permissions.
     */
    public function hasAllAccountingPermissions(array $permissions): bool
    {
        $rolePermissions = self::ACCOUNTING_PERMISSIONS[$this->role] ?? [];

        return empty(array_diff($permissions, $rolePermissions));
    }

    /**
     * Get all accounting permissions for the user's role.
     */
    public function getAccountingPermissions(): array
    {
        return self::ACCOUNTING_PERMISSIONS[$this->role] ?? [];
    }

    /**
     * Check if user can access accounting features.
     */
    public function canAccessAccounting(): bool
    {
        return $this->hasAnyAccountingPermission([
            'accounts:read', 'accounts:create', 'accounts:update', 'accounts:delete',
        ]);
    }

    /**
     * Check if user can generate reports.
     */
    public function canGenerateReports(): bool
    {
        return $this->hasAccountingPermission('reports:generate');
    }

    /**
     * Check if user can manage teams.
     */
    public function canManageTeams(): bool
    {
        return $this->hasAccountingPermission('teams:manage');
    }

    /**
     * Check if user can manage users.
     */
    public function canManageUsers(): bool
    {
        return $this->hasAccountingPermission('users:manage');
    }

    /**
     * Create an API token with accounting-specific scopes.
     */
    public function createAccountingToken(string $name, array $abilities = []): \Laravel\Sanctum\PersonalAccessToken
    {
        // Default accounting abilities based on user role
        $defaultAbilities = $this->getAccountingPermissions();

        // Merge with provided abilities
        $abilities = array_unique(array_merge($defaultAbilities, $abilities));

        return $this->createToken("accounting-{$name}", $abilities);
    }

    /**
     * Get teams within the user's current tenant context.
     */
    public function contextualTeams()
    {
        $activeTenant = $this->getActiveTenant();
        if (! $activeTenant) {
            return collect();
        }

        return $this->teams()->where('tenant_id', $activeTenant->id);
    }

    /**
     * Check if user belongs to a specific team within current tenant context.
     */
    public function belongsToContextualTeam($team): bool
    {
        if (is_string($team)) {
            return $this->contextualTeams()->where('name', $team)->exists();
        }

        return $this->contextualTeams()->where('id', $team->id)->exists();
    }

    /**
     * Get the user's preferred timezone.
     */
    public function getTimezone(): string
    {
        return $this->timezone ?? config('app.timezone', 'UTC');
    }

    /**
     * Get the user's preferred locale.
     */
    public function getLocale(): string
    {
        return $this->locale ?? config('app.locale', 'en');
    }

    /**
     * Check if user is an accounting admin.
     */
    public function isAccountingAdmin(): bool
    {
        return $this->hasAccountingRole('admin');
    }

    /**
     * Get the tenants that the user belongs to.
     */
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users')
            ->withPivot(['role', 'permissions', 'is_active', 'invited_at', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get the user's audit logs.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(\Modules\Audit\Models\AuditLog::class);
    }

    /**
     * Check if user has access to a specific tenant.
     */
    public function hasAccessToTenant(Tenant $tenant): bool
    {
        return $this->tenants()
            ->where('tenant_id', $tenant->id)
            ->wherePivot('is_active', true)
            ->exists();
    }

    /**
     * Check if user has a specific role in a tenant.
     */
    public function hasRoleInTenant(Tenant $tenant, string $role): bool
    {
        return $this->tenants()
            ->where('tenant_id', $tenant->id)
            ->wherePivot('role', $role)
            ->wherePivot('is_active', true)
            ->exists();
    }

    /**
     * Check if user has module access in a tenant.
     */
    public function hasModuleAccess(Tenant $tenant, string $module): bool
    {
        $tenantUser = $this->tenants()
            ->where('tenant_id', $tenant->id)
            ->wherePivot('is_active', true)
            ->first();

        if (! $tenantUser) {
            return false;
        }

        // Admin role has access to all modules
        if ($tenantUser->pivot->role === 'admin') {
            return true;
        }

        // Check if module is in user's permissions
        $permissions = $tenantUser->pivot->permissions ?? [];

        return in_array("access-{$module}", $permissions) ||
               in_array('access-all-modules', $permissions);
    }

    /**
     * Get user's permissions for a specific tenant.
     */
    public function getPermissionsForTenant(Tenant $tenant): array
    {
        $tenantUser = $this->tenants()
            ->where('tenant_id', $tenant->id)
            ->wherePivot('is_active', true)
            ->first();

        if (! $tenantUser) {
            return [];
        }

        $permissions = $tenantUser->pivot->permissions ?? [];

        // Admin role gets all permissions
        if ($tenantUser->pivot->role === 'admin') {
            $permissions = array_merge($permissions, [
                'manage-tenant',
                'manage-users',
                'access-all-modules',
                'manage-settings',
                'view-reports',
                'manage-integrations',
            ]);
        }

        return array_unique($permissions);
    }

    /**
     * Check if user can perform a specific action in a tenant.
     */
    public function can(string $permission, ?Tenant $tenant = null): bool
    {
        if (! $tenant) {
            $tenant = app('tenant');
        }

        if (! $tenant) {
            return false;
        }

        $permissions = $this->getPermissionsForTenant($tenant);

        return in_array($permission, $permissions);
    }

    /**
     * Get the user's active tenant (from session or default).
     */
    public function getActiveTenant(): ?Tenant
    {
        // Try to get from session first
        $tenantId = session('active_tenant_id');

        if ($tenantId) {
            $tenant = $this->tenants()->where('tenant_id', $tenantId)->first();
            if ($tenant) {
                return $tenant;
            }
        }

        // Fall back to first available tenant
        return $this->tenants()->wherePivot('is_active', true)->first();
    }

    /**
     * Set the user's active tenant.
     */
    public function setActiveTenant(Tenant $tenant): bool
    {
        if (! $this->hasAccessToTenant($tenant)) {
            return false;
        }

        session(['active_tenant_id' => $tenant->id]);

        return true;
    }

    /**
     * Get user's display name.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->email;
    }

    /**
     * Get user's initials for avatar.
     */
    public function getInitialsAttribute(): string
    {
        $names = explode(' ', $this->name);
        $initials = '';

        foreach ($names as $name) {
            $initials .= strtoupper(substr($name, 0, 1));
        }

        return substr($initials, 0, 2);
    }

    /**
     * Scope to get active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get users for a specific tenant.
     */
    public function scopeForTenant($query, Tenant $tenant)
    {
        return $query->whereHas('tenants', function ($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id)
                ->wherePivot('is_active', true);
        });
    }

    /**
     * Update last login timestamp.
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    /**
     * Check if user has verified email.
     */
    public function hasVerifiedEmail(): bool
    {
        return ! is_null($this->email_verified_at);
    }

    /**
     * Mark email as verified.
     */
    public function markEmailAsVerified(): bool
    {
        return $this->forceFill([
            'email_verified_at' => $this->freshTimestamp(),
        ])->save();
    }
}
