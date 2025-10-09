<?php

namespace App\Shared\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends HybridModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'tax_number',
        'currency',
        'timezone',
        'date_format',
        'time_format',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Organization doesn't need organization scope applied to itself
     */
    protected static function booted(): void
    {
        // Skip the parent booted method for Organization model
        // as it doesn't need to be scoped by organization_id
    }

    /**
     * Get the users for this organization
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the database connection name for this organization
     */
    public function getDatabaseConnectionName(): string
    {
        // Default to the default connection
        $connectionName = 'mysql';

        // Check if this organization has a dedicated database
        if (isset($this->settings['database_connection'])) {
            $connectionName = $this->settings['database_connection'];
        }

        return $connectionName;
    }

    /**
     * Get the tenant strategy for this organization
     */
    public function getTenantStrategy(): string
    {
        return $this->settings['tenant_strategy'] ?? 'shared';
    }

    /**
     * Check if this organization uses shared database
     */
    public function usesSharedDatabase(): bool
    {
        return $this->getTenantStrategy() === 'shared';
    }

    /**
     * Check if this organization uses dedicated database
     */
    public function usesDedicatedDatabase(): bool
    {
        return $this->getTenantStrategy() === 'dedicated';
    }

    /**
     * Check if this organization uses clustered database
     */
    public function usesClusteredDatabase(): bool
    {
        return $this->getTenantStrategy() === 'clustered';
    }

    /**
     * Get formatted address
     */
    public function getFormattedAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Scope for active organizations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for organizations by country
     */
    public function scopeByCountry($query, string $country)
    {
        return $query->where('country', $country);
    }

    /**
     * Get organization settings with defaults
     */
    public function getSetting(string $key, $default = null)
    {
        return $this->settings[$key] ?? $default;
    }

    /**
     * Set organization setting
     */
    public function setSetting(string $key, $value): void
    {
        $settings = $this->settings ?? [];
        $settings[$key] = $value;
        $this->settings = $settings;
        $this->save();
    }
}
