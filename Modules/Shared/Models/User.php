<?php

namespace Modules\Shared\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'organization_id',
        'name',
        'email',
        'email_verified_at',
        'password',
        'role',
        'permissions',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // Apply organization scope for shared databases
        if (static::isSharedDatabase()) {
            static::addGlobalScope(new \App\Scopes\OrganizationScope);
        }

        // Auto-set organization_id when creating users in shared databases
        static::creating(function ($user) {
            if (static::isSharedDatabase() && !$user->organization_id) {
                $user->organization_id = static::getCurrentOrganizationId();
            }
        });
    }

    /**
     * Get the organization that owns this user
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope to active users only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to users by role
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope to admin users
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope to users with recent activity
     */
    public function scopeRecentlyActive($query, int $days = 30)
    {
        return $query->where('last_login_at', '>=', now()->subDays($days));
    }

    /**
     * Check if user has specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is manager
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    /**
     * Check if user has specific permission
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true; // Admins have all permissions
        }

        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions);
    }

    /**
     * Grant permission to user
     */
    public function grantPermission(string $permission): void
    {
        $permissions = $this->permissions ?? [];
        
        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            $this->update(['permissions' => $permissions]);
        }
    }

    /**
     * Revoke permission from user
     */
    public function revokePermission(string $permission): void
    {
        $permissions = $this->permissions ?? [];
        $permissions = array_diff($permissions, [$permission]);
        
        $this->update(['permissions' => array_values($permissions)]);
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    /**
     * Get user's full name with role
     */
    public function getFullNameWithRoleAttribute(): string
    {
        return "{$this->name} ({$this->role})";
    }

    /**
     * Check if user belongs to specific organization
     */
    public function belongsToOrganization(int $organizationId): bool
    {
        return $this->organization_id === $organizationId;
    }

    /**
     * Get user's display name
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->email;
    }

    /**
     * Check if current tenant is using shared database
     */
    public static function isSharedDatabase(): bool
    {
        $tenantStrategy = app('tenant_strategy', 'shared');
        return $tenantStrategy === 'shared';
    }

    /**
     * Get current organization ID
     */
    public static function getCurrentOrganizationId(): ?int
    {
        return app('tenant_id');
    }

    /**
     * Get available roles
     */
    public static function getAvailableRoles(): array
    {
        return [
            'admin' => 'Administrator',
            'manager' => 'Manager',
            'accountant' => 'Accountant',
            'user' => 'User',
        ];
    }

    /**
     * Get role display name
     */
    public function getRoleDisplayNameAttribute(): string
    {
        $roles = static::getAvailableRoles();
        return $roles[$this->role] ?? ucfirst($this->role);
    }

    /**
     * Get available permissions
     */
    public static function getAvailablePermissions(): array
    {
        return [
            'view_reports' => 'View Reports',
            'create_invoices' => 'Create Invoices',
            'manage_users' => 'Manage Users',
            'manage_settings' => 'Manage Settings',
            'export_data' => 'Export Data',
            'import_data' => 'Import Data',
            'delete_records' => 'Delete Records',
            'approve_transactions' => 'Approve Transactions',
        ];
    }
}

