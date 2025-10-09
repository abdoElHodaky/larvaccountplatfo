<?php

namespace App\Shared\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Organization Scoped Trait
 * Automatically scopes models to the current organization/tenant
 */
trait OrganizationScoped
{
    /**
     * Boot the organization scoped trait for a model.
     */
    protected static function bootOrganizationScoped(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            if (static::shouldApplyOrganizationScope()) {
                $organizationId = static::getCurrentOrganizationId();
                if ($organizationId) {
                    $builder->where(
                        $builder->getModel()->getTable() . '.organization_id',
                        $organizationId
                    );
                }
            }
        });
        
        static::creating(function (Model $model) {
            if (static::shouldApplyOrganizationScope() && !$model->organization_id) {
                $organizationId = static::getCurrentOrganizationId();
                if ($organizationId) {
                    $model->organization_id = $organizationId;
                }
            }
        });
    }

    /**
     * Get the current organization ID
     */
    protected static function getCurrentOrganizationId(): ?int
    {
        // Try to get from authenticated user
        if (auth()->check() && auth()->user()->current_organization_id) {
            return auth()->user()->current_organization_id;
        }

        // Try to get from current tenant
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            return $tenant?->organization_id;
        }

        // Try to get from request context
        if (request()->has('organization_id')) {
            return (int) request()->get('organization_id');
        }

        return null;
    }

    /**
     * Determine if organization scope should be applied
     */
    protected static function shouldApplyOrganizationScope(): bool
    {
        // Skip scoping in console commands unless explicitly enabled
        if (app()->runningInConsole() && !config('tenant.scope_in_console', false)) {
            return false;
        }

        // Skip scoping for system operations
        if (app()->bound('system.operation') && app('system.operation')) {
            return false;
        }

        // Skip scoping if explicitly disabled
        if (app()->bound('organization.scope.disabled') && app('organization.scope.disabled')) {
            return false;
        }

        return true;
    }

    /**
     * Scope query to specific organization
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where($this->getTable() . '.organization_id', $organizationId);
    }

    /**
     * Scope query to current organization
     */
    public function scopeForCurrentOrganization(Builder $query): Builder
    {
        $organizationId = static::getCurrentOrganizationId();
        
        if (!$organizationId) {
            // Return empty result if no organization context
            return $query->whereRaw('1 = 0');
        }

        return $query->forOrganization($organizationId);
    }

    /**
     * Execute query without organization scope
     */
    public static function withoutOrganizationScope(callable $callback)
    {
        app()->instance('organization.scope.disabled', true);
        
        try {
            return $callback();
        } finally {
            app()->forgetInstance('organization.scope.disabled');
        }
    }

    /**
     * Execute query for specific organization
     */
    public static function forOrganizationContext(int $organizationId, callable $callback)
    {
        $previousOrgId = static::getCurrentOrganizationId();
        
        // Temporarily set organization context
        if (auth()->check()) {
            $originalOrgId = auth()->user()->current_organization_id;
            auth()->user()->current_organization_id = $organizationId;
        }
        
        try {
            return $callback();
        } finally {
            // Restore original organization context
            if (auth()->check() && isset($originalOrgId)) {
                auth()->user()->current_organization_id = $originalOrgId;
            }
        }
    }

    /**
     * Get all organizations that have records for this model
     */
    public static function getOrganizationsWithRecords(): \Illuminate\Support\Collection
    {
        return static::withoutOrganizationScope(function () {
            return static::select('organization_id')
                ->distinct()
                ->whereNotNull('organization_id')
                ->pluck('organization_id');
        });
    }

    /**
     * Check if model belongs to current organization
     */
    public function belongsToCurrentOrganization(): bool
    {
        $currentOrgId = static::getCurrentOrganizationId();
        return $currentOrgId && $this->organization_id === $currentOrgId;
    }

    /**
     * Check if model belongs to specific organization
     */
    public function belongsToOrganization(int $organizationId): bool
    {
        return $this->organization_id === $organizationId;
    }

    /**
     * Get the organization relationship
     */
    public function organization()
    {
        return $this->belongsTo(\App\Models\Organization::class);
    }

    /**
     * Ensure organization_id is in fillable array
     */
    public function initializeOrganizationScoped(): void
    {
        if (!in_array('organization_id', $this->fillable)) {
            $this->fillable[] = 'organization_id';
        }
    }
}
