<?php

namespace App\Features\Dashboard\Contracts;

use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Pagination\LengthAwarePaginator;

interface WidgetManagementServiceInterface
{
    /**
     * Get widgets with filtering and pagination
     */
    public function getWidgets(array $filters = []): LengthAwarePaginator;

    /**
     * Create a new widget
     */
    public function createWidget(array $data): DashboardWidget;

    /**
     * Update an existing widget
     */
    public function updateWidget(DashboardWidget $widget, array $data): DashboardWidget;

    /**
     * Delete a widget
     */
    public function deleteWidget(DashboardWidget $widget): bool;

    /**
     * Duplicate a widget
     */
    public function duplicateWidget(DashboardWidget $widget, array $overrides = []): DashboardWidget;

    /**
     * Reorder widgets
     */
    public function reorderWidgets(array $widgetOrder): bool;
}

