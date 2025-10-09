<?php

namespace App\Features\TenantManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tenant extends Model
{
    use HasFactory;

    protected $connection = 'landlord';

    protected $fillable = [
        'name',
        'subdomain',
        'database_name',
        'database_strategy',
        'plan',
        'status',
        'region',
        'database_host',
        'user_count',
        'monthly_transaction_count',
        'storage_usage_mb',
        'requires_data_isolation',
        'is_active',
        'settings',
        'enabled_modules',
        'migrated_at',
        'stats_updated_at',
    ];

    protected $casts = [
        'requires_data_isolation' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
        'enabled_modules' => 'array',
        'storage_usage_mb' => 'decimal:2',
        'migrated_at' => 'datetime',
        'stats_updated_at' => 'datetime',
    ];

    /**
     * Get the global users for this tenant
     */
    public function globalUsers(): HasMany
    {
        return $this->hasMany(GlobalUser::class);
    }

    /**
     * Get the users that belong to this tenant.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users')
            ->withPivot(['role', 'permissions', 'is_active', 'invited_at', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Check if tenant is on enterprise plan
     */
    public function isEnterprise(): bool
    {
        return in_array($this->plan, ['enterprise', 'premium']);
    }

    /**
     * Check if tenant requires dedicated database
     */
    public function requiresDedicatedDatabase(): bool
    {
        return $this->database_strategy === 'dedicated';
    }

    /**
     * Check if tenant is using shared database
     */
    public function isSharedDatabase(): bool
    {
        return $this->database_strategy === 'shared';
    }

    /**
     * Check if tenant is using clustered database
     */
    public function isClusteredDatabase(): bool
    {
        return $this->database_strategy === 'clustered';
    }

    /**
     * Get tenant's database connection name
     */
    public function getDatabaseConnectionName(): string
    {
        switch ($this->database_strategy) {
            case 'dedicated':
                return "tenant_{$this->id}";
            case 'clustered':
                return "cluster_{$this->region}";
            case 'shared':
            default:
                $shardNumber = (($this->id - 1) % 4) + 1;
                return "shared_shard_{$shardNumber}";
        }
    }

    /**
     * Get tenant's full URL
     */
    public function getUrlAttribute(): string
    {
        $protocol = config('app.env') === 'production' ? 'https' : 'http';
        $domain = config('app.domain', 'localhost');
        
        return "{$protocol}://{$this->subdomain}.{$domain}";
    }

    /**
     * Scope to active tenants only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to tenants by database strategy
     */
    public function scopeByStrategy($query, string $strategy)
    {
        return $query->where('database_strategy', $strategy);
    }

    /**
     * Scope to tenants by plan
     */
    public function scopeByPlan($query, string $plan)
    {
        return $query->where('plan', $plan);
    }

    /**
     * Scope to tenants by region
     */
    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    /**
     * Get tenants that need stats update
     */
    public function scopeNeedsStatsUpdate($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('stats_updated_at')
              ->orWhere('stats_updated_at', '<', now()->subHours(6));
        });
    }

    /**
     * Get promotion candidates
     */
    public function scopePromotionCandidates($query)
    {
        return $query->where('database_strategy', 'shared')
            ->where(function ($q) {
                $q->where('user_count', '>=', 1000)
                  ->orWhere('monthly_transaction_count', '>=', 100000)
                  ->orWhereIn('plan', ['enterprise', 'premium'])
                  ->orWhere('requires_data_isolation', true);
            });
    }

    /**
     * Update tenant statistics
     */
    public function updateStats(array $stats): void
    {
        $this->update(array_merge($stats, [
            'stats_updated_at' => now(),
        ]));
    }

    /**
     * Promote tenant to dedicated database
     */
    public function promoteToDedicated(): void
    {
        $this->update([
            'database_strategy' => 'dedicated',
            'database_name' => "tenant_{$this->id}_dedicated",
            'migrated_at' => now(),
        ]);
    }

    /**
     * Get tenant settings with defaults
     */
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Set tenant setting
     */
    public function setSetting(string $key, $value): void
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->update(['settings' => $settings]);
    }
}
