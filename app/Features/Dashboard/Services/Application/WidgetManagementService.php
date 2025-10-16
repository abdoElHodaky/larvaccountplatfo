<?php

namespace App\Features\Dashboard\Services\Application;

use App\Features\Dashboard\Contracts\WidgetManagementServiceInterface;
use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class WidgetManagementService implements WidgetManagementServiceInterface
{
    /**
     * Get widgets with filtering and pagination
     */
    public function getWidgets(array $filters = []): LengthAwarePaginator
    {
        $query = DashboardWidget::query();

        // Apply organization filter
        if (!empty($filters['organization_id'])) {
            $query->where('organization_id', $filters['organization_id']);
        }

        // Apply user filter
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Apply widget type filter
        if (!empty($filters['widget_type'])) {
            $query->where('widget_type', $filters['widget_type']);
        }

        // Apply active status filter
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'position';
        $sortDirection = $filters['sort_direction'] ?? 'asc';
        $query->orderBy($sortBy, $sortDirection);

        // Paginate results
        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Create a new widget
     */
    public function createWidget(array $data): DashboardWidget
    {
        DB::beginTransaction();
        try {
            // Set default position if not provided
            if (!isset($data['position'])) {
                $data['position'] = $this->getNextPosition($data['organization_id'], $data['user_id']);
            }

            // Set default configuration
            $data['configuration'] = array_merge(
                $this->getDefaultConfiguration($data['widget_type']),
                $data['configuration'] ?? []
            );

            $widget = DashboardWidget::create($data);

            DB::commit();

            // Clear cache
            $this->clearWidgetCache($widget->organization_id, $widget->user_id);

            return $widget;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing widget
     */
    public function updateWidget(DashboardWidget $widget, array $data): DashboardWidget
    {
        DB::beginTransaction();
        try {
            // Merge configuration if provided
            if (isset($data['configuration'])) {
                $data['configuration'] = array_merge(
                    $widget->configuration ?? [],
                    $data['configuration']
                );
            }

            $widget->update($data);

            DB::commit();

            // Clear cache
            $this->clearWidgetCache($widget->organization_id, $widget->user_id);

            return $widget->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a widget
     */
    public function deleteWidget(DashboardWidget $widget): bool
    {
        DB::beginTransaction();
        try {
            $organizationId = $widget->organization_id;
            $userId = $widget->user_id;

            $widget->delete();

            // Reorder remaining widgets
            $this->reorderWidgetsAfterDeletion($organizationId, $userId, $widget->position);

            DB::commit();

            // Clear cache
            $this->clearWidgetCache($organizationId, $userId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Duplicate a widget
     */
    public function duplicateWidget(DashboardWidget $widget, array $overrides = []): DashboardWidget
    {
        $data = array_merge([
            'organization_id' => $widget->organization_id,
            'user_id' => $widget->user_id,
            'widget_type' => $widget->widget_type,
            'title' => $widget->title . ' (Copy)',
            'description' => $widget->description,
            'configuration' => $widget->configuration,
            'size' => $widget->size,
            'is_active' => $widget->is_active,
        ], $overrides);

        return $this->createWidget($data);
    }

    /**
     * Reorder widgets
     */
    public function reorderWidgets(array $widgetOrder): bool
    {
        DB::beginTransaction();
        try {
            foreach ($widgetOrder as $position => $widgetId) {
                DashboardWidget::where('id', $widgetId)
                    ->update(['position' => $position + 1]);
            }

            DB::commit();

            // Clear cache for affected widgets
            $widgets = DashboardWidget::whereIn('id', $widgetOrder)->get();
            foreach ($widgets->groupBy(['organization_id', 'user_id']) as $orgId => $orgWidgets) {
                foreach ($orgWidgets->groupBy('user_id') as $userId => $userWidgets) {
                    $this->clearWidgetCache($orgId, $userId);
                }
            }

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get the next position for a new widget
     */
    protected function getNextPosition(int $organizationId, int $userId): int
    {
        $maxPosition = DashboardWidget::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->max('position');

        return ($maxPosition ?? 0) + 1;
    }

    /**
     * Get default configuration for a widget type
     */
    protected function getDefaultConfiguration(string $widgetType): array
    {
        return match ($widgetType) {
            DashboardWidget::TYPE_FINANCIAL_SUMMARY => [
                'show_growth_rates' => true,
                'show_comparisons' => true,
                'period' => 'current_month',
            ],
            DashboardWidget::TYPE_REVENUE_CHART => [
                'period' => 'last_12_months',
                'chart_type' => 'line',
                'show_forecast' => false,
            ],
            DashboardWidget::TYPE_EXPENSE_CHART => [
                'period' => 'last_12_months',
                'chart_type' => 'bar',
                'group_by' => 'category',
            ],
            DashboardWidget::TYPE_CASH_FLOW => [
                'period' => 'last_6_months',
                'show_forecast' => true,
                'include_projections' => false,
            ],
            DashboardWidget::TYPE_BUDGET_OVERVIEW => [
                'show_utilization' => true,
                'show_variance' => true,
                'period' => 'current_year',
            ],
            default => [],
        };
    }

    /**
     * Reorder widgets after deletion
     */
    protected function reorderWidgetsAfterDeletion(int $organizationId, int $userId, int $deletedPosition): void
    {
        DashboardWidget::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->where('position', '>', $deletedPosition)
            ->decrement('position');
    }

    /**
     * Clear widget cache
     */
    protected function clearWidgetCache(int $organizationId, int $userId): void
    {
        Cache::tags(['widgets', "org_{$organizationId}", "user_{$userId}"])->flush();
    }
}

