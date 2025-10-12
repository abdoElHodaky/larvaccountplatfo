<?php

namespace App\Features\Dashboard\Controllers;

use App\Features\Dashboard\Models\DashboardWidget;
use App\Features\Dashboard\Services\AdvancedDashboardService;
use App\Features\Dashboard\Services\WidgetService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdvancedDashboardController extends Controller
{
    protected AdvancedDashboardService $advancedDashboardService;

    protected WidgetService $widgetService;

    public function __construct(
        AdvancedDashboardService $advancedDashboardService,
        WidgetService $widgetService
    ) {
        $this->advancedDashboardService = $advancedDashboardService;
        $this->widgetService = $widgetService;
    }

    /**
     * Get comprehensive dashboard overview
     */
    public function overview(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->user()->organization_id ?? 1;

            $dashboardData = $this->advancedDashboardService->getDashboardOverview($organizationId);

            return response()->json([
                'success' => true,
                'data' => $dashboardData,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get user's dashboard widgets
     */
    public function widgets(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $widgets = DashboardWidget::where('organization_id', $user->organization_id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhereNull('user_id'); // Global widgets
                })
                ->active()
                ->orderBy('position_y')
                ->orderBy('position_x')
                ->get();

            // Filter widgets based on permissions
            $accessibleWidgets = $widgets->filter(function ($widget) use ($user) {
                return $widget->canView($user);
            });

            return response()->json([
                'success' => true,
                'data' => $accessibleWidgets->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard widgets',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get widget data
     */
    public function widgetData(Request $request, int $widgetId): JsonResponse
    {
        try {
            $user = $request->user();

            $widget = DashboardWidget::where('id', $widgetId)
                ->where('organization_id', $user->organization_id)
                ->firstOrFail();

            if (! $widget->canView($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this widget',
                ], 403);
            }

            $data = $this->widgetService->getWidgetData($widget);

            return response()->json([
                'success' => true,
                'data' => $data,
                'widget' => [
                    'id' => $widget->id,
                    'type' => $widget->widget_type,
                    'title' => $widget->title,
                    'refresh_interval' => $widget->getRefreshIntervalSeconds(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load widget data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new dashboard widget
     */
    public function createWidget(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'widget_type' => [
                    'required',
                    'string',
                    Rule::in([
                        DashboardWidget::TYPE_FINANCIAL_SUMMARY,
                        DashboardWidget::TYPE_REVENUE_CHART,
                        DashboardWidget::TYPE_EXPENSE_CHART,
                        DashboardWidget::TYPE_CASH_FLOW,
                        DashboardWidget::TYPE_BUDGET_OVERVIEW,
                        DashboardWidget::TYPE_FORECAST_CHART,
                        DashboardWidget::TYPE_TAX_SUMMARY,
                        DashboardWidget::TYPE_KPI_METRICS,
                        DashboardWidget::TYPE_RECENT_ACTIVITY,
                        DashboardWidget::TYPE_ALERTS,
                        DashboardWidget::TYPE_QUICK_STATS,
                        DashboardWidget::TYPE_BALANCE_SHEET,
                        DashboardWidget::TYPE_PROFIT_LOSS,
                        DashboardWidget::TYPE_ACCOUNTS_AGING,
                        DashboardWidget::TYPE_INVENTORY_STATUS,
                    ]),
                ],
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'position_x' => 'required|integer|min:0',
                'position_y' => 'required|integer|min:0',
                'width' => 'required|integer|min:1|max:12',
                'height' => 'required|integer|min:1|max:12',
                'configuration' => 'nullable|array',
                'display_options' => 'nullable|array',
                'refresh_interval' => 'nullable|integer|min:30|max:3600',
            ]);

            $user = $request->user();

            $widget = DashboardWidget::create([
                'organization_id' => $user->organization_id,
                'user_id' => $user->id,
                'widget_type' => $validated['widget_type'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'position_x' => $validated['position_x'],
                'position_y' => $validated['position_y'],
                'width' => $validated['width'],
                'height' => $validated['height'],
                'configuration' => $validated['configuration'] ?? [],
                'display_options' => $validated['display_options'] ?? [],
                'refresh_interval' => $validated['refresh_interval'] ?? 300,
                'is_active' => true,
                'data_source' => $this->getDataSourceForWidgetType($validated['widget_type']),
            ]);

            return response()->json([
                'success' => true,
                'data' => $widget,
                'message' => 'Widget created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create widget',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a dashboard widget
     */
    public function updateWidget(Request $request, int $widgetId): JsonResponse
    {
        try {
            $user = $request->user();

            $widget = DashboardWidget::where('id', $widgetId)
                ->where('organization_id', $user->organization_id)
                ->firstOrFail();

            if (! $widget->canEdit($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to edit this widget',
                ], 403);
            }

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string|max:1000',
                'position_x' => 'sometimes|integer|min:0',
                'position_y' => 'sometimes|integer|min:0',
                'width' => 'sometimes|integer|min:1|max:12',
                'height' => 'sometimes|integer|min:1|max:12',
                'configuration' => 'sometimes|array',
                'display_options' => 'sometimes|array',
                'refresh_interval' => 'sometimes|integer|min:30|max:3600',
                'is_active' => 'sometimes|boolean',
            ]);

            $widget->update($validated);

            return response()->json([
                'success' => true,
                'data' => $widget->fresh(),
                'message' => 'Widget updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update widget',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a dashboard widget
     */
    public function deleteWidget(Request $request, int $widgetId): JsonResponse
    {
        try {
            $user = $request->user();

            $widget = DashboardWidget::where('id', $widgetId)
                ->where('organization_id', $user->organization_id)
                ->firstOrFail();

            if (! $widget->canEdit($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to delete this widget',
                ], 403);
            }

            $widget->delete();

            return response()->json([
                'success' => true,
                'message' => 'Widget deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete widget',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update widget positions (bulk update for drag & drop)
     */
    public function updateWidgetPositions(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'widgets' => 'required|array',
                'widgets.*.id' => 'required|integer|exists:dashboard_widgets,id',
                'widgets.*.position_x' => 'required|integer|min:0',
                'widgets.*.position_y' => 'required|integer|min:0',
            ]);

            $user = $request->user();
            $updatedWidgets = [];

            foreach ($validated['widgets'] as $widgetData) {
                $widget = DashboardWidget::where('id', $widgetData['id'])
                    ->where('organization_id', $user->organization_id)
                    ->first();

                if ($widget && $widget->canEdit($user)) {
                    $widget->updatePosition($widgetData['position_x'], $widgetData['position_y']);
                    $updatedWidgets[] = $widget;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $updatedWidgets,
                'message' => 'Widget positions updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update widget positions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get available widget types
     */
    public function widgetTypes(): JsonResponse
    {
        $widgetTypes = [
            [
                'type' => DashboardWidget::TYPE_FINANCIAL_SUMMARY,
                'name' => 'Financial Summary',
                'description' => 'Overview of key financial metrics',
                'icon' => 'chart-line',
                'category' => 'Financial',
                'default_size' => ['width' => 6, 'height' => 4],
            ],
            [
                'type' => DashboardWidget::TYPE_REVENUE_CHART,
                'name' => 'Revenue Chart',
                'description' => 'Revenue trends over time',
                'icon' => 'trending-up',
                'category' => 'Financial',
                'default_size' => ['width' => 8, 'height' => 6],
            ],
            [
                'type' => DashboardWidget::TYPE_EXPENSE_CHART,
                'name' => 'Expense Chart',
                'description' => 'Expense breakdown and trends',
                'icon' => 'trending-down',
                'category' => 'Financial',
                'default_size' => ['width' => 8, 'height' => 6],
            ],
            [
                'type' => DashboardWidget::TYPE_CASH_FLOW,
                'name' => 'Cash Flow',
                'description' => 'Cash flow analysis',
                'icon' => 'dollar-sign',
                'category' => 'Financial',
                'default_size' => ['width' => 12, 'height' => 6],
            ],
            [
                'type' => DashboardWidget::TYPE_BUDGET_OVERVIEW,
                'name' => 'Budget Overview',
                'description' => 'Budget performance and variances',
                'icon' => 'target',
                'category' => 'Budget',
                'default_size' => ['width' => 6, 'height' => 8],
            ],
            [
                'type' => DashboardWidget::TYPE_KPI_METRICS,
                'name' => 'KPI Metrics',
                'description' => 'Key performance indicators',
                'icon' => 'bar-chart',
                'category' => 'Analytics',
                'default_size' => ['width' => 12, 'height' => 4],
            ],
            [
                'type' => DashboardWidget::TYPE_RECENT_ACTIVITY,
                'name' => 'Recent Activity',
                'description' => 'Latest transactions and activities',
                'icon' => 'clock',
                'category' => 'Activity',
                'default_size' => ['width' => 6, 'height' => 8],
            ],
            [
                'type' => DashboardWidget::TYPE_ALERTS,
                'name' => 'Alerts & Notifications',
                'description' => 'Important alerts and notifications',
                'icon' => 'bell',
                'category' => 'Alerts',
                'default_size' => ['width' => 6, 'height' => 6],
            ],
            [
                'type' => DashboardWidget::TYPE_QUICK_STATS,
                'name' => 'Quick Statistics',
                'description' => 'Key metrics at a glance',
                'icon' => 'grid',
                'category' => 'Analytics',
                'default_size' => ['width' => 12, 'height' => 3],
            ],
            [
                'type' => DashboardWidget::TYPE_BALANCE_SHEET,
                'name' => 'Balance Sheet',
                'description' => 'Assets, liabilities, and equity overview',
                'icon' => 'balance-scale',
                'category' => 'Financial',
                'default_size' => ['width' => 6, 'height' => 8],
            ],
            [
                'type' => DashboardWidget::TYPE_PROFIT_LOSS,
                'name' => 'Profit & Loss',
                'description' => 'Revenue and expense summary',
                'icon' => 'pie-chart',
                'category' => 'Financial',
                'default_size' => ['width' => 6, 'height' => 8],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $widgetTypes,
        ]);
    }

    /**
     * Get financial summary data
     */
    public function financialSummary(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->user()->organization_id ?? 1;
            $summary = $this->advancedDashboardService->getFinancialSummary($organizationId);

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get performance metrics
     */
    public function performanceMetrics(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->user()->organization_id ?? 1;
            $metrics = $this->advancedDashboardService->getPerformanceMetrics($organizationId);

            return response()->json([
                'success' => true,
                'data' => $metrics,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load performance metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get budget overview
     */
    public function budgetOverview(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->user()->organization_id ?? 1;
            $overview = $this->advancedDashboardService->getBudgetOverview($organizationId);

            return response()->json([
                'success' => true,
                'data' => $overview,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load budget overview',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get data source for widget type
     */
    private function getDataSourceForWidgetType(string $widgetType): string
    {
        return match ($widgetType) {
            DashboardWidget::TYPE_FINANCIAL_SUMMARY,
            DashboardWidget::TYPE_REVENUE_CHART,
            DashboardWidget::TYPE_EXPENSE_CHART,
            DashboardWidget::TYPE_CASH_FLOW,
            DashboardWidget::TYPE_BALANCE_SHEET,
            DashboardWidget::TYPE_PROFIT_LOSS,
            DashboardWidget::TYPE_ACCOUNTS_AGING => DashboardWidget::SOURCE_ACCOUNTING,

            DashboardWidget::TYPE_BUDGET_OVERVIEW => DashboardWidget::SOURCE_BUDGET,
            DashboardWidget::TYPE_FORECAST_CHART => DashboardWidget::SOURCE_FORECAST,
            DashboardWidget::TYPE_TAX_SUMMARY => DashboardWidget::SOURCE_TAX,
            DashboardWidget::TYPE_INVENTORY_STATUS => DashboardWidget::SOURCE_INVENTORY,

            default => DashboardWidget::SOURCE_ACCOUNTING,
        };
    }
}
