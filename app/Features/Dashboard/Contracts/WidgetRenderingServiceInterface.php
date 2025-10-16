<?php

namespace App\Features\Dashboard\Contracts;

use App\Features\Dashboard\Models\DashboardWidget;

interface WidgetRenderingServiceInterface
{
    /**
     * Get widget data for rendering
     */
    public function getWidgetData(DashboardWidget $widget): array;

    /**
     * Render widget HTML
     */
    public function renderWidget(DashboardWidget $widget): string;

    /**
     * Get widget data with caching
     */
    public function getCachedWidgetData(DashboardWidget $widget): array;

    /**
     * Refresh widget cache
     */
    public function refreshWidgetCache(DashboardWidget $widget): void;

    /**
     * Get widget performance metrics
     */
    public function getWidgetMetrics(DashboardWidget $widget): array;
}

