<?php

namespace App\Features\Organization\Services;

use App\Shared\Models\Organization;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationService
{
    /**
     * Get organizations with filtering and pagination
     */
    public function getOrganizations(array $filters = []): LengthAwarePaginator
    {
        $query = Organization::query();

        // Apply search filter
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Apply country filter
        if (! empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        // Apply currency filter
        if (! empty($filters['currency'])) {
            $query->where('currency', $filters['currency']);
        }

        // Apply active status filter
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';
        $query->orderBy($sortBy, $sortDirection);

        // Paginate results
        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Create a new organization
     */
    public function createOrganization(array $data): Organization
    {
        DB::beginTransaction();
        try {
            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = $this->generateUniqueSlug($data['name']);
            }

            // Set default settings
            $data['settings'] = array_merge([
                'tenant_strategy' => 'shared',
                'date_format' => 'Y-m-d',
                'time_format' => 'H:i:s',
                'currency' => $data['currency'] ?? 'USD',
                'timezone' => $data['timezone'] ?? 'UTC',
            ], $data['settings'] ?? []);

            $organization = Organization::create($data);

            DB::commit();

            // Clear cache
            $this->clearOrganizationCache();

            return $organization;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an organization
     */
    public function updateOrganization(Organization $organization, array $data): Organization
    {
        DB::beginTransaction();
        try {
            // Update slug if name changed
            if (isset($data['name']) && $data['name'] !== $organization->name) {
                if (empty($data['slug'])) {
                    $data['slug'] = $this->generateUniqueSlug($data['name'], $organization->id);
                }
            }

            // Merge settings
            if (isset($data['settings'])) {
                $data['settings'] = array_merge($organization->settings ?? [], $data['settings']);
            }

            $organization->update($data);

            DB::commit();

            // Clear cache
            $this->clearOrganizationCache();

            return $organization->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete an organization
     */
    public function deleteOrganization(Organization $organization): bool
    {
        DB::beginTransaction();
        try {
            // Check if organization has users
            if ($organization->users()->count() > 0) {
                throw new \Exception('Cannot delete organization with existing users');
            }

            $organization->delete();

            DB::commit();

            // Clear cache
            $this->clearOrganizationCache();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get organization dashboard data
     */
    public function getOrganizationDashboard(Organization $organization): array
    {
        $cacheKey = "org_dashboard_{$organization->id}";

        return Cache::remember($cacheKey, 300, function () use ($organization) {
            return [
                'organization' => $organization,
                'user_count' => $organization->users()->count(),
                'active_user_count' => $organization->users()->where('is_active', true)->count(),
                'settings' => $organization->settings,
                'database_info' => [
                    'connection' => $organization->getDatabaseConnectionName(),
                    'strategy' => $organization->getTenantStrategy(),
                ],
                'recent_activity' => $this->getRecentActivity($organization),
            ];
        });
    }

    /**
     * Update organization settings
     */
    public function updateSettings(Organization $organization, array $settings): Organization
    {
        $currentSettings = $organization->settings ?? [];
        $newSettings = array_merge($currentSettings, $settings);

        $organization->update(['settings' => $newSettings]);

        // Clear cache
        $this->clearOrganizationCache();
        Cache::forget("org_dashboard_{$organization->id}");

        return $organization->fresh();
    }

    /**
     * Get organization statistics
     */
    public function getOrganizationStats(): array
    {
        return Cache::remember('organization_stats', 300, function () {
            return [
                'total_organizations' => Organization::count(),
                'active_organizations' => Organization::where('is_active', true)->count(),
                'organizations_by_country' => Organization::select('country', DB::raw('count(*) as count'))
                    ->groupBy('country')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get(),
                'organizations_by_currency' => Organization::select('currency', DB::raw('count(*) as count'))
                    ->groupBy('currency')
                    ->orderBy('count', 'desc')
                    ->get(),
                'tenant_strategies' => $this->getTenantStrategyStats(),
            ];
        });
    }

    /**
     * Switch organization context
     */
    public function switchOrganization(Organization $organization): void
    {
        // Set the current organization in the application context
        app()->instance('current_organization', $organization);
        app()->instance('tenant_id', $organization->id);
        app()->instance('tenant', $organization);
        app()->instance('tenant_strategy', $organization->getTenantStrategy());

        // Set database connection if using dedicated database
        if ($organization->usesDedicatedDatabase()) {
            config(['database.default' => $organization->getDatabaseConnectionName()]);
        }
    }

    /**
     * Generate unique slug for organization
     */
    private function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($slug, $excludeId)) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if slug exists
     */
    private function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $query = Organization::where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get recent activity for organization
     */
    private function getRecentActivity(Organization $organization): array
    {
        // This would typically fetch from an activity log
        // For now, return sample data
        return [
            [
                'type' => 'user_login',
                'description' => 'User logged in',
                'created_at' => now()->subHours(2),
            ],
            [
                'type' => 'settings_updated',
                'description' => 'Organization settings updated',
                'created_at' => now()->subDays(1),
            ],
        ];
    }

    /**
     * Get tenant strategy statistics
     */
    private function getTenantStrategyStats(): array
    {
        $organizations = Organization::all();

        $stats = [
            'shared' => 0,
            'dedicated' => 0,
            'clustered' => 0,
        ];

        foreach ($organizations as $org) {
            $strategy = $org->getTenantStrategy();
            if (isset($stats[$strategy])) {
                $stats[$strategy]++;
            }
        }

        return $stats;
    }

    /**
     * Clear organization cache
     */
    private function clearOrganizationCache(): void
    {
        Cache::forget('organization_stats');
        Cache::tags(['organizations'])->flush();
    }
}
