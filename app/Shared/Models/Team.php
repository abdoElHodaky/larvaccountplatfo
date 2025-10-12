<?php

namespace App\Shared\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Jetstream\Events\TeamCreated;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Jetstream\Events\TeamDeleted;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Jetstream\Events\TeamUpdated;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Jetstream\Team as JetstreamTeam;
use Illuminate\Database\Eloquent\Builder;

class Team extends JetstreamTeam
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'personal_team',
        'tenant_id',
        'description',
        'settings',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'personal_team' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * The event map for the model.
     */
    protected $dispatchesEvents = [
        'created' => TeamCreated::class,
        'updated' => TeamUpdated::class,
        'deleted' => TeamDeleted::class,
    ];

    /**
     * Team types for accounting operations.
     */
    public const TEAM_TYPES = [
        'accounting' => 'Accounting Team',
        'finance' => 'Finance Team',
        'audit' => 'Audit Team',
        'management' => 'Management Team',
        'operations' => 'Operations Team',
    ];

    /**
     * Default team permissions for accounting operations.
     */
    public const DEFAULT_PERMISSIONS = [
        'accounting' => [
            'accounts:read', 'accounts:create', 'accounts:update',
            'transactions:read', 'transactions:create', 'transactions:update',
            'reports:read', 'reports:generate',
        ],
        'finance' => [
            'accounts:read', 'reports:read', 'reports:generate', 'reports:export',
            'transactions:read', 'budgets:read', 'budgets:create', 'budgets:update',
        ],
        'audit' => [
            'accounts:read', 'transactions:read', 'reports:read', 'reports:generate',
            'audit:read', 'audit:create',
        ],
        'management' => [
            'accounts:read', 'reports:read', 'reports:generate', 'reports:export',
            'users:view', 'teams:view', 'dashboard:view',
        ],
        'operations' => [
            'accounts:read', 'transactions:read', 'reports:read',
        ],
    ];

    /**
     * Get the tenant that owns the team.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the team's activity logs.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the team's API tokens.
     */
    public function apiTokens(): HasMany
    {
        return $this->hasMany(PersonalAccessToken::class, 'tokenable_id')
            ->where('tokenable_type', self::class);
    }

    /**
     * Get team type from settings.
     */
    public function getTeamType(): string
    {
        return $this->settings['type'] ?? 'accounting';
    }

    /**
     * Set team type in settings.
     */
    public function setTeamType(string $type): void
    {
        $settings = $this->settings ?? [];
        $settings['type'] = $type;
        $this->update(['settings' => $settings]);
    }

    /**
     * Get default permissions for team type.
     */
    public function getDefaultPermissions(): array
    {
        $teamType = $this->getTeamType();

        return self::DEFAULT_PERMISSIONS[$teamType] ?? self::DEFAULT_PERMISSIONS['accounting'];
    }

    /**
     * Get team permissions from settings.
     */
    public function getTeamPermissions(): array
    {
        $settings = $this->settings ?? [];

        return $settings['permissions'] ?? $this->getDefaultPermissions();
    }

    /**
     * Set team permissions in settings.
     */
    public function setTeamPermissions(array $permissions): void
    {
        $settings = $this->settings ?? [];
        $settings['permissions'] = $permissions;
        $this->update(['settings' => $settings]);
    }

    /**
     * Check if team has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->getTeamPermissions();

        return in_array($permission, $permissions);
    }

    /**
     * Check if team has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        $teamPermissions = $this->getTeamPermissions();

        return ! empty(array_intersect($permissions, $teamPermissions));
    }

    /**
     * Check if team has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        $teamPermissions = $this->getTeamPermissions();

        return empty(array_diff($permissions, $teamPermissions));
    }

    /**
     * Add permission to team.
     */
    public function addPermission(string $permission): void
    {
        $permissions = $this->getTeamPermissions();
        if (! in_array($permission, $permissions)) {
            $permissions[] = $permission;
            $this->setTeamPermissions($permissions);
        }
    }

    /**
     * Remove permission from team.
     */
    public function removePermission(string $permission): void
    {
        $permissions = $this->getTeamPermissions();
        $permissions = array_filter($permissions, fn ($p) => $p !== $permission);
        $this->setTeamPermissions(array_values($permissions));
    }

    /**
     * Check if user can access this team.
     */
    public function userCanAccess(User $user): bool
    {
        // Check if user belongs to the same tenant
        if ($user->tenant_id !== $this->tenant_id) {
            return false;
        }

        // Check if user is a member of this team
        return $this->hasUser($user);
    }

    /**
     * Get team members with their roles.
     */
    public function getMembersWithRoles()
    {
        return $this->users()->withPivot(['role', 'permissions'])->get();
    }

    /**
     * Add user to team with specific role and permissions.
     */
    public function addUserWithRole(User $user, string $role = 'member', array $permissions = []): void
    {
        if (! $this->hasUser($user)) {
            $this->users()->attach($user->id, [
                'role' => $role,
                'permissions' => json_encode($permissions),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Update user role in team.
     */
    public function updateUserRole(User $user, string $role, array $permissions = []): void
    {
        if ($this->hasUser($user)) {
            $this->users()->updateExistingPivot($user->id, [
                'role' => $role,
                'permissions' => json_encode($permissions),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Get user's role in this team.
     */
    public function getUserRole(User $user): ?string
    {
        $teamUser = $this->users()->where('user_id', $user->id)->first();

        return $teamUser ? $teamUser->pivot->role : null;
    }

    /**
     * Get user's permissions in this team.
     */
    public function getUserPermissions(User $user): array
    {
        $teamUser = $this->users()->where('user_id', $user->id)->first();
        if (! $teamUser) {
            return [];
        }

        $permissions = json_decode($teamUser->pivot->permissions ?? '[]', true);

        return is_array($permissions) ? $permissions : [];
    }

    /**
     * Check if user has specific role in this team.
     */
    public function userHasRole(User $user, string $role): bool
    {
        return $this->getUserRole($user) === $role;
    }

    /**
     * Check if user has permission in this team.
     */
    public function userHasPermission(User $user, string $permission): bool
    {
        $userPermissions = $this->getUserPermissions($user);
        $teamPermissions = $this->getTeamPermissions();

        // Check both user-specific and team-wide permissions
        return in_array($permission, $userPermissions) || in_array($permission, $teamPermissions);
    }

    /**
     * Create API token for team operations.
     */
    public function createTeamToken(string $name, array $abilities = []): \Laravel\Sanctum\PersonalAccessToken
    {
        // Default team abilities based on team permissions
        $defaultAbilities = $this->getTeamPermissions();

        // Merge with provided abilities
        $abilities = array_unique(array_merge($defaultAbilities, $abilities));

        return $this->createToken("team-{$this->id}-{$name}", $abilities);
    }

    /**
     * Get team statistics.
     */
    public function getStatistics(): array
    {
        return [
            'members_count' => $this->users()->count(),
            'active_members_count' => $this->users()->where('is_active', true)->count(),
            'team_type' => $this->getTeamType(),
            'permissions_count' => count($this->getTeamPermissions()),
            'created_at' => $this->created_at,
            'is_personal' => $this->personal_team,
            'is_active' => $this->is_active,
        ];
    }

    /**
     * Scope to get active teams only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get teams for specific tenant.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get teams by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->whereJsonContains('settings->type', $type);
    }

    /**
     * Scope to get non-personal teams.
     */
    public function scopeNonPersonal($query)
    {
        return $query->where('personal_team', false);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Set default settings when creating teams
        static::creating(function ($team) {
            if (! $team->settings) {
                $team->settings = [
                    'type' => 'accounting',
                    'permissions' => self::DEFAULT_PERMISSIONS['accounting'],
                ];
            }

            // Set tenant_id from session if not provided
            if (! $team->tenant_id && session('tenant_id')) {
                $team->tenant_id = session('tenant_id');
            }
        });
    }
}
