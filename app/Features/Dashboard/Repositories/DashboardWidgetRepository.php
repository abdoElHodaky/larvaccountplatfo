<?php

namespace App\Features\Dashboard\Repositories;

use App\Features\Dashboard\Contracts\DashboardWidgetRepositoryInterface;
use App\Features\Dashboard\Models\DashboardWidget;
use App\Shared\Services\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * Dashboard Widget Repository using Laravel Eloquent Repository Pattern
 */
class DashboardWidgetRepository extends BaseRepository implements DashboardWidgetRepositoryInterface
{
    /**
     * Specify Model class Name
     */
    public function model(): string
    {
        return DashboardWidget::class;
    }

    /**
     * Initialize repository-specific cache configuration
     */
    protected function initializeCache(): void
    {
        parent::initializeCache();

        $this->cacheTags = array_merge($this->cacheTags, [
            'dashboard_widgets',
            'dashboard',
        ]);

        // Enable caching by default for widgets
        $this->enableCache(1800, $this->cacheTags); // 30 minutes
    }

    /**
     * Find widgets by organization and user
     */
    public function findByOrganizationAndUser(int $organizationId, ?int $userId = null): Collection
    {
        return $this->cached('findByOrganizationAndUser', [
            'org_id' => $organizationId,
            'user_id' => $userId,
        ], function () use ($organizationId, $userId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where(function ($query) use ($userId) {
                    if ($userId) {
                        $query->where('user_id', $userId)
                            ->orWhereNull('user_id'); // Include global widgets
                    } else {
                        $query->whereNull('user_id'); // Only global widgets
                    }
                })
                ->active()
                ->orderBy('position_y')
                ->orderBy('position_x')
                ->get();
        });
    }

    /**
     * Find widgets by type
     */
    public function findByType(string $widgetType, ?int $organizationId = null): Collection
    {
        $criteria = ['widget_type' => $widgetType];
        if ($organizationId) {
            $criteria['organization_id'] = $organizationId;
        }

        return $this->cached('findByType', $criteria, function () use ($widgetType, $organizationId) {
            $query = $this->model->where('widget_type', $widgetType);

            if ($organizationId) {
                $query->where('organization_id', $organizationId);
            }

            return $query->active()->get();
        });
    }

    /**
     * Get user's active widgets
     */
    public function getUserActiveWidgets(int $userId, int $organizationId): Collection
    {
        return $this->cached('getUserActiveWidgets', [
            'user_id' => $userId,
            'org_id' => $organizationId,
        ], function () use ($userId, $organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->active()
                ->orderBy('position_y')
                ->orderBy('position_x')
                ->get();
        });
    }

    /**
     * Get global widgets for organization
     */
    public function getGlobalWidgets(int $organizationId): Collection
    {
        return $this->cached('getGlobalWidgets', ['org_id' => $organizationId], function () use ($organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->whereNull('user_id')
                ->active()
                ->orderBy('position_y')
                ->orderBy('position_x')
                ->get();
        });
    }

    /**
     * Update widget position
     */
    public function updatePosition(int $widgetId, int $positionX, int $positionY): bool
    {
        $result = $this->model
            ->where('id', $widgetId)
            ->update([
                'position_x' => $positionX,
                'position_y' => $positionY,
                'updated_at' => now(),
            ]);

        // Clear cache after position update
        $this->clearCache();

        return $result > 0;
    }

    /**
     * Bulk update widget positions
     */
    public function bulkUpdatePositions(array $positions): bool
    {
        $success = true;

        foreach ($positions as $position) {
            if (! isset($position['id'], $position['position_x'], $position['position_y'])) {
                continue;
            }

            $result = $this->updatePosition(
                $position['id'],
                $position['position_x'],
                $position['position_y']
            );

            if (! $result) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Get widgets by data source
     */
    public function findByDataSource(string $dataSource, ?int $organizationId = null): Collection
    {
        $criteria = ['data_source' => $dataSource];
        if ($organizationId) {
            $criteria['organization_id'] = $organizationId;
        }

        return $this->cached('findByDataSource', $criteria, function () use ($dataSource, $organizationId) {
            $query = $this->model->where('data_source', $dataSource);

            if ($organizationId) {
                $query->where('organization_id', $organizationId);
            }

            return $query->active()->get();
        });
    }

    /**
     * Get widget statistics
     */
    public function getWidgetStatistics(int $organizationId): array
    {
        return $this->cached('getWidgetStatistics', ['org_id' => $organizationId], function () use ($organizationId) {
            $stats = $this->model
                ->where('organization_id', $organizationId)
                ->selectRaw('
                    widget_type,
                    COUNT(*) as total_count,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
                    SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as global_count,
                    AVG(refresh_interval) as avg_refresh_interval
                ')
                ->groupBy('widget_type')
                ->get()
                ->keyBy('widget_type');

            return [
                'by_type' => $stats->toArray(),
                'totals' => [
                    'total_widgets' => $stats->sum('total_count'),
                    'active_widgets' => $stats->sum('active_count'),
                    'global_widgets' => $stats->sum('global_count'),
                    'user_widgets' => $stats->sum('total_count') - $stats->sum('global_count'),
                ],
            ];
        });
    }

    /**
     * Search widgets
     */
    public function searchWidgets(string $search, int $organizationId, int $limit = 20): Collection
    {
        return $this->model
            ->where('organization_id', $organizationId)
            ->where(function ($query) use ($search) {
                $query->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('widget_type', 'LIKE', "%{$search}%");
            })
            ->active()
            ->limit($limit)
            ->get();
    }

    /**
     * Get widgets that need refresh
     */
    public function getWidgetsNeedingRefresh(): Collection
    {
        return $this->model
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereRaw('updated_at < DATE_SUB(NOW(), INTERVAL refresh_interval SECOND)')
                    ->orWhereNull('updated_at');
            })
            ->get();
    }

    /**
     * Clone widget for user
     */
    public function cloneWidgetForUser(int $widgetId, int $userId, array $overrides = []): ?DashboardWidget
    {
        $originalWidget = $this->findOrFail($widgetId);

        $widgetData = $originalWidget->toArray();
        unset($widgetData['id'], $widgetData['created_at'], $widgetData['updated_at']);

        $widgetData['user_id'] = $userId;
        $widgetData = array_merge($widgetData, $overrides);

        $newWidget = $this->create($widgetData);

        // Clear cache after creating new widget
        $this->clearCache();

        return $newWidget;
    }

    /**
     * Get widget usage analytics
     */
    public function getWidgetUsageAnalytics(int $organizationId, int $days = 30): array
    {
        return $this->cached('getWidgetUsageAnalytics', [
            'org_id' => $organizationId,
            'days' => $days,
        ], function () use ($organizationId, $days) {
            $startDate = now()->subDays($days);

            return [
                'most_used_types' => $this->model
                    ->where('organization_id', $organizationId)
                    ->where('updated_at', '>=', $startDate)
                    ->selectRaw('widget_type, COUNT(*) as usage_count')
                    ->groupBy('widget_type')
                    ->orderByDesc('usage_count')
                    ->limit(10)
                    ->get()
                    ->toArray(),

                'creation_trend' => $this->model
                    ->where('organization_id', $organizationId)
                    ->where('created_at', '>=', $startDate)
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as widgets_created')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->toArray(),

                'active_vs_inactive' => [
                    'active' => $this->model
                        ->where('organization_id', $organizationId)
                        ->where('is_active', true)
                        ->count(),
                    'inactive' => $this->model
                        ->where('organization_id', $organizationId)
                        ->where('is_active', false)
                        ->count(),
                ],
            ];
        });
    }
}
