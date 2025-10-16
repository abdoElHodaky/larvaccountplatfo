<?php

namespace App\Features\Dashboard\Tests\Unit;

use App\Features\Dashboard\Models\DashboardWidget;
use App\Features\Dashboard\Services\Application\WidgetManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Tests\TestCase;

class WidgetManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    protected WidgetManagementService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(WidgetManagementService::class);
    }

    /** @test */
    public function it_can_create_a_widget()
    {
        $widgetData = [
            'organization_id' => 1,
            'user_id' => 1,
            'widget_type' => DashboardWidget::TYPE_FINANCIAL_SUMMARY,
            'title' => 'Test Financial Summary',
            'description' => 'Test description',
            'size' => 'medium',
        ];

        $widget = $this->service->createWidget($widgetData);

        $this->assertInstanceOf(DashboardWidget::class, $widget);
        $this->assertEquals('Test Financial Summary', $widget->title);
        $this->assertEquals(DashboardWidget::TYPE_FINANCIAL_SUMMARY, $widget->widget_type);
        $this->assertNotNull($widget->configuration);
        $this->assertGreaterThan(0, $widget->position);
    }

    /** @test */
    public function it_can_get_widgets_with_filters()
    {
        // Create test widgets
        DashboardWidget::factory()->create([
            'organization_id' => 1,
            'user_id' => 1,
            'widget_type' => DashboardWidget::TYPE_FINANCIAL_SUMMARY,
            'is_active' => true,
        ]);

        DashboardWidget::factory()->create([
            'organization_id' => 1,
            'user_id' => 1,
            'widget_type' => DashboardWidget::TYPE_REVENUE_CHART,
            'is_active' => false,
        ]);

        $filters = [
            'organization_id' => 1,
            'user_id' => 1,
            'is_active' => true,
        ];

        $result = $this->service->getWidgets($filters);

        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertEquals(1, $result->total());
        $this->assertEquals(DashboardWidget::TYPE_FINANCIAL_SUMMARY, $result->first()->widget_type);
    }

    /** @test */
    public function it_can_update_a_widget()
    {
        $widget = DashboardWidget::factory()->create([
            'title' => 'Original Title',
            'description' => 'Original Description',
        ]);

        $updateData = [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
            'configuration' => ['new_setting' => 'value'],
        ];

        $updatedWidget = $this->service->updateWidget($widget, $updateData);

        $this->assertEquals('Updated Title', $updatedWidget->title);
        $this->assertEquals('Updated Description', $updatedWidget->description);
        $this->assertArrayHasKey('new_setting', $updatedWidget->configuration);
    }

    /** @test */
    public function it_can_delete_a_widget()
    {
        $widget = DashboardWidget::factory()->create();

        $result = $this->service->deleteWidget($widget);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('dashboard_widgets', ['id' => $widget->id]);
    }

    /** @test */
    public function it_can_duplicate_a_widget()
    {
        $originalWidget = DashboardWidget::factory()->create([
            'title' => 'Original Widget',
            'configuration' => ['setting' => 'value'],
        ]);

        $duplicatedWidget = $this->service->duplicateWidget($originalWidget);

        $this->assertNotEquals($originalWidget->id, $duplicatedWidget->id);
        $this->assertEquals('Original Widget (Copy)', $duplicatedWidget->title);
        $this->assertEquals($originalWidget->configuration, $duplicatedWidget->configuration);
        $this->assertEquals($originalWidget->widget_type, $duplicatedWidget->widget_type);
    }

    /** @test */
    public function it_can_reorder_widgets()
    {
        $widget1 = DashboardWidget::factory()->create(['position' => 1]);
        $widget2 = DashboardWidget::factory()->create(['position' => 2]);
        $widget3 = DashboardWidget::factory()->create(['position' => 3]);

        $newOrder = [$widget3->id, $widget1->id, $widget2->id];

        $result = $this->service->reorderWidgets($newOrder);

        $this->assertTrue($result);

        $widget1->refresh();
        $widget2->refresh();
        $widget3->refresh();

        $this->assertEquals(2, $widget1->position);
        $this->assertEquals(3, $widget2->position);
        $this->assertEquals(1, $widget3->position);
    }

    /** @test */
    public function it_applies_default_configuration_when_creating_widget()
    {
        $widgetData = [
            'organization_id' => 1,
            'user_id' => 1,
            'widget_type' => DashboardWidget::TYPE_REVENUE_CHART,
            'title' => 'Test Revenue Chart',
        ];

        $widget = $this->service->createWidget($widgetData);

        $this->assertArrayHasKey('period', $widget->configuration);
        $this->assertArrayHasKey('chart_type', $widget->configuration);
        $this->assertEquals('last_12_months', $widget->configuration['period']);
        $this->assertEquals('line', $widget->configuration['chart_type']);
    }

    /** @test */
    public function it_sets_next_position_automatically()
    {
        DashboardWidget::factory()->create([
            'organization_id' => 1,
            'user_id' => 1,
            'position' => 5,
        ]);

        $widgetData = [
            'organization_id' => 1,
            'user_id' => 1,
            'widget_type' => DashboardWidget::TYPE_FINANCIAL_SUMMARY,
            'title' => 'Test Widget',
        ];

        $widget = $this->service->createWidget($widgetData);

        $this->assertEquals(6, $widget->position);
    }
}

