<?php

namespace App\Features\Dashboard\Contracts;

use App\Features\Dashboard\Models\DashboardWidget;

interface WidgetConfigurationServiceInterface
{
    /**
     * Get widget configuration schema
     */
    public function getConfigurationSchema(string $widgetType): array;

    /**
     * Validate widget configuration
     */
    public function validateConfiguration(string $widgetType, array $configuration): bool;

    /**
     * Apply default configuration
     */
    public function applyDefaultConfiguration(string $widgetType): array;

    /**
     * Update widget configuration
     */
    public function updateConfiguration(DashboardWidget $widget, array $configuration): DashboardWidget;

    /**
     * Get available widget types
     */
    public function getAvailableWidgetTypes(): array;

    /**
     * Get widget type capabilities
     */
    public function getWidgetTypeCapabilities(string $widgetType): array;
}

