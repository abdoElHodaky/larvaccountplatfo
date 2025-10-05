<?php

namespace Modules\Shared\Models;

use App\Scopes\OrganizationScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

abstract class HybridModel extends Model
{
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // Only apply organization scope for shared databases
        if (static::isSharedDatabase()) {
            static::addGlobalScope(new OrganizationScope);
        }

        // Auto-set organization_id when creating records in shared databases
        static::creating(function ($model) {
            if (static::isSharedDatabase() && !$model->organization_id) {
                $model->organization_id = static::getCurrentOrganizationId();
            }
        });
    }

    /**
     * Get the fillable attributes for the model.
     */
    public function getFillable(): array
    {
        $fillable = $this->fillable;

        // Add organization_id for shared databases
        if ($this->isSharedDatabase()) {
            $fillable[] = 'organization_id';
        }

        return $fillable;
    }

    /**
     * Get the hidden attributes for the model.
     */
    public function getHidden(): array
    {
        $hidden = $this->hidden;

        // Hide organization_id for dedicated databases (not needed)
        if (!$this->isSharedDatabase()) {
            $hidden[] = 'organization_id';
        }

        return $hidden;
    }

    /**
     * Check if current tenant is using shared database
     */
    public function isSharedDatabase(): bool
    {
        return static::isSharedDatabase();
    }

    /**
     * Static method to check if current tenant is using shared database
     */
    public static function isSharedDatabase(): bool
    {
        $tenantStrategy = app('tenant_strategy', 'shared');
        return $tenantStrategy === 'shared';
    }

    /**
     * Check if current tenant is using dedicated database
     */
    public function isDedicatedDatabase(): bool
    {
        return static::isDedicatedDatabase();
    }

    /**
     * Static method to check if current tenant is using dedicated database
     */
    public static function isDedicatedDatabase(): bool
    {
        $tenantStrategy = app('tenant_strategy', 'shared');
        return $tenantStrategy === 'dedicated';
    }

    /**
     * Check if current tenant is using clustered database
     */
    public function isClusteredDatabase(): bool
    {
        return static::isClusteredDatabase();
    }

    /**
     * Static method to check if current tenant is using clustered database
     */
    public static function isClusteredDatabase(): bool
    {
        $tenantStrategy = app('tenant_strategy', 'shared');
        return $tenantStrategy === 'clustered';
    }

    /**
     * Get current organization ID
     */
    public static function getCurrentOrganizationId(): ?int
    {
        return app('tenant_id');
    }

    /**
     * Get current tenant
     */
    public static function getCurrentTenant()
    {
        return app('tenant');
    }

    /**
     * Relationship to organization (only for shared databases)
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope to specific organization (for shared databases)
     */
    public function scopeForOrganization($query, int $organizationId)
    {
        if ($this->isSharedDatabase()) {
            return $query->where('organization_id', $organizationId);
        }

        return $query;
    }

    /**
     * Get the table associated with the model.
     * This can be overridden to support table prefixing or sharding
     */
    public function getTable(): string
    {
        $table = parent::getTable();

        // Add any table prefixing logic here if needed
        // For example, you might want to prefix tables for certain tenant types
        
        return $table;
    }

    /**
     * Create a new Eloquent query builder for the model.
     * This ensures the correct database connection is used
     */
    public function newQuery()
    {
        $query = parent::newQuery();

        // Ensure we're using the correct database connection
        $tenant = static::getCurrentTenant();
        if ($tenant) {
            $connection = $tenant->getDatabaseConnectionName();
            $query->getQuery()->connection = app('db')->connection($connection);
        }

        return $query;
    }

    /**
     * Get a fresh timestamp for the model.
     * Ensures timezone consistency across all tenant types
     */
    public function freshTimestamp()
    {
        $tenant = static::getCurrentTenant();
        
        if ($tenant && $tenant->timezone) {
            return now($tenant->timezone);
        }

        return now();
    }

    /**
     * Convert the model instance to an array.
     * Automatically excludes organization_id for dedicated databases
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        // Remove organization_id from output for dedicated databases
        if (!$this->isSharedDatabase() && isset($array['organization_id'])) {
            unset($array['organization_id']);
        }

        return $array;
    }

    /**
     * Handle dynamic method calls for tenant-specific functionality
     */
    public function __call($method, $parameters)
    {
        // Add any tenant-specific method handling here
        
        return parent::__call($method, $parameters);
    }

    /**
     * Handle dynamic static method calls for tenant-specific functionality
     */
    public static function __callStatic($method, $parameters)
    {
        // Add any tenant-specific static method handling here
        
        return parent::__callStatic($method, $parameters);
    }
}

