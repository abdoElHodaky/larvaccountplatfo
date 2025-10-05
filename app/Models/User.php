<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'timezone',
        'locale',
        'is_active',
        'last_login_at',
        'email_verified_at',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
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
     *
     * @var array<string, string>
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

        if (!$tenantUser) {
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

        if (!$tenantUser) {
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
    public function can(string $permission, Tenant $tenant = null): bool
    {
        if (!$tenant) {
            $tenant = app('tenant');
        }

        if (!$tenant) {
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
        if (!$this->hasAccessToTenant($tenant)) {
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
        return !is_null($this->email_verified_at);
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
