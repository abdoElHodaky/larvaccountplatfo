<?php

namespace App\Features\Dashboard\Events;

use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WidgetConfigured
{
    use Dispatchable, SerializesModels;

    public DashboardWidget $widget;
    public array $oldConfiguration;
    public array $newConfiguration;

    public function __construct(DashboardWidget $widget, array $oldConfiguration, array $newConfiguration)
    {
        $this->widget = $widget;
        $this->oldConfiguration = $oldConfiguration;
        $this->newConfiguration = $newConfiguration;
    }
}

