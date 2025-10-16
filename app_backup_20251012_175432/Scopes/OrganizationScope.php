<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $organizationId = $this->getCurrentOrganizationId();

        if ($organizationId) {
            $builder->where($model->getTable().'.organization_id', $organizationId);
        }
    }

    /**
     * Extend the query builder with the needed functions.
     */
    public function extend(Builder $builder): void
    {
        $this->addWithoutOrganization($builder);
        $this->addWithOrganization($builder);
        $this->addOnlyOrganization($builder);
    }

    /**
     * Add the without-organization extension to the builder.
     */
    protected function addWithoutOrganization(Builder $builder): void
    {
        $builder->macro('withoutOrganization', function (Builder $builder) {
            return $builder->withoutGlobalScope($this);
        });
    }

    /**
     * Add the with-organization extension to the builder.
     */
    protected function addWithOrganization(Builder $builder): void
    {
        $builder->macro('withOrganization', function (Builder $builder, int $organizationId) {
            return $builder->withoutGlobalScope($this)
                ->where($builder->getModel()->getTable().'.organization_id', $organizationId);
        });
    }

    /**
     * Add the only-organization extension to the builder.
     */
    protected function addOnlyOrganization(Builder $builder): void
    {
        $builder->macro('onlyOrganization', function (Builder $builder, int $organizationId) {
            return $builder->withoutGlobalScope($this)
                ->where($builder->getModel()->getTable().'.organization_id', $organizationId);
        });
    }

    /**
     * Get the current organization ID from the application context
     */
    protected function getCurrentOrganizationId(): ?int
    {
        // Try to get from application container first
        $organizationId = app('tenant_id', null);

        if ($organizationId) {
            return $organizationId;
        }

        // Try to get from current tenant
        $tenant = app('tenant', null);
        if ($tenant) {
            return $tenant->id;
        }

        // Try to get from authenticated user (fallback)
        $user = auth()->user();
        if ($user && isset($user->organization_id)) {
            return $user->organization_id;
        }

        return null;
    }
}
