<?php

namespace Modules\Organization\Services;

use Modules\Shared\Models\Organization;
use Modules\Shared\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
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
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Apply country filter
        if (!empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        // Apply currency filter
        if (!empty($filters['currency'])) {
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
            $data['settings'] = array_merge($this->getDefaultSettings(), $data['settings'] ?? []);

            $organization = Organization::create($data);

            DB::commit();

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

            // Merge settings with existing ones
            if (isset($data['settings'])) {
                $data['settings'] = array_merge($organization->settings ?? [], $data['settings']);
            }

            $organization->update($data);

            DB::commit();

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
            $userCount = $organization->users()->count();
            if ($userCount > 0) {
                throw new \Exception("Cannot delete organization with {$userCount} users. Please remove all users first.");
            }

            // Soft delete the organization
            $organization->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get organization statistics
     */
    public function getOrganizationStats(Organization $organization): array
    {
        return [
            'users_count' => $organization->users()->count(),
            'active_users_count' => $organization->users()->where('is_active', true)->count(),
            'admin_users_count' => $organization->users()->where('role', 'admin')->count(),
            'recent_users_count' => $organization->users()
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
            'last_activity' => $organization->users()->max('last_login_at'),
            'created_at' => $organization->created_at,
            'updated_at' => $organization->updated_at,
        ];
    }

    /**
     * Get organization settings
     */
    public function getOrganizationSettings(Organization $organization): array
    {
        return array_merge($this->getDefaultSettings(), $organization->settings ?? []);
    }

    /**
     * Update organization settings
     */
    public function updateOrganizationSettings(Organization $organization, array $settings): Organization
    {
        $currentSettings = $organization->settings ?? [];
        $newSettings = array_merge($currentSettings, $settings);

        $organization->update(['settings' => $newSettings]);

        return $organization->fresh();
    }

    /**
     * Get organization users with filtering
     */
    public function getOrganizationUsers(Organization $organization, array $filters = []): LengthAwarePaginator
    {
        $query = $organization->users();

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply role filter
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
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
     * Export organization data
     */
    public function exportOrganizationData(Organization $organization): array
    {
        return [
            'organization' => $organization->toArray(),
            'users' => $organization->users()->get()->toArray(),
            'stats' => $this->getOrganizationStats($organization),
            'settings' => $this->getOrganizationSettings($organization),
            'exported_at' => now()->toISOString(),
        ];
    }

    /**
     * Get dashboard data for organization
     */
    public function getDashboardData(Organization $organization): array
    {
        $stats = $this->getOrganizationStats($organization);
        
        return [
            'stats' => $stats,
            'recent_users' => $organization->users()
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'active_users' => $organization->users()
                ->where('is_active', true)
                ->orderBy('last_login_at', 'desc')
                ->limit(10)
                ->get(),
            'user_roles_distribution' => $this->getUserRolesDistribution($organization),
            'monthly_user_growth' => $this->getMonthlyUserGrowth($organization),
        ];
    }

    /**
     * Toggle organization status
     */
    public function toggleOrganizationStatus(Organization $organization): Organization
    {
        $organization->update(['is_active' => !$organization->is_active]);
        
        return $organization->fresh();
    }

    /**
     * Generate unique slug for organization
     */
    protected function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($slug, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if slug exists
     */
    protected function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $query = Organization::where('slug', $slug);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get default organization settings
     */
    protected function getDefaultSettings(): array
    {
        return [
            'theme' => 'default',
            'language' => 'en',
            'notifications' => [
                'email' => true,
                'browser' => true,
                'mobile' => false,
            ],
            'security' => [
                'two_factor_required' => false,
                'password_expiry_days' => 90,
                'session_timeout_minutes' => 120,
            ],
            'features' => [
                'advanced_reporting' => false,
                'api_access' => false,
                'custom_branding' => false,
            ],
            'integrations' => [],
        ];
    }

    /**
     * Get user roles distribution for organization
     */
    protected function getUserRolesDistribution(Organization $organization): array
    {
        return $organization->users()
            ->selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();
    }

    /**
     * Get monthly user growth for organization
     */
    protected function getMonthlyUserGrowth(Organization $organization): array
    {
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months[] = [
                'month' => $date->format('Y-m'),
                'count' => $organization->users()
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }

        return $months;
    }

    /**
     * Get available currencies
     */
    public function getAvailableCurrencies(): array
    {
        return [
            'USD' => 'US Dollar',
            'EUR' => 'Euro',
            'GBP' => 'British Pound',
            'CAD' => 'Canadian Dollar',
            'AUD' => 'Australian Dollar',
            'JPY' => 'Japanese Yen',
            'CHF' => 'Swiss Franc',
            'CNY' => 'Chinese Yuan',
            'INR' => 'Indian Rupee',
            'BRL' => 'Brazilian Real',
        ];
    }

    /**
     * Get available timezones
     */
    public function getAvailableTimezones(): array
    {
        return [
            'UTC' => 'UTC',
            'America/New_York' => 'Eastern Time',
            'America/Chicago' => 'Central Time',
            'America/Denver' => 'Mountain Time',
            'America/Los_Angeles' => 'Pacific Time',
            'Europe/London' => 'London',
            'Europe/Paris' => 'Paris',
            'Europe/Berlin' => 'Berlin',
            'Asia/Tokyo' => 'Tokyo',
            'Asia/Shanghai' => 'Shanghai',
            'Asia/Kolkata' => 'Mumbai',
            'Australia/Sydney' => 'Sydney',
        ];
    }

    /**
     * Get available countries
     */
    public function getAvailableCountries(): array
    {
        return [
            'US' => 'United States',
            'CA' => 'Canada',
            'GB' => 'United Kingdom',
            'DE' => 'Germany',
            'FR' => 'France',
            'IT' => 'Italy',
            'ES' => 'Spain',
            'AU' => 'Australia',
            'JP' => 'Japan',
            'CN' => 'China',
            'IN' => 'India',
            'BR' => 'Brazil',
        ];
    }
}

