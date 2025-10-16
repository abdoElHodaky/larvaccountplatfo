<?php

namespace App\Features\Dashboard\Services\Domain;

use App\Features\Dashboard\Contracts\DashboardAnalyticsServiceInterface;
use App\Features\Dashboard\Contracts\DashboardCustomizationServiceInterface;
use App\Features\Dashboard\Contracts\DashboardExportServiceInterface;
use App\Features\Dashboard\Contracts\WidgetManagementServiceInterface;
use App\Features\Dashboard\Contracts\WidgetRenderingServiceInterface;
use App\Features\Dashboard\Contracts\WidgetConfigurationServiceInterface;
use App\Features\Dashboard\Events\DashboardUpdated;
use App\Features\Dashboard\Events\WidgetCreated;
use App\Features\Dashboard\Events\WidgetConfigured;
use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Support\Facades\Event;

/**
 * Domain service that orchestrates dashboard operations across multiple services
 */
class DashboardOrchestrationService
{
    protected WidgetManagementServiceInterface $widgetManagement;
    protected WidgetRenderingServiceInterface $widgetRendering;
    protected WidgetConfigurationServiceInterface $widgetConfiguration;
    protected DashboardAnalyticsServiceInterface $analytics;
    protected DashboardCustomizationServiceInterface $customization;
    protected DashboardExportServiceInterface $export;

    public function __construct(
        WidgetManagementServiceInterface $widgetManagement,
        WidgetRenderingServiceInterface $widgetRendering,
        WidgetConfigurationServiceInterface $widgetConfiguration,
        DashboardAnalyticsServiceInterface $analytics,
        DashboardCustomizationServiceInterface $customization,
        DashboardExportServiceInterface $export
    ) {
        $this->widgetManagement = $widgetManagement;
        $this->widgetRendering = $widgetRendering;
        $this->widgetConfiguration = $widgetConfiguration;
        $this->analytics = $analytics;
        $this->customization = $customization;
        $this->export = $export;
    }

    /**
     * Get complete dashboard for a user
     */
    public function getDashboard(int $organizationId, int $userId): array
    {
        // Get layout and preferences
        $layout = $this->customization->getDashboardLayout($organizationId, $userId);
        $preferences = $this->customization->getDashboardPreferences($organizationId, $userId);

        // Get widgets
        $widgets = $this->widgetManagement->getWidgets([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'is_active' => true,
        ]);

        // Render widget data
        $renderedWidgets = [];
        foreach ($widgets as $widget) {
            $renderedWidgets[] = [
                'widget' => $widget,
                'data' => $this->widgetRendering->getCachedWidgetData($widget),
                'metrics' => $this->widgetRendering->getWidgetMetrics($widget),
            ];
        }

        // Get analytics overview
        $overview = $this->analytics->getDashboardOverview($organizationId);

        return [
            'layout' => $layout,
            'preferences' => $preferences,
            'widgets' => $renderedWidgets,
            'overview' => $overview,
            'metadata' => [
                'total_widgets' => count($renderedWidgets),
                'active_widgets' => count(array_filter($renderedWidgets, fn($w) => $w['widget']->is_active)),
                'last_updated' => now(),
            ],
        ];
    }

    /**
     * Create a new widget with full configuration
     */
    public function createConfiguredWidget(array $widgetData): DashboardWidget
    {
        // Apply default configuration
        if (isset($widgetData['widget_type'])) {
            $defaultConfig = $this->widgetConfiguration->applyDefaultConfiguration($widgetData['widget_type']);
            $widgetData['configuration'] = array_merge($defaultConfig, $widgetData['configuration'] ?? []);
        }

        // Validate configuration
        if (isset($widgetData['widget_type'], $widgetData['configuration'])) {
            if (!$this->widgetConfiguration->validateConfiguration($widgetData['widget_type'], $widgetData['configuration'])) {
                throw new \InvalidArgumentException('Invalid widget configuration');
            }
        }

        // Create widget
        $widget = $this->widgetManagement->createWidget($widgetData);

        // Fire event
        Event::dispatch(new WidgetCreated($widget));

        return $widget;
    }

    /**
     * Update widget configuration with validation
     */
    public function updateWidgetConfiguration(DashboardWidget $widget, array $configuration): DashboardWidget
    {
        $oldConfiguration = $widget->configuration ?? [];

        // Update configuration through the configuration service
        $updatedWidget = $this->widgetConfiguration->updateConfiguration($widget, $configuration);

        // Fire event
        Event::dispatch(new WidgetConfigured($updatedWidget, $oldConfiguration, $updatedWidget->configuration));

        return $updatedWidget;
    }

    /**
     * Customize dashboard layout with validation
     */
    public function customizeDashboard(int $organizationId, int $userId, array $layout, array $preferences = []): bool
    {
        $changes = [];

        // Update layout if provided
        if (!empty($layout)) {
            $success = $this->customization->updateDashboardLayout($organizationId, $userId, $layout);
            if ($success) {
                $changes['layout'] = $layout;
            }
        }

        // Update preferences if provided
        if (!empty($preferences)) {
            $success = $this->customization->updateDashboardPreferences($organizationId, $userId, $preferences);
            if ($success) {
                $changes['preferences'] = $preferences;
            }
        }

        // Fire event if any changes were made
        if (!empty($changes)) {
            Event::dispatch(new DashboardUpdated($organizationId, $userId, $changes, 'customization'));
        }

        return !empty($changes);
    }

    /**
     * Generate comprehensive dashboard report
     */
    public function generateDashboardReport(int $organizationId, string $reportType, array $options = []): array
    {
        // Add analytics data to options
        $options['analytics_overview'] = $this->analytics->getDashboardOverview($organizationId);
        $options['performance_metrics'] = $this->analytics->getPerformanceMetrics($organizationId);
        $options['trend_analysis'] = $this->analytics->getTrendAnalysis($organizationId);

        return $this->export->generateReport($organizationId, $reportType, $options);
    }

    /**
     * Export dashboard with all data
     */
    public function exportDashboard(int $organizationId, string $format, array $options = []): string
    {
        // Enhance options with comprehensive data
        $options['include_charts'] = $options['include_charts'] ?? true;
        $options['include_details'] = $options['include_details'] ?? true;
        $options['include_widgets'] = $options['include_widgets'] ?? true;

        return match ($format) {
            'pdf' => $this->export->exportToPdf($organizationId, $options),
            'excel' => $this->export->exportToExcel($organizationId, $options),
            'csv' => $this->export->exportToCsv($organizationId, $options),
            default => throw new \InvalidArgumentException("Unsupported export format: {$format}"),
        };
    }

    /**
     * Get dashboard performance insights
     */
    public function getDashboardPerformanceInsights(int $organizationId, int $userId): array
    {
        // Get widgets for performance analysis
        $widgets = $this->widgetManagement->getWidgets([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'is_active' => true,
        ]);

        $insights = [
            'widget_performance' => [],
            'cache_efficiency' => [],
            'recommendations' => [],
        ];

        foreach ($widgets as $widget) {
            $metrics = $this->widgetRendering->getWidgetMetrics($widget);
            
            $insights['widget_performance'][] = [
                'widget_id' => $widget->id,
                'widget_type' => $widget->widget_type,
                'render_time' => $metrics['render_time'],
                'data_size' => $metrics['data_size'],
                'cache_hit' => $metrics['cache_hit'],
            ];

            // Generate recommendations based on performance
            if ($metrics['render_time'] > 1000) { // > 1 second
                $insights['recommendations'][] = "Consider optimizing {$widget->widget_type} widget - slow render time ({$metrics['render_time']}ms)";
            }

            if (!$metrics['cache_hit']) {
                $insights['recommendations'][] = "Widget {$widget->widget_type} is not using cache effectively";
            }
        }

        // Calculate overall cache efficiency
        $totalWidgets = count($widgets);
        $cacheHits = count(array_filter($insights['widget_performance'], fn($w) => $w['cache_hit']));
        $insights['cache_efficiency'] = [
            'hit_rate' => $totalWidgets > 0 ? ($cacheHits / $totalWidgets) * 100 : 0,
            'total_widgets' => $totalWidgets,
            'cached_widgets' => $cacheHits,
        ];

        return $insights;
    }

    /**
     * Refresh all dashboard data
     */
    public function refreshDashboard(int $organizationId, int $userId): bool
    {
        // Get all widgets for the user
        $widgets = $this->widgetManagement->getWidgets([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'is_active' => true,
        ]);

        // Refresh cache for each widget
        foreach ($widgets as $widget) {
            $this->widgetRendering->refreshWidgetCache($widget);
        }

        // Fire dashboard updated event
        Event::dispatch(new DashboardUpdated($organizationId, $userId, ['refreshed_at' => now()], 'refresh'));

        return true;
    }

    /**
     * Get widget recommendations for user
     */
    public function getWidgetRecommendations(int $organizationId, int $userId): array
    {
        // Get current widgets
        $currentWidgets = $this->widgetManagement->getWidgets([
            'organization_id' => $organizationId,
            'user_id' => $userId,
        ]);

        $currentTypes = $currentWidgets->pluck('widget_type')->toArray();
        $availableTypes = array_keys($this->widgetConfiguration->getAvailableWidgetTypes());

        // Find missing widget types
        $missingTypes = array_diff($availableTypes, $currentTypes);

        $recommendations = [];
        foreach ($missingTypes as $type) {
            $typeInfo = $this->widgetConfiguration->getAvailableWidgetTypes()[$type];
            $recommendations[] = [
                'widget_type' => $type,
                'name' => $typeInfo['name'],
                'description' => $typeInfo['description'],
                'category' => $typeInfo['category'],
                'reason' => $this->getRecommendationReason($type, $currentTypes),
                'priority' => $this->calculateRecommendationPriority($type, $currentTypes),
            ];
        }

        // Sort by priority
        usort($recommendations, fn($a, $b) => $b['priority'] <=> $a['priority']);

        return array_slice($recommendations, 0, 5); // Top 5 recommendations
    }

    /**
     * Get recommendation reason for a widget type
     */
    protected function getRecommendationReason(string $widgetType, array $currentTypes): string
    {
        return match ($widgetType) {
            'financial_summary' => 'Essential for financial overview',
            'revenue_chart' => 'Track revenue trends over time',
            'expense_chart' => 'Monitor expense patterns',
            'cash_flow' => 'Critical for cash management',
            'budget_overview' => 'Stay on top of budget performance',
            'kpi_metrics' => 'Monitor key performance indicators',
            'recent_activity' => 'Stay updated with latest activities',
            'alerts' => 'Get notified of important events',
            default => 'Enhance your dashboard with additional insights',
        };
    }

    /**
     * Calculate recommendation priority
     */
    protected function calculateRecommendationPriority(string $widgetType, array $currentTypes): int
    {
        // Priority based on widget importance and current dashboard composition
        $basePriority = match ($widgetType) {
            'financial_summary' => 10,
            'revenue_chart' => 9,
            'cash_flow' => 8,
            'expense_chart' => 7,
            'budget_overview' => 6,
            'kpi_metrics' => 5,
            'alerts' => 4,
            'recent_activity' => 3,
            default => 1,
        };

        // Boost priority if dashboard is missing essential widgets
        if (empty($currentTypes)) {
            $basePriority += 5;
        }

        return $basePriority;
    }
}

